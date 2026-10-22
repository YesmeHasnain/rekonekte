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
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role', 'date_of_birth', 'adult_confirmed_at', 'locale', 'suspended_at', 'suspension_reason', 'last_seen_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /** Members must be at least this old to join (quotation: 18+ confirmation at sign-up). */
    public const MIN_AGE = 18;

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
