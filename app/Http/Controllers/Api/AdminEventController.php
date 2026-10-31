<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Support\ImageUpload;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Events management (quotation §1, "simple events listing/management"): admins
 * create, edit, cancel and delete the events members see.
 */
class AdminEventController extends Controller
{
    private function gate(Request $request): void
    {
        abort_unless($request->user()?->isAdmin(), 403);
    }

    public function index(Request $request)
    {
        $this->gate($request);

        $events = Event::query()->withCount('attendees')->orderByDesc('starts_at')->limit(200)->get();

        return ['events' => $events->map(fn (Event $e) => $this->present($e))->values()];
    }

    public function store(Request $request)
    {
        $this->gate($request);
        $data = $this->validated($request);

        $event = Event::create([...$this->fields($data), 'user_id' => $request->user()->id, 'image_path' => $this->image($data)]);

        return response()->json(['event' => $this->present($event->loadCount('attendees'))], 201);
    }

    public function update(Request $request, Event $event)
    {
        $this->gate($request);
        $data = $this->validated($request);

        $event->fill($this->fields($data));
        if ($path = $this->image($data)) {
            $event->image_path = $path;
        }
        $event->save();

        return ['event' => $this->present($event->loadCount('attendees'))];
    }

    public function destroy(Request $request, Event $event)
    {
        $this->gate($request);
        $event->delete();

        return response()->noContent();
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'category' => ['nullable', 'in:music,food,dating,culture,business'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'venue' => ['nullable', 'string', 'max:160'],
            'city' => ['nullable', 'string', 'max:80'],
            'price_label' => ['nullable', 'string', 'max:40'],
            'status' => ['required', 'in:draft,published,cancelled'],
            'image' => ['nullable', 'string'],
        ]);
    }

    private function fields(array $data): array
    {
        return collect($data)->only(['title', 'description', 'category', 'starts_at', 'ends_at', 'venue', 'city', 'price_label', 'status'])->all();
    }

    private function image(array $data): ?string
    {
        if (empty($data['image']) || ! Str::startsWith($data['image'], 'data:image')) {
            return null;
        }
        $path = ImageUpload::store($data['image'], 'events');
        abort_if($path === null, 422, 'Please choose a JPG, PNG, WebP or GIF image under 8 MB.');

        return $path;
    }

    private function present(Event $e): array
    {
        return [
            'id' => $e->id,
            'title' => $e->title,
            'description' => $e->description,
            'category' => $e->category,
            'starts_at' => $e->starts_at->format('Y-m-d\TH:i'),
            'ends_at' => $e->ends_at?->format('Y-m-d\TH:i'),
            'when' => $e->starts_at->format('D, M j · g:i A'),
            'venue' => $e->venue,
            'city' => $e->city,
            'price_label' => $e->price_label,
            'image' => $e->image_path,
            'status' => $e->status,
            'going' => $e->attendees_count ?? 0,
        ];
    }
}
