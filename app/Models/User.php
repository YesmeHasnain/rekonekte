<?php

namespace App\Models;

use Carbon\Carbon;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role', 'date_of_birth', 'adult_confirmed_at', 'locale', 'suspended_at', 'suspension_reason', 'last_seen_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /** Members must be at least this old to join (quotation: 18+ confirmation at sign-up). */
    public const MIN_AGE = 18;

    protected static function booted(): void
    {
        static::deleting(fn (User $user) => $user->removeOwnedData());
    }

    /** The live MySQL tables don't enforce foreign keys, so a member's data is removed here. */
    private function removeOwnedData(): void
    {
        $id = $this->id;
        $postIds = DB::table('posts')->where('user_id', $id)->pluck('id');
        $eventIds = DB::table('events')->where('user_id', $id)->pluck('id');
        $conversationIds = DB::table('conversations')->where('user_one_id', $id)->orWhere('user_two_id', $id)->pluck('id');

        $files = DB::table('photos')->where('user_id', $id)->pluck('path')
            ->merge(DB::table('posts')->where('user_id', $id)->whereNotNull('image_path')->pluck('image_path'));
        foreach ($files as $path) {
            if (str_starts_with($path, '/uploads/')) {
                File::delete(public_path(ltrim($path, '/')));
            }
        }

        DB::table('messages')->whereIn('conversation_id', $conversationIds)->orWhere('sender_id', $id)->delete();
        DB::table('conversations')->whereIn('id', $conversationIds)->delete();
        DB::table('comments')->whereIn('post_id', $postIds)->orWhere('user_id', $id)->delete();
        DB::table('post_likes')->whereIn('post_id', $postIds)->orWhere('user_id', $id)->delete();
        DB::table('reports')->where('reporter_id', $id)
            ->orWhere(fn ($q) => $q->where('reportable_type', self::class)->where('reportable_id', $id))
            ->orWhere(fn ($q) => $q->where('reportable_type', Post::class)->whereIn('reportable_id', $postIds))
            ->delete();
        DB::table('reports')->where('resolved_by', $id)->update(['resolved_by' => null]);
        DB::table('event_rsvps')->whereIn('event_id', $eventIds)->orWhere('user_id', $id)->delete();
        DB::table('events')->whereIn('id', $eventIds)->delete();
        DB::table('posts')->whereIn('id', $postIds)->delete();
        DB::table('photos')->where('user_id', $id)->delete();
        DB::table('profiles')->where('user_id', $id)->delete();
        DB::table('likes')->where('liker_id', $id)->orWhere('liked_id', $id)->delete();
        DB::table('passes')->where('user_id', $id)->orWhere('passed_id', $id)->delete();
        DB::table('blocks')->where('blocker_id', $id)->orWhere('blocked_id', $id)->delete();
        DB::table('community_group_user')->where('user_id', $id)->delete();
        DB::table('community_groups')->where('created_by', $id)->update(['created_by' => null]);
        DB::table('sessions')->where('user_id', $id)->delete();
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'date_of_birth' => 'date',
            'adult_confirmed_at' => 'datetime',
            'suspended_at' => 'datetime',
            'last_seen_at' => 'datetime',
        ];
    }

    public static function isAdult(?string $dateOfBirth): bool
    {
        return $dateOfBirth !== null && Carbon::parse($dateOfBirth)->age >= self::MIN_AGE;
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'moderator'], true);
    }

    public function isSuspended(): bool
    {
        return $this->suspended_at !== null;
    }

    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class)->orderBy('position');
    }

    public function likesGiven(): HasMany
    {
        return $this->hasMany(Like::class, 'liker_id');
    }

    public function blockedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'blocks', 'blocker_id', 'blocked_id')->withTimestamps();
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /** Events this member has RSVP'd to. */
    public function events(): BelongsToMany
    {
        return $this->belongsToMany(Event::class, 'event_rsvps')->withTimestamps();
    }

    /** True when both members liked each other. */
    public function hasMatchWith(User $other): bool
    {
        return Like::where(['liker_id' => $this->id, 'liked_id' => $other->id])->exists()
            && Like::where(['liker_id' => $other->id, 'liked_id' => $this->id])->exists();
    }

    /** Ids this member must never see: people they blocked and people who blocked them. */
    public function hiddenUserIds(): array
    {
        return Block::where('blocker_id', $this->id)->pluck('blocked_id')
            ->merge(Block::where('blocked_id', $this->id)->pluck('blocker_id'))
            ->unique()->values()->all();
    }
}
