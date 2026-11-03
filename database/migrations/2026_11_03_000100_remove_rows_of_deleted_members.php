<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The live MySQL tables don't enforce foreign keys, so deleted accounts left
 * rows behind (and a post with no author broke the community feed). This
 * removes only rows that point at a user, post, event or group that no longer
 * exists. App\Models\User now removes a member's data itself when deleted.
 */
return new class extends Migration
{
    public function up(): void
    {
        $missing = fn (string $table, string $column, string $parent = 'users') => DB::table($table)
            ->whereNotNull($column)->whereNotIn($column, DB::table($parent)->select('id'))->delete();

        foreach ([
            ['profiles', 'user_id'], ['photos', 'user_id'],
            ['likes', 'liker_id'], ['likes', 'liked_id'],
            ['passes', 'user_id'], ['passes', 'passed_id'],
            ['blocks', 'blocker_id'], ['blocks', 'blocked_id'],
            ['conversations', 'user_one_id'], ['conversations', 'user_two_id'],
            ['messages', 'sender_id'], ['messages', 'conversation_id', 'conversations'],
            ['posts', 'user_id'],
            ['comments', 'user_id'], ['comments', 'post_id', 'posts'],
            ['post_likes', 'user_id'], ['post_likes', 'post_id', 'posts'],
            ['events', 'user_id'],
            ['event_rsvps', 'user_id'], ['event_rsvps', 'event_id', 'events'],
            ['community_group_user', 'user_id'], ['community_group_user', 'community_group_id', 'community_groups'],
            ['reports', 'reporter_id'],
        ] as $row) {
            $missing(...$row);
        }

        DB::table('reports')->where('reportable_type', 'App\\Models\\User')->whereNotIn('reportable_id', DB::table('users')->select('id'))->delete();
        DB::table('reports')->where('reportable_type', 'App\\Models\\Post')->whereNotIn('reportable_id', DB::table('posts')->select('id'))->delete();
        DB::table('reports')->whereNotNull('resolved_by')->whereNotIn('resolved_by', DB::table('users')->select('id'))->update(['resolved_by' => null]);
        DB::table('community_groups')->whereNotNull('created_by')->whereNotIn('created_by', DB::table('users')->select('id'))->update(['created_by' => null]);
    }

    public function down(): void
    {
        // Removed rows belonged to accounts that no longer exist.
    }
};
