<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Support\ImageUpload;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/** Community groups: browse, join or leave, and start a new one. */
class GroupController extends Controller
{
    public function index(Request $request)
    {
        $me = $request->user();

        return ['groups' => Group::query()->withCount('members')
            ->withExists(['members as joined' => fn ($q) => $q->whereKey($me->id)])
            ->orderBy('id')->get()
            ->map(fn (Group $g) => $this->present($g, (bool) $g->joined))->values()];
    }

    public function store(Request $request)
    {
        $me = $request->user();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80', 'unique:community_groups,name'],
            'description' => ['nullable', 'string', 'max:300'],
            'image' => ['nullable', 'string'],
        ]);

        $path = null;
        if (! empty($data['image']) && Str::startsWith($data['image'], 'data:image')) {
            $path = ImageUpload::store($data['image'], 'groups');
            abort_if($path === null, 422, 'Please choose a JPG, PNG, WebP or GIF image under 8 MB.');
        }

        $group = Group::create(['name' => $data['name'], 'description' => $data['description'] ?? null, 'image_path' => $path, 'created_by' => $me->id]);
        $group->members()->attach($me->id);

        return response()->json(['group' => $this->present($group->loadCount('members'), true)], 201);
    }

    public function join(Request $request, Group $group)
    {
        $me = $request->user();
        $joined = ! $group->members()->whereKey($me->id)->exists();
        $joined ? $group->members()->attach($me->id) : $group->members()->detach($me->id);

        return ['joined' => $joined, 'members' => $group->members()->count()];
    }

    public function destroy(Request $request, Group $group)
    {
        abort_unless($request->user()->isAdmin(), 403);
        $group->delete();

        return response()->noContent();
    }

    private function present(Group $g, bool $joined): array
    {
        return [
            'id' => $g->id,
            'name' => $g->name,
            'description' => $g->description,
            'image' => $g->image_path,
            'members' => $g->members_count ?? 0,
            'joined' => $joined,
        ];
    }
}
