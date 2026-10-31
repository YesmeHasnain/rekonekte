<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Like;
use App\Models\Message;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * The notifications bell: recent likes received and recent messages, newest
 * first. Derived live from the data — no separate table needed for the MVP.
 */
class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $me = $request->user();
        $hidden = $me->hiddenUserIds();
        $items = collect();

        // People who liked you (most recent first).
        Like::where('liked_id', $me->id)->whereNotIn('liker_id', $hidden)
            ->latest()->limit(8)->get()->each(function (Like $l) use (&$items) {
                $u = User::with(['profile', 'photos'])->find($l->liker_id);
                if ($u) {
                    $items->push([
                        'id' => 'like-'.$l->id,
                        'photo' => optional($u->photos->firstWhere('is_primary', true))->path ?? optional($u->photos->first())->path,
                        'who' => $u->profile?->display_name ?? $u->name,
                        'action' => 'liked your profile',
                        'at' => $l->created_at,
                        'to' => '/app/members/'.$u->id,
                    ]);
                }
            });

        // Messages others sent you, grouped by conversation.
        $convos = Conversation::where('user_one_id', $me->id)->orWhere('user_two_id', $me->id)->pluck('id');
        Message::whereIn('conversation_id', $convos)->where('sender_id', '!=', $me->id)
            ->latest()->limit(12)->get()->groupBy('conversation_id')->each(function ($msgs, $cid) use (&$items, $me, $hidden) {
                $m = $msgs->first();
                if (in_array($m->sender_id, $hidden, true)) {
                    return;
                }
                $u = User::with(['profile', 'photos'])->find($m->sender_id);
                if ($u) {
                    $items->push([
                        'id' => 'msg-'.$cid,
                        'photo' => optional($u->photos->firstWhere('is_primary', true))->path ?? optional($u->photos->first())->path,
                        'who' => $u->profile?->display_name ?? $u->name,
                        'action' => 'sent you a message',
                        'at' => $m->created_at,
                        'to' => '/app/messages/'.$m->sender_id,
                        'unread' => $m->read_at === null,
                    ]);
                }
            });

        // Warnings from the moderators.
        Report::where(['reportable_type' => User::class, 'reportable_id' => $me->id, 'status' => 'warned'])
            ->latest('resolved_at')->limit(3)->get()->each(function (Report $r) use (&$items) {
                $items->push([
                    'id' => 'warn-'.$r->id,
                    'photo' => null,
                    'who' => 'Rekonekte moderators',
                    'action' => 'sent you a community guidelines warning',
                    'at' => $r->resolved_at,
                    'to' => '/terms',
                ]);
            });

        $sorted = $items->sortByDesc('at')->take(10)->values()->map(function ($n) {
            $n['time'] = $n['at']?->diffForHumans(null, true);
            unset($n['at']);

            return $n;
        });

        $unread = Message::whereIn('conversation_id', $convos)->where('sender_id', '!=', $me->id)->whereNull('read_at')->count();

        return ['notifications' => $sorted, 'unread' => $unread];
    }
}
