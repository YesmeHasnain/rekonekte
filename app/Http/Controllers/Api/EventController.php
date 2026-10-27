<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;

/**
 * Events (quotation §1): kompa nights, cook-offs and meetups, with a one-tap
 * RSVP. Published events only, soonest first.
 */
class EventController extends Controller
{
    public function index(Request $request)
    {
        $me = $request->user();

        $events = Event::query()->with('organiser')->withCount('attendees')
            ->where('status', 'published')
            ->orderBy('starts_at')->get();

        $mine = $me->events()->pluck('events.id')->all();

        return ['events' => $events->map(fn (Event $e) => $this->present($e, in_array($e->id, $mine, true)))->values()];
    }

    public function rsvp(Request $request, Event $event)
    {
        $me = $request->user();
        if ($me->events()->where('events.id', $event->id)->exists()) {
            $me->events()->detach($event->id);
            $going = false;
        } else {
            $me->events()->attach($event->id);
            $going = true;
        }

        return ['going' => $going, 'count' => $event->attendees()->count()];
    }

    private function present(Event $e, bool $mine): array
    {
        return [
            'id' => $e->id,
            'title' => $e->title,
            'date' => $e->starts_at->format('D, M j'),
            'time' => $e->starts_at->format('g:i A'),
            'city' => $e->city,
            'venue' => $e->venue,
            'image' => $e->image_path,
            'going' => $e->attendees_count ?? 0,
            'tag' => ucfirst($e->category ?? 'Event'),
            'price' => $e->price_label ?? 'Free',
            'mine' => $mine,
        ];
    }
}
