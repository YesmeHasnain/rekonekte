<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\PresentsMembers;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Discover: browse members filtered by age range, gender and city (quotation §1,
 * "Basic matching and discovery"). Suspended members, anyone who hides from
 * Discover, people already passed, and blocks (either direction) are never listed.
 */
class MemberController extends Controller
{
    use PresentsMembers;

    public function index(Request $request)
    {
        $data = $request->validate([
            'min_age' => ['nullable', 'integer', 'min:18', 'max:99'],
            'max_age' => ['nullable', 'integer', 'min:18', 'max:99'],
            'gender' => ['nullable', 'in:woman,man,other'],
            'city' => ['nullable', 'string', 'max:80'],
        ]);

        $me = $request->user();

        $q = User::query()
            ->with(['profile', 'photos'])
            ->whereNull('suspended_at')
            ->where('role', 'member')
            ->whereHas('profile', fn ($p) => $p->where('show_in_discover', true)
                ->when($data['gender'] ?? null, fn ($p, $g) => $p->where('gender', $g))
                ->when($data['city'] ?? null, fn ($p, $c) => $p->where('city', $c)));

        if ($min = $data['min_age'] ?? null) {
            $q->whereDate('date_of_birth', '<=', Carbon::now()->subYears($min));
        }
        if ($max = $data['max_age'] ?? null) {
            $q->whereDate('date_of_birth', '>', Carbon::now()->subYears($max + 1));
        }
        if ($me) {
            $q->whereKeyNot($me->id)->whereNotIn('id', $me->hiddenUserIds());
            // Hide people the member already passed on.
            $q->whereNotIn('id', \App\Models\Pass::where('user_id', $me->id)->pluck('passed_id'));
        }

        $likedIds = \App\Models\Like::where('liker_id', $me->id)->pluck('liked_id')->all();

        return $q->orderByDesc('last_seen_at')->paginate(30)
            ->through(fn (User $u) => $this->presentMember($u, $me) + ['liked' => in_array($u->id, $likedIds, true)]);
    }

    /** A single member's full profile for the member page. */
    public function show(Request $request, User $user)
    {
        $me = $request->user();
        if ($user->role !== 'member' || $user->isSuspended() || in_array($user->id, $me->hiddenUserIds(), true)) {
            abort(404);
        }

        $data = $this->presentMember($user, $me);
        $data['liked'] = \App\Models\Like::where(['liker_id' => $me->id, 'liked_id' => $user->id])->exists();
        $data['matched'] = $me->hasMatchWith($user);

        // A few "you might also like" — same gender preference, not hidden.
        $data['similar'] = User::where('role', 'member')->whereNull('suspended_at')
            ->whereKeyNot($user->id)->whereKeyNot($me->id)
            ->whereNotIn('id', $me->hiddenUserIds())
            ->whereHas('profile', fn ($p) => $p->where('gender', $user->profile?->gender)->where('show_in_discover', true))
            ->with(['profile', 'photos'])->inRandomOrder()->limit(3)->get()
            ->map(fn (User $u) => $this->presentMember($u, $me))->values();

        return ['member' => $data];
    }
}
