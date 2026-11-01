<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/** A community group members can join. Counts always come from real memberships. */
class Group extends Model
{
    protected $table = 'community_groups';

    protected $fillable = ['name', 'description', 'image_path', 'created_by'];

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'community_group_user', 'community_group_id', 'user_id')->withTimestamps();
    }
}
