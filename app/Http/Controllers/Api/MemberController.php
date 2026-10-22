<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Discover: browse members filtered by age range, gender and city (quotation §1,
 * "Basic matching and discovery"). Suspended members and anyone who hides from
 * Discover are never listed.
 */
class MemberController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate([
            'min_age' => ['nullable', 'integer', 'min:18', 'max:99'],
            'max_age' => ['nullable', 'integer', 'min:18', 'max:99'],
            'gender' => ['nullable', 'in:woman,man,other'],
            'city' => ['nullable', 'string', 'max:80'],
        ]);

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
        if ($me = $request->user()) {
            $q->whereKeyNot($me->id)->whereNotIn('id', $me->hiddenUserIds());
        }

        return $q->orderByDesc('last_seen_at')->paginate(24)->through(fn (User $u) => [
            'id' => $u->id,
            'name' => $u->profile->display_name,
            'age' => $u->date_of_birth?->age,
            'gender' => $u->profile->gender,
            'city' => $u->profile->city,
            'job' => $u->profile->job,
            'verified' => $u->profile->is_verified,
            'photo' => optional($u->photos->firstWhere('is_primary', true))->path,
            'languages' => $u->profile->languages,
            'interests' => $u->profile->interests,
        ]);
    }
}
