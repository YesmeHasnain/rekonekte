<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Admin dashboard (quotation §1, "admin/moderation panel"): community health
 * stats, the member table with suspend/reactivate, the reports queue, and
 * content moderation. Every method is gated to admin / moderator roles.
 */
class AdminController extends Controller
{
    private function gate(Request $request): void
    {
        abort_unless($request->user()?->isAdmin(), 403);
    }

    public function stats(Request $request)
    {
        $this->gate($request);

        // Sign-ups per day for the last 14 days (the little bar chart).
        $signups = collect(range(13, 0))->map(function ($d) {
            $day = Carbon::today()->subDays($d);

            return User::whereDate('created_at', $day)->count();
        })->all();

        return ['stats' => [
            'totalMembers' => User::where('role', 'member')->count(),
            'newThisWeek' => User::where('role', 'member')->where('created_at', '>=', Carbon::now()->subDays(7))->count(),
            'openReports' => Report::where('status', 'open')->count(),
            'queue' => Post::where('status', 'pending')->count(),
            'signups' => $signups,
        ]];
    }

    public function users(Request $request)
    {
        $this->gate($request);

        $flagged = Report::where('status', 'open')->where('reportable_type', User::class)
            ->pluck('reportable_id')->unique()->all();

        $users = User::where('role', 'member')->with(['profile', 'photos'])
            ->orderByDesc('created_at')->limit(200)->get();

        return ['users' => $users->map(function (User $u) use ($flagged) {
            return [
                'id' => $u->id,
                'name' => $u->profile?->display_name ?? $u->name,
                'email' => $u->email,
                'city' => $u->profile?->city,
                'joined' => $u->created_at?->format('M j'),
                'status' => $u->suspended_at ? 'suspended' : (in_array($u->id, $flagged, true) ? 'flagged' : 'active'),
                'verified' => (bool) $u->profile?->is_verified,
                'photo' => optional($u->photos->firstWhere('is_primary', true))->path ?? optional($u->photos->first())->path,
            ];
        })->values()];
    }

    public function setUserStatus(Request $request, User $user)
    {
        $this->gate($request);
        abort_if($user->role !== 'member', 422, 'Only member accounts can be managed here.');
        $data = $request->validate(['status' => ['required', 'in:active,suspended']]);

        if ($data['status'] === 'suspended') {
            $user->forceFill(['suspended_at' => now(), 'suspension_reason' => 'Suspended by moderator'])->save();
        } else {
            $user->forceFill(['suspended_at' => null, 'suspension_reason' => null])->save();
        }

        return ['status' => $data['status']];
    }

    public function reports(Request $request)
    {
        $this->gate($request);

        $reports = Report::with(['reporter.profile', 'reportable'])
            ->orderByRaw("status = 'open' desc")->orderByDesc('created_at')->limit(100)->get();

        return ['reports' => $reports->map(function (Report $r) {
            $target = $r->reportable instanceof User ? $r->reportable : null;

            return [
                'id' => $r->id,
                'target' => $target ? [
                    'id' => $target->id,
                    'name' => $target->profile?->display_name ?? $target->name,
                    'photo' => optional($target->photos()->where('is_primary', true)->first())->path ?? optional($target->photos()->first())->path,
                    'city' => $target->profile?->city,
                ] : ['id' => null, 'name' => 'Content', 'photo' => null, 'city' => null],
                'by' => $r->reporter?->profile?->display_name ?? $r->reporter?->name ?? 'A member',
                'reason' => $r->reason,
                'detail' => $r->details,
                'time' => $r->created_at?->diffForHumans(),
                'status' => $r->status === 'open' ? 'open' : 'resolved',
                'severity' => $r->severity,
                'action' => in_array($r->status, ['dismissed', 'warned', 'suspended'], true) ? $r->status : null,
                'priors' => Report::where('reportable_type', User::class)->where('reportable_id', $r->reportable_id)->count() - 1,
            ];
        })->values()];
    }

    public function resolveReport(Request $request, Report $report)
    {
        $this->gate($request);
        $data = $request->validate(['action' => ['required', 'in:dismiss,warn,suspend']]);

        $map = ['dismiss' => 'dismissed', 'warn' => 'warned', 'suspend' => 'suspended'];
        $report->forceFill(['status' => $map[$data['action']], 'resolved_by' => $request->user()->id, 'resolved_at' => now()])->save();

        if ($data['action'] === 'warn' && $report->reportable instanceof User) {
            $this->sendWarning($report->reportable);
        }

        if ($data['action'] === 'suspend' && $report->reportable instanceof User) {
            $report->reportable->forceFill(['suspended_at' => now(), 'suspension_reason' => 'Suspended after report'])->save();
        }

        return ['status' => 'resolved', 'action' => $map[$data['action']]];
    }

    public function queue(Request $request)
    {
        $this->gate($request);

        $query = fn (string $status, int $limit) => Post::where('status', $status)->whereHas('user')->with(['user.profile', 'user.photos'])
            ->orderByDesc('created_at')->limit($limit)->get();

        return [
            'queue' => $this->presentPosts($query('pending', 100)),
            'published' => $this->presentPosts($query('approved', 50)),
        ];
    }

    private function presentPosts($posts)
    {
        return $posts->map(function (Post $p) {
            $flags = Report::where('reportable_type', Post::class)->where('reportable_id', $p->id)->count();

            return [
                'id' => $p->id,
                'author' => [
                    'id' => $p->user->id,
                    'name' => $p->user->profile?->display_name ?? $p->user->name,
                    'photo' => optional($p->user->photos->firstWhere('is_primary', true))->path ?? optional($p->user->photos->first())->path,
                ],
                'cat' => ucfirst($p->category),
                'text' => $p->body,
                'time' => $p->created_at?->diffForHumans(),
                'flags' => $flags,
            ];
        })->values();
    }

    public function moderatePost(Request $request, Post $post)
    {
        $this->gate($request);
        $data = $request->validate(['action' => ['required', 'in:approve,remove']]);

        $post->forceFill([
            'status' => $data['action'] === 'approve' ? 'approved' : 'removed',
            'moderated_by' => $request->user()->id,
            'moderated_at' => now(),
        ])->save();

        return ['status' => $post->status];
    }

    private function sendWarning(User $user): void
    {
        $name = $user->profile?->display_name ?? $user->name;
        $body = "Bonjou {$name},\n\nOur moderators reviewed a report about your account and this is a formal warning. Please follow the community guidelines. Further reports may lead to suspension.\n\nLanmou · Kominote · Lakay\nRekonekte";

        try {
            Mail::raw($body, fn ($m) => $m->to($user->email)->subject('A warning about your Rekonekte account'));
        } catch (\Throwable $e) {
            // The warning still shows in the member's notifications.
            Log::warning('Rekonekte warning email failed', ['user' => $user->id, 'error' => $e->getMessage()]);
        }
    }
}
