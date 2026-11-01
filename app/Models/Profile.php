<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Profile extends Model
{
    protected $fillable = [
        'user_id', 'display_name', 'gender', 'interested_in', 'city', 'country', 'hometown', 'job',
        'looking_for', 'bio', 'languages', 'interests', 'is_verified', 'show_in_discover', 'culture',
    ];

    protected function casts(): array
    {
        return ['languages' => 'array', 'interests' => 'array', 'is_verified' => 'boolean', 'show_in_discover' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
