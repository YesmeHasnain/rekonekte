<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\PresentsMembers;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Private messaging (quotation §1). Refresh-based, not real-time: the inbox and
 * a thread are plain reads, and sending stores a message. Blocked members never
 * appear and can't be messaged.
 */
class MessageController extends Controller
{
    use PresentsMembers;

    /** Inbox: every conversation I'm part of, newest first. */
    public function threads(Request $request)
    {
        $me = $request->user();
        $hidden = $me->hiddenUserIds();

        $convos = Conversation::where('user_one_id', $me->id)->orWhere('user_two_id', $me->id)
            ->with(['messages' => fn ($q) => $q->orderBy('created_at')])
            ->orderByDesc('last_message_at')->get();

        $threads = $convos->map(function (Conversation $c) use ($me, $hidden) {
            $peerId = $c->user_one_id === $me->id ? $c->user_two_id : $c->user_one_id;
            if (in_array($peerId, $hidden, true)) {
                return null;
            }
            $peer = User::with(['profile', 'photos'])->find($peerId);
            if (! $peer) {
                return null;
            }

            return [
                'id' => $c->id,
                'peer' => $this->presentMember($peer, $me),
                'unread' => $c->messages->where('sender_id', '!=', $me->id)->whereNull('read_at')->count(),
                'messages' => $c->messages->map(fn (Message $m) => $this->presentMessage($m, $me))->values(),
            ];
        })->filter()->values();

        return ['threads' => $threads];
    }

    /** Open (or create) the conversation with a member and return it. */
    public function thread(Request $request, User $user)
    {
        $me = $request->user();
        abort_if(in_array($user->id, $me->hiddenUserIds(), true), 403, 'This conversation is unavailable.');

        $c = Conversation::between($me->id, $user->id);
        $c->load(['messages' => fn ($q) => $q->orderBy('created_at')]);

        // Mark their messages as read.
        Message::where('conversation_id', $c->id)->where('sender_id', '!=', $me->id)
            ->whereNull('read_at')->update(['read_at' => now()]);

        return ['thread' => [
            'id' => $c->id,
            'peer' => $this->presentMember($user, $me),
            'unread' => 0,
            'messages' => $c->messages->map(fn (Message $m) => $this->presentMessage($m, $me))->values(),
        ]];
    }

    /** Send a message to a member (creates the conversation if needed). */
    public function send(Request $request, User $user)
    {
        $me = $request->user();
        abort_if($user->id === $me->id, 422, 'You cannot message yourself.');
        abort_if(in_array($user->id, $me->hiddenUserIds(), true), 403, 'This conversation is unavailable.');

        $data = $request->validate(['body' => ['required', 'string', 'max:2000']]);

        $c = Conversation::between($me->id, $user->id);
        $m = Message::create(['conversation_id' => $c->id, 'sender_id' => $me->id, 'body' => $data['body']]);
        $c->update(['last_message_at' => now()]);
        $me->forceFill(['last_seen_at' => now()])->save();

        return ['message' => $this->presentMessage($m, $me), 'threadId' => $c->id];
    }

    private function presentMessage(Message $m, User $me): array
    {
        return [
            'id' => $m->id,
            'from' => $m->sender_id === $me->id ? 'me' : 'them',
            'text' => $m->body,
            'at' => $this->when($m->created_at),
        ];
    }

    /** "9:12", "Yesterday", or "Mon 3" — short, human timestamps for the inbox. */
    private function when(?Carbon $t): string
    {
        if (! $t) {
            return '';
        }
        if ($t->isToday()) {
            return $t->format('g:i A');
        }
        if ($t->isYesterday()) {
            return 'Yesterday';
        }
        if ($t->gt(Carbon::now()->subDays(6))) {
            return $t->format('D');
        }

        return $t->format('M j');
    }
}
