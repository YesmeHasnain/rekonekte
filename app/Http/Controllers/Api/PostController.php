<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Post;
use App\Models\PostLike;
use App\Models\User;
use App\Support\ImageUpload;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Community board (quotation §1): housing, jobs, food and advice posts, with
 * likes and comments. New posts go to a moderation queue; approved posts (and
 * the author's own) show in the feed. Blocked members' posts are hidden.
 */
class PostController extends Controller
{
    private const CATS = ['housing', 'jobs', 'events', 'food', 'advice', 'business', 'services', 'travel', 'culture'];

    public function index(Request $request)
    {
        $me = $request->user();
        $cat = strtolower((string) $request->query('category', ''));

        $posts = Post::query()
            ->with(['user.profile', 'user.photos'])
            ->withCount(['likes', 'comments'])
            ->whereHas('user')
            ->whereNotIn('user_id', $me->hiddenUserIds())
            ->where(fn ($q) => $q->where('status', 'approved')->orWhere('user_id', $me->id))
            ->when(in_array($cat, self::CATS, true), fn ($q) => $q->where('category', $cat))
            ->orderByDesc('created_at')->limit(80)->get();

        $likedIds = PostLike::where('user_id', $me->id)->pluck('post_id')->all();

        return ['posts' => $posts->map(fn (Post $p) => $this->present($p, in_array($p->id, $likedIds, true)))->values()];
    }

    public function store(Request $request)
    {
        $me = $request->user();
        $data = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
            'category' => ['required', 'in:'.implode(',', self::CATS)],
            'image' => ['nullable', 'string'], // optional data URL / path
        ]);

        $imagePath = null;
        if (! empty($data['image']) && Str::startsWith($data['image'], 'data:image')) {
            $imagePath = ImageUpload::store($data['image'], 'posts');
            if ($imagePath === null) {
                return response()->json(['message' => 'Please choose a JPG, PNG, WebP or GIF image under 8 MB.'], 422);
            }
        }

        // Keep the kominote safe: obvious scams go straight to the queue; the
        // author still sees their own post while it waits for a moderator.
        $status = $this->looksSpammy($data['body']) ? 'pending' : 'approved';

        $post = Post::create([
            'user_id' => $me->id,
            'category' => $data['category'],
            'body' => $data['body'],
            'image_path' => $imagePath,
            'city' => $me->profile?->city,
            'status' => $status,
        ]);
        $post->loadMissing('user.profile', 'user.photos')->loadCount(['likes', 'comments']);

        return response()->json(['post' => $this->present($post, false)], 201);
    }

    public function like(Request $request, Post $post)
    {
        $me = $request->user();
        $this->abortUnlessVisible($post, $me);
        $existing = PostLike::where(['post_id' => $post->id, 'user_id' => $me->id])->first();
        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            PostLike::create(['post_id' => $post->id, 'user_id' => $me->id]);
            $liked = true;
        }

        return ['liked' => $liked, 'likes' => $post->likes()->count()];
    }

    public function comments(Request $request, Post $post)
    {
        $me = $request->user();
        $this->abortUnlessVisible($post, $me);

        return ['comments' => $post->comments()->with('user.profile', 'user.photos')
            ->whereHas('user')
            ->whereNotIn('user_id', $me->hiddenUserIds())
            ->orderBy('created_at')->get()->map(fn (Comment $c) => $this->presentComment($c))->values()];
    }

    public function comment(Request $request, Post $post)
    {
        $this->abortUnlessVisible($post, $request->user());
        $data = $request->validate(['body' => ['required', 'string', 'max:500']]);
        $c = Comment::create(['post_id' => $post->id, 'user_id' => $request->user()->id, 'body' => $data['body']]);
        $c->loadMissing('user.profile', 'user.photos');

        return response()->json(['comment' => $this->presentComment($c), 'count' => $post->comments()->count()], 201);
    }

    // ------------------------------------------------------------------

    /** Same rule as the feed: approved posts, or my own, and never a blocked member's. */
    private function abortUnlessVisible(Post $post, User $me): void
    {
        abort_if(in_array($post->user_id, $me->hiddenUserIds(), true), 404);
        abort_unless($post->status === 'approved' || $post->user_id === $me->id, 404);
    }

    private function present(Post $p, bool $liked): array
    {
        $u = $p->user;

        return [
            'id' => $p->id,
            'author' => [
                'id' => $u->id,
                'name' => $u->profile?->display_name ?? $u->name,
                'photo' => optional($u->photos->firstWhere('is_primary', true))->path ?? optional($u->photos->first())->path,
                'city' => $u->profile?->city,
                'verified' => (bool) $u->profile?->is_verified,
            ],
            'cat' => ucfirst($p->category),
            'time' => $this->ago($p->created_at),
            'status' => $p->status,
            'text' => $p->body,
            'image' => $p->image_path,
            'likes' => $p->likes_count ?? 0,
            'liked' => $liked,
            'comments' => $p->comments_count ?? 0,
        ];
    }

    private function presentComment(Comment $c): array
    {
        $u = $c->user;

        return [
            'id' => $c->id,
            'author' => $u->profile?->display_name ?? $u->name,
            'photo' => optional($u->photos->firstWhere('is_primary', true))->path ?? optional($u->photos->first())->path,
            'text' => $c->body,
            'time' => $this->ago($c->created_at),
        ];
    }

    private function ago(?Carbon $t): string
    {
        if (! $t) {
            return '';
        }
        $mins = (int) abs($t->diffInMinutes(now()));
        if ($mins < 1) {
            return 'Just now';
        }
        if ($mins < 60) {
            return $mins.'m';
        }
        if ($mins < 1440) {
            return intdiv($mins, 60).'h';
        }

        return intdiv($mins, 1440).'d';
    }

    private function looksSpammy(string $text): bool
    {
        $t = strtolower($text);
        foreach (['send me $', 'triple it', 'guaranteed', 'wire ', 'cash app me', 'crypto', 'investment opportunity'] as $flag) {
            if (str_contains($t, $flag)) {
                return true;
            }
        }

        return false;
    }
}
