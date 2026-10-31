<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\PresentsMembers;
use App\Http\Controllers\Controller;
use App\Models\Like;
use App\Models\Pass;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Matching (quotation §1): a like each way makes a match. Pass hides someone
 * from Discover. These drive the heart / pass buttons on the cards.
 */
class InteractionController extends Controller
{
    use PresentsMembers;

    public function like(Request $request, User $user)
    {
        $me = $request->user();
        abort_if($user->id === $me->id, 422, 'You cannot like yourself.');
        abort_if($user->role !== 'member' || $user->isSuspended() || in_array($user->id, $me->hiddenUserIds(), true), 404);

        Like::firstOrCreate(['liker_id' => $me->id, 'liked_id' => $user->id]);
        Pass::where(['user_id' => $me->id, 'passed_id' => $user->id])->delete();

        return [
            'liked' => true,
            'matched' => $me->hasMatchWith($user),
            'member' => $this->presentMember($user, $me),
        ];
    }

    public function unlike(Request $request, User $user)
    {
        Like::where(['liker_id' => $request->user()->id, 'liked_id' => $user->id])->delete();

        return ['liked' => false];
    }

    public function pass(Request $request, User $user)
    {
        $me = $request->user();
        Pass::firstOrCreate(['user_id' => $me->id, 'passed_id' => $user->id]);
        Like::where(['liker_id' => $me->id, 'liked_id' => $user->id])->delete();

        return ['passed' => true];
    }

    /** Undo every pass — "undo passes" link on Discover. */
    public function clearPasses(Request $request)
    {
        Pass::where('user_id', $request->user()->id)->delete();

        return ['cleared' => true];
    }

    /** People the member has liked (used for the profile stats + Likes view). */
    public function likes(Request $request)
    {
        $me = $request->user();
        $ids = Like::where('liker_id', $me->id)->pluck('liked_id');

        return ['likes' => User::whereIn('id', $ids)->with(['profile', 'photos'])->get()
            ->map(fn (User $u) => $this->presentMember($u, $me))->values()];
    }
}
