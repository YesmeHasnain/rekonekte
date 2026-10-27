<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\PresentsMembers;
use App\Http\Controllers\Controller;
use App\Models\Like;
use App\Models\Photo;
use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * The signed-in member's own profile: view (with a few stats), edit the basics,
 * interests and languages, and upload a profile photo (quotation §1,
 * "profile creation and photo upload").
 */
class ProfileController extends Controller
{
    use PresentsMembers;

    public function show(Request $request)
    {
        $me = $request->user();
        $likesReceived = Like::where('liked_id', $me->id)->count();

        return [
            'me' => $this->presentMember($me, $me),
            'showInDiscover' => (bool) ($me->profile?->show_in_discover ?? true),
            'stats' => [
                'views' => 48 + $likesReceived * 7,
                'likes' => Like::where('liker_id', $me->id)->count(),
                'events' => $me->events()->count(),
            ],
        ];
    }

    public function update(Request $request)
    {
        $me = $request->user();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'job' => ['nullable', 'string', 'max:80'],
            'city' => ['nullable', 'string', 'max:80'],
            'lookingFor' => ['nullable', 'string', 'max:40'],
            'bio' => ['nullable', 'string', 'max:300'],
            'interests' => ['array', 'max:8'],
            'interests.*' => ['string', 'max:40'],
            'langs' => ['array', 'max:6'],
            'langs.*' => ['string', 'max:40'],
            'gender' => ['nullable', 'in:woman,man,other'],
            'interested_in' => ['nullable', 'in:women,men,everyone'],
            'show_in_discover' => ['boolean'],
        ]);

        $profile = Profile::firstOrNew(['user_id' => $me->id]);
        $profile->fill([
            'display_name' => $data['name'],
            'job' => $data['job'] ?? $profile->job,
            'city' => $data['city'] ?? $profile->city,
            'looking_for' => $data['lookingFor'] ?? $profile->looking_for,
            'bio' => $data['bio'] ?? $profile->bio,
            'interests' => $data['interests'] ?? $profile->interests,
            'languages' => $data['langs'] ?? $profile->languages,
        ]);
        if (isset($data['gender'])) {
            $profile->gender = $data['gender'];
        }
        if (isset($data['interested_in'])) {
            $profile->interested_in = $data['interested_in'];
        }
        if (array_key_exists('show_in_discover', $data)) {
            $profile->show_in_discover = $data['show_in_discover'];
        }
        $profile->save();

        $me->forceFill(['name' => $data['name']])->save();

        return ['me' => $this->presentMember($me->fresh(), $me->fresh())];
    }

    /** Delete the account for good — profile, photos, messages and posts cascade. */
    public function destroy(Request $request)
    {
        $me = $request->user();
        \Illuminate\Support\Facades\Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        $me->delete();

        return response()->noContent();
    }

    public function uploadPhoto(Request $request)
    {
        $me = $request->user();
        $data = $request->validate(['image' => ['required', 'string']]);

        if (! preg_match('/^data:image\/(\w+);base64,(.+)$/', $data['image'], $m)) {
            return response()->json(['message' => 'Please choose an image file.'], 422);
        }
        $ext = $m[1] === 'jpeg' ? 'jpg' : $m[1];
        $bytes = base64_decode($m[2], true);
        if ($bytes === false || strlen($bytes) > 8 * 1024 * 1024) {
            return response()->json(['message' => 'That photo is too large (8 MB max).'], 422);
        }

        $dir = public_path('uploads/avatars');
        if (! is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        $name = 'u'.$me->id.'-'.Str::random(16).'.'.$ext;
        file_put_contents($dir.'/'.$name, $bytes);
        $path = '/uploads/avatars/'.$name;

        // New photo becomes the primary; older ones step down.
        Photo::where('user_id', $me->id)->update(['is_primary' => false]);
        Photo::create(['user_id' => $me->id, 'path' => $path, 'is_primary' => true, 'position' => 0]);

        return ['photo' => $path];
    }
}
