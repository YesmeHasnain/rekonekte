<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\PresentsMembers;
use App\Http\Controllers\Controller;
use App\Models\Block;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Safety (quotation §1): block a member (instant, silent, reversible) and report
 * a member for a moderator to review in the admin dashboard.
 */
class SafetyController extends Controller
{
    use PresentsMembers;

    public function block(Request $request, User $user)
    {
        $me = $request->user();
        abort_if($user->id === $me->id, 422, 'You cannot block yourself.');
        Block::firstOrCreate(['blocker_id' => $me->id, 'blocked_id' => $user->id]);

        return ['blocked' => true];
    }

    public function unblock(Request $request, User $user)
    {
        Block::where(['blocker_id' => $request->user()->id, 'blocked_id' => $user->id])->delete();

        return ['blocked' => false];
    }

    public function blocked(Request $request)
    {
        $me = $request->user();
        $ids = Block::where('blocker_id', $me->id)->pluck('blocked_id');

        return ['blocked' => User::whereIn('id', $ids)->with(['profile', 'photos'])->get()
            ->map(fn (User $u) => $this->presentMember($u, $me))->values()];
    }

    public function report(Request $request, User $user)
    {
        $me = $request->user();
        abort_if($user->id === $me->id, 422, 'You cannot report yourself.');
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:60'],
            'details' => ['nullable', 'string', 'max:1000'],
            'also_block' => ['boolean'],
        ]);

        // Scam / underage / hate flags jump the queue as high severity.
        $severity = preg_match('/scam|underage|hate/i', $data['reason']) ? 'high'
            : (preg_match('/harass|inappropriate/i', $data['reason']) ? 'medium' : 'low');

        Report::create([
            'reporter_id' => $me->id,
            'reportable_type' => User::class,
            'reportable_id' => $user->id,
            'reason' => $data['reason'],
            'details' => $data['details'] ?? null,
            'severity' => $severity,
            'status' => 'open',
        ]);

        if ($data['also_block'] ?? false) {
            Block::firstOrCreate(['blocker_id' => $me->id, 'blocked_id' => $user->id]);
        }

        return response()->json(['reported' => true], 201);
    }
}
