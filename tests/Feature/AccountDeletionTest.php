<?php

namespace Tests\Feature;

use App\Models\Block;
use App\Models\Conversation;
use App\Models\Event;
use App\Models\Group;
use App\Models\Message;
use App\Models\Post;
use App\Models\Profile;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/** Runs with foreign keys off, the way the live MySQL tables behave. */
class AccountDeletionTest extends TestCase
{
    use DatabaseMigrations;

    protected function setUp(): void
    {
        parent::setUp();
        config(['sanctum.stateful' => ['localhost']]);
        $this->withHeader('Referer', 'http://localhost/');
        Schema::disableForeignKeyConstraints();
    }

    private function member(): User
    {
        $user = User::factory()->create(['role' => 'member', 'date_of_birth' => '1995-01-01']);
        Profile::create(['user_id' => $user->id, 'display_name' => $user->name, 'gender' => 'woman', 'city' => 'Miami']);

        return $user;
    }

    /** Everything one member can leave behind, around another member. */
    private function memberWithData(User $other): User
    {
        $gone = $this->member();
        $event = Event::create(['user_id' => $other->id, 'title' => 'E', 'starts_at' => now()->addDay()]);
        $event->attendees()->attach($gone->id);
        $post = Post::create(['user_id' => $gone->id, 'category' => 'food', 'body' => 'Bye', 'status' => 'approved']);
        $otherPost = Post::create(['user_id' => $other->id, 'category' => 'food', 'body' => 'Stay', 'status' => 'approved']);
        DB::table('comments')->insert(['post_id' => $otherPost->id, 'user_id' => $gone->id, 'body' => 'Hi']);
        DB::table('post_likes')->insert(['post_id' => $otherPost->id, 'user_id' => $gone->id]);
        DB::table('comments')->insert(['post_id' => $post->id, 'user_id' => $other->id, 'body' => 'Hi']);
        DB::table('likes')->insert(['liker_id' => $gone->id, 'liked_id' => $other->id]);
        Block::create(['blocker_id' => $other->id, 'blocked_id' => $gone->id]);
        $c = Conversation::between($gone->id, $other->id);
        Message::create(['conversation_id' => $c->id, 'sender_id' => $gone->id, 'body' => 'Hi']);
        Report::create(['reporter_id' => $gone->id, 'reportable_type' => User::class, 'reportable_id' => $other->id, 'reason' => 'x', 'severity' => 'low', 'status' => 'open']);
        Report::create(['reporter_id' => $other->id, 'reportable_type' => User::class, 'reportable_id' => $gone->id, 'reason' => 'y', 'severity' => 'low', 'status' => 'open']);
        Group::create(['name' => 'G', 'created_by' => $gone->id])->members()->attach($gone->id);

        return $gone;
    }

    private function assertNothingLeft(User $other): void
    {
        foreach ([['profiles', 1], ['posts', 1], ['comments', 0], ['post_likes', 0], ['likes', 0], ['blocks', 0], ['conversations', 0], ['messages', 0], ['reports', 0], ['event_rsvps', 0], ['community_group_user', 0]] as [$table, $count]) {
            $this->assertSame($count, DB::table($table)->count(), $table);
        }
        $this->assertSame(1, Event::count());
        $this->assertNull(DB::table('community_groups')->value('created_by'));

        $this->actingAs($other)->getJson('/api/posts')->assertOk()->assertJsonPath('posts.0.text', 'Stay');
    }

    public function test_deleting_an_account_removes_all_of_its_data(): void
    {
        $other = $this->member();
        $gone = $this->memberWithData($other);

        $this->actingAs($gone)->deleteJson('/api/account')->assertNoContent();
        $this->assertDatabaseMissing('users', ['id' => $gone->id]);

        $this->assertNothingLeft($other->fresh());
    }

    public function test_clean_up_migration_removes_only_rows_of_deleted_members(): void
    {
        $other = $this->member();
        $gone = $this->memberWithData($other);
        DB::table('users')->where('id', $gone->id)->delete();

        (require database_path('migrations/2026_11_03_000100_remove_rows_of_deleted_members.php'))->up();

        $this->assertNothingLeft($other->fresh());
    }

    public function test_feeds_survive_a_post_or_comment_with_no_author(): void
    {
        $me = $this->member();
        $post = Post::create(['user_id' => $me->id, 'category' => 'food', 'body' => 'Mine', 'status' => 'approved']);
        Post::create(['user_id' => 99999, 'category' => 'food', 'body' => 'Orphan', 'status' => 'approved']);
        Post::create(['user_id' => 99999, 'category' => 'food', 'body' => 'Orphan held', 'status' => 'pending']);
        DB::table('comments')->insert(['post_id' => $post->id, 'user_id' => 99999, 'body' => 'Orphan comment']);

        $this->actingAs($me)->getJson('/api/posts')->assertOk()->assertJsonCount(1, 'posts');
        $this->getJson("/api/posts/{$post->id}/comments")->assertOk()->assertJsonCount(0, 'comments');

        $admin = $this->member();
        $admin->forceFill(['role' => 'admin'])->save();
        $this->actingAs($admin)->getJson('/api/admin/queue')->assertOk()->assertJsonCount(0, 'queue')->assertJsonCount(1, 'published');
    }

    public function test_deleting_an_event_or_group_also_removes_its_members(): void
    {
        $admin = $this->member();
        $admin->forceFill(['role' => 'admin'])->save();
        $event = Event::create(['user_id' => $admin->id, 'title' => 'E', 'starts_at' => now()->addDay()]);
        $event->attendees()->attach($admin->id);
        $group = Group::create(['name' => 'G']);
        $group->members()->attach($admin->id);

        $this->actingAs($admin)->deleteJson("/api/admin/events/{$event->id}")->assertNoContent();
        $this->deleteJson("/api/admin/groups/{$group->id}")->assertNoContent();

        $this->assertSame(0, DB::table('event_rsvps')->count());
        $this->assertSame(0, DB::table('community_group_user')->count());
    }
}
