<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * One place that turns a User into the member object the React app renders
 * (Discover cards, member profile, inbox rows, admin table). Keeping it here
 * means every screen shows the same name, photo, "online" rule and match score.
 */
trait PresentsMembers
{
    /** A member is "online" if we've seen them in the last 5 minutes. */
    protected function isOnline(?User $u): bool
    {
        return $u?->last_seen_at !== null && $u->last_seen_at->gt(Carbon::now()->subMinutes(5));
    }

    /**
     * A friendly, stable match score: more shared interests + same city = higher.
     * Deterministic (no random) so a member's score doesn't jump on every refresh.
     */
    protected function matchScore(User $u, ?User $me): int
    {
        if (! $me || ! $me->profile) {
            return 70 + ($u->id * 7) % 25; // stable spread when signed out
        }
        $mine = collect($me->profile->interests ?? []);
        $theirs = collect($u->profile->interests ?? []);
        $shared = $mine->intersect($theirs)->count();
        $score = 66 + $shared * 7;
        if ($u->profile->city && $u->profile->city === $me->profile->city) {
            $score += 6;
        }
        if ($u->profile->is_verified) {
            $score += 3;
        }

        return max(55, min(98, $score));
    }

    protected function presentMember(User $u, ?User $me = null): array
    {
        $u->loadMissing('profile', 'photos');

        return [
            'id' => $u->id,
            'name' => $u->profile?->display_name ?? $u->name,
            'age' => $u->date_of_birth?->age,
            'gender' => $u->profile?->gender,
            'city' => $u->profile?->city,
            'job' => $u->profile?->job,
            'verified' => (bool) $u->profile?->is_verified,
            'online' => $this->isOnline($u),
            'photo' => optional($u->photos->firstWhere('is_primary', true))->path
                ?? optional($u->photos->first())->path,
            'langs' => $u->profile?->languages ?? [],
            'interests' => $u->profile?->interests ?? [],
            'bio' => $u->profile?->bio,
            'lookingFor' => $u->profile?->looking_for,
            'match' => $this->matchScore($u, $me),
        ];
    }
}
