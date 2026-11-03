<?php

namespace Tests\Feature;

use App\Models\Block;
use App\Models\Event;
use App\Models\Post;
use App\Models\Profile;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** The agreed MVP features, end to end through the API. */
class MvpTest extends TestCase
{
    use RefreshDatabase;

    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    private array $uploaded = [];

    protected function setUp(): void
    {
        parent::setUp();
        // Browsers always send this; Sanctum needs it to start the session.
        config(['sanctum.stateful' => ['localhost']]);
        $this->withHeader('Referer', 'http://localhost/');
    }

    protected function tearDown(): void
    {
        foreach ($this->uploaded as $path) {
            File::delete(public_path(ltrim($path, '/')));
        }
        parent::tearDown();
    }

    private function member(array $attrs = [], array $profile = []): User
    {
        $user = User::factory()->create([
            'role' => 'member',
            'date_of_birth' => '1995-01-01',
            'adult_confirmed_at' => now(),
            'last_seen_at' => now(),
            ...$attrs,
        ]);
        Profile::create(['user_id' => $user->id, 'display_name' => $user->name, 'gender' => 'woman', 'city' => 'Miami', ...$profile]);

        return $user;
    }

    private function admin(): User
    {
        return $this->member(['role' => 'admin']);
    }

    private function registration(array $overrides = []): array
    {
        return [
            'name' => 'Daniela', 'email' => 'new@example.com', 'password' => 'secret-pass', 'gender' => 'woman',
            'date_of_birth' => now()->subYears(25)->toDateString(), 'adult_confirmed' => true, 'terms_accepted' => true,
            ...$overrides,
        ];
    }

    // --- Accounts ---------------------------------------------------------

    public function test_register_refuses_under_18_and_requires_the_confirmation(): void
    {
        $this->postJson('/api/register', $this->registration(['date_of_birth' => now()->subYears(17)->toDateString()]))
            ->assertStatus(422)->assertJsonValidationErrors('date_of_birth');
        $this->postJson('/api/register', $this->registration(['adult_confirmed' => false]))
            ->assertStatus(422)->assertJsonValidationErrors('adult_confirmed');
        $this->assertDatabaseCount('users', 0);
    }

    public function test_exactly_18_today_can_register(): void
    {
        $this->postJson('/api/register', $this->registration(['date_of_birth' => now()->subYears(18)->toDateString()]))
            ->assertCreated();
    }

    public function test_register_then_verify_email_with_the_mailed_code(): void
    {
        Mail::fake();
        $this->postJson('/api/register', $this->registration())->assertCreated();
        $user = User::where('email', 'new@example.com')->first();

        $this->actingAs($user)->getJson('/api/members')->assertForbidden()->assertJsonPath('unverified', true);
        $this->postJson('/api/email/verify', ['code' => '000000'])->assertStatus(422);

        $hash = cache()->get('code:verify:'.sha1('new@example.com'));
        $this->assertNotNull($hash);
        cache()->put('code:verify:'.sha1('new@example.com'), Hash::make('123456'), now()->addMinutes(5));

        $this->postJson('/api/email/verify', ['code' => '123456'])->assertOk()->assertJsonPath('user.email_verified', true);
        $this->getJson('/api/members')->assertOk();
    }

    public function test_login_and_wrong_password(): void
    {
        $user = $this->member(['email' => 'a@example.com', 'password' => 'right-pass']);
        $this->postJson('/api/login', ['email' => 'a@example.com', 'password' => 'wrong'])->assertStatus(422);
        $this->postJson('/api/login', ['email' => 'A@example.com', 'password' => 'right-pass'])->assertOk();
        $this->assertAuthenticatedAs($user);
    }

    public function test_password_reset_with_a_code_changes_the_password(): void
    {
        $this->member(['email' => 'b@example.com', 'password' => 'old-pass-1']);
        cache()->put('code:reset:'.sha1('b@example.com'), Hash::make('654321'), now()->addMinutes(5));

        $this->postJson('/api/password/reset', ['email' => 'b@example.com', 'code' => '111111', 'password' => 'new-pass-1', 'password_confirmation' => 'new-pass-1'])->assertStatus(422);
        $this->postJson('/api/password/reset', ['email' => 'b@example.com', 'code' => '654321', 'password' => 'new-pass-1', 'password_confirmation' => 'new-pass-1'])->assertOk();
        $this->postJson('/api/login', ['email' => 'b@example.com', 'password' => 'new-pass-1'])->assertOk();
    }

    public function test_reset_email_contains_a_link_that_resets_the_password(): void
    {
        config(['app.url' => 'https://rekonekte.test']);
        $this->member(['email' => 'link@example.com', 'password' => 'old-pass-1']);
        $this->postJson('/api/password/forgot', ['email' => 'link@example.com'])->assertOk();

        $body = app('mail.manager')->mailer()->getSymfonyTransport()->messages()->last()->getOriginalMessage()->getTextBody();
        $this->assertSame(1, preg_match('#https://rekonekte\.test/reset\?(\S+)#', $body, $m));
        parse_str($m[1], $q);
        $this->assertSame('link@example.com', $q['email']);

        $this->postJson('/api/password/reset', ['email' => $q['email'], 'code' => $q['code'], 'password' => 'new-pass-1', 'password_confirmation' => 'new-pass-1'])->assertOk();
        $this->postJson('/api/login', ['email' => 'link@example.com', 'password' => 'new-pass-1'])->assertOk();
    }

    public function test_forgot_password_does_not_reveal_whether_an_account_exists(): void
    {
        $this->postJson('/api/password/forgot', ['email' => 'nobody@example.com'])->assertOk()->assertJson(['sent' => true]);
    }

    public function test_suspended_member_cannot_log_in_and_loses_a_live_session(): void
    {
        $user = $this->member(['email' => 'c@example.com', 'password' => 'right-pass', 'suspended_at' => now()]);
        $this->postJson('/api/login', ['email' => 'c@example.com', 'password' => 'right-pass'])->assertStatus(422);

        $this->actingAs($user)->getJson('/api/members')->assertForbidden()->assertJsonPath('suspended', true);
    }

    public function test_the_app_requires_login(): void
    {
        foreach (['/api/members', '/api/threads', '/api/posts', '/api/events', '/api/profile', '/api/admin/stats', '/api/admin/events'] as $url) {
            $this->getJson($url)->assertUnauthorized();
        }
    }

    // --- Profiles and uploads --------------------------------------------

    public function test_profile_edit_and_stats_use_real_numbers(): void
    {
        $me = $this->member();
        $this->actingAs($me)->putJson('/api/profile', ['name' => 'Nouvo', 'city' => 'Boston', 'bio' => 'Bonjou', 'interests' => ['Kompa'], 'langs' => ['Kreyòl']])
            ->assertOk()->assertJsonPath('me.city', 'Boston');

        $this->member()->likesGiven()->create(['liked_id' => $me->id]);
        $this->getJson('/api/profile')->assertOk()->assertJsonPath('stats.likedBy', 1)->assertJsonMissingPath('stats.views');
    }

    public function test_real_image_uploads_with_an_extension_from_its_content(): void
    {
        $res = $this->actingAs($this->member())->postJson('/api/profile/photo', ['image' => 'data:image/jpeg;base64,'.self::PNG])->assertOk();
        $this->uploaded[] = $res->json('photo');

        $this->assertStringEndsWith('.png', $res->json('photo'));
        $this->assertFileExists(public_path(ltrim($res->json('photo'), '/')));
    }

    public function test_scripts_disguised_as_images_are_refused_everywhere(): void
    {
        $shell = base64_encode('<?php system($_GET["c"]); ?>');
        $svg = base64_encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
        $before = File::allFiles(public_path())
            ? collect(File::allFiles(public_path()))->filter(fn ($f) => str_contains($f->getPathname(), 'uploads'))->count() : 0;

        $me = $this->member();
        foreach (["data:image/php;base64,$shell", "data:image/jpeg;base64,$shell", "data:image/svg+xml;base64,$svg", 'data:image/png;base64,!!!'] as $bad) {
            $this->actingAs($me)->postJson('/api/profile/photo', ['image' => $bad])->assertStatus(422);
            $this->postJson('/api/posts', ['body' => 'Hi', 'category' => 'food', 'image' => $bad])->assertStatus(422);
        }
        $this->actingAs($this->admin())->postJson('/api/admin/events', [
            'title' => 'X', 'starts_at' => now()->addDay()->toDateTimeString(), 'status' => 'published', 'image' => "data:image/php;base64,$shell",
        ])->assertStatus(422);

        $after = collect(File::allFiles(public_path()))->filter(fn ($f) => str_contains($f->getPathname(), 'uploads'))->count();
        $this->assertSame($before, $after);
    }

    // --- Discovery and matching ------------------------------------------

    public function test_discover_filters_and_hides_suspended_blocked_and_self(): void
    {
        $me = $this->member();
        $young = $this->member(['date_of_birth' => now()->subYears(22)->toDateString()], ['city' => 'Boston', 'gender' => 'man']);
        $older = $this->member(['date_of_birth' => now()->subYears(40)->toDateString()], ['city' => 'Miami', 'gender' => 'woman']);
        $this->member(['suspended_at' => now()]);
        $blocked = $this->member();
        Block::create(['blocker_id' => $me->id, 'blocked_id' => $blocked->id]);

        $ids = fn ($q = '') => collect($this->actingAs($me)->getJson('/api/members'.$q)->assertOk()->json('data'))->pluck('id')->sort()->values()->all();

        $this->assertSame([$young->id, $older->id], $ids());
        $this->assertSame([$young->id], $ids('?max_age=30'));
        $this->assertSame([$young->id], $ids('?gender=man'));
        $this->assertSame([$older->id], $ids('?city=Miami'));
    }

    public function test_a_like_each_way_makes_a_match(): void
    {
        $a = $this->member();
        $b = $this->member();
        $this->actingAs($a)->postJson("/api/members/{$b->id}/like")->assertOk()->assertJsonPath('matched', false);
        $this->actingAs($b)->postJson("/api/members/{$a->id}/like")->assertOk()->assertJsonPath('matched', true);
    }

    public function test_cannot_like_a_suspended_or_blocked_member(): void
    {
        $me = $this->member();
        $gone = $this->member(['suspended_at' => now()]);
        $blocker = $this->member();
        Block::create(['blocker_id' => $blocker->id, 'blocked_id' => $me->id]);

        $this->actingAs($me)->postJson("/api/members/{$gone->id}/like")->assertNotFound();
        $this->postJson("/api/members/{$blocker->id}/like")->assertNotFound();
    }

    // --- Messaging -------------------------------------------------------

    public function test_private_messages_go_between_the_two_members_only(): void
    {
        $a = $this->member();
        $b = $this->member();
        $c = $this->member();

        $this->actingAs($a)->postJson("/api/threads/{$b->id}", ['body' => 'Sak pase?'])->assertOk();
        $this->actingAs($b)->getJson('/api/threads')->assertOk()
            ->assertJsonPath('threads.0.unread', 1)->assertJsonPath('threads.0.messages.0.text', 'Sak pase?');
        $this->getJson("/api/threads/{$a->id}")->assertOk();
        $this->getJson('/api/threads')->assertJsonPath('threads.0.unread', 0);
        $this->actingAs($c)->getJson('/api/threads')->assertOk()->assertJsonCount(0, 'threads');
    }

    public function test_message_notification_opens_the_right_conversation(): void
    {
        $a = $this->member();
        $b = $this->member();
        $this->actingAs($a)->postJson("/api/threads/{$b->id}", ['body' => 'Hi'])->assertOk();

        $this->actingAs($b)->getJson('/api/notifications')->assertOk()
            ->assertJsonPath('notifications.0.to', '/app/messages/'.$a->id);
    }

    // --- Safety ----------------------------------------------------------

    public function test_block_stops_messages_both_ways_and_can_be_undone(): void
    {
        $a = $this->member();
        $b = $this->member();
        $this->actingAs($a)->postJson("/api/members/{$b->id}/block")->assertOk();

        $this->postJson("/api/threads/{$b->id}", ['body' => 'x'])->assertForbidden();
        $this->actingAs($b)->postJson("/api/threads/{$a->id}", ['body' => 'x'])->assertForbidden();
        $this->actingAs($b)->getJson("/api/members/{$a->id}")->assertNotFound();

        $this->actingAs($a)->deleteJson("/api/members/{$b->id}/block")->assertOk();
        $this->postJson("/api/threads/{$b->id}", ['body' => 'x'])->assertOk();
    }

    public function test_report_reaches_the_admin_who_can_warn_or_suspend(): void
    {
        Mail::fake();
        $reporter = $this->member();
        $target = $this->member();
        $admin = $this->admin();

        $this->actingAs($reporter)->postJson("/api/members/{$reporter->id}/report", ['reason' => 'Scam'])->assertStatus(422);
        $this->postJson("/api/members/{$target->id}/report", ['reason' => 'Scam', 'details' => 'Asked for money', 'also_block' => true])->assertCreated();
        $this->assertDatabaseHas('blocks', ['blocker_id' => $reporter->id, 'blocked_id' => $target->id]);

        $report = $this->actingAs($admin)->getJson('/api/admin/reports')->assertOk()->assertJsonPath('reports.0.severity', 'high')->json('reports.0');
        $this->postJson("/api/admin/reports/{$report['id']}/resolve", ['action' => 'warn'])->assertOk();

        $this->assertDatabaseHas('reports', ['id' => $report['id'], 'status' => 'warned']);
    }

    public function test_warning_reaches_the_member_by_notification(): void
    {
        $target = $this->member();
        $report = Report::create(['reporter_id' => $this->member()->id, 'reportable_type' => User::class, 'reportable_id' => $target->id, 'reason' => 'Harassment', 'severity' => 'medium', 'status' => 'open']);

        $this->actingAs($this->admin())->postJson("/api/admin/reports/{$report->id}/resolve", ['action' => 'warn'])->assertOk();
        $this->actingAs($target)->getJson('/api/notifications')->assertOk()
            ->assertJsonPath('notifications.0.who', 'Rekonekte moderators');
    }

    public function test_admin_suspend_from_a_report_ends_the_members_access(): void
    {
        $target = $this->member();
        $report = Report::create(['reporter_id' => $this->member()->id, 'reportable_type' => User::class, 'reportable_id' => $target->id, 'reason' => 'Scam', 'severity' => 'high', 'status' => 'open']);

        $this->actingAs($this->admin())->postJson("/api/admin/reports/{$report->id}/resolve", ['action' => 'suspend'])->assertOk();

        $this->assertNotNull($target->fresh()->suspended_at);
        $this->actingAs($target->fresh())->getJson('/api/posts')->assertForbidden();
    }

    // --- Community -------------------------------------------------------

    public function test_community_post_like_and_comment(): void
    {
        $a = $this->member();
        $b = $this->member();
        $id = $this->actingAs($a)->postJson('/api/posts', ['body' => 'Griot night!', 'category' => 'food'])->assertCreated()
            ->assertJsonPath('post.status', 'approved')->json('post.id');

        $this->actingAs($b)->postJson("/api/posts/$id/like")->assertOk()->assertJsonPath('likes', 1);
        $this->postJson("/api/posts/$id/comments", ['body' => 'Mwen la!'])->assertCreated()->assertJsonPath('count', 1);
        $this->getJson('/api/posts')->assertOk()->assertJsonPath('posts.0.comments', 1)->assertJsonPath('posts.0.liked', true);
    }

    public function test_post_times_are_whole_minutes_and_hours(): void
    {
        $me = $this->member();
        $post = Post::create(['user_id' => $me->id, 'category' => 'food', 'body' => 'Hi', 'status' => 'approved']);

        $post->forceFill(['created_at' => now()->subSeconds(150)])->saveQuietly();
        $this->actingAs($me)->getJson('/api/posts')->assertJsonPath('posts.0.time', '2m');

        $post->forceFill(['created_at' => now()->subMinutes(190)])->saveQuietly();
        $this->getJson('/api/posts')->assertJsonPath('posts.0.time', '3h');
    }

    public function test_scam_post_waits_for_a_moderator_and_stays_hidden_until_approved(): void
    {
        $author = $this->member();
        $other = $this->member();
        $id = $this->actingAs($author)->postJson('/api/posts', ['body' => 'Guaranteed crypto returns', 'category' => 'business'])
            ->assertCreated()->assertJsonPath('post.status', 'pending')->json('post.id');

        $this->actingAs($other)->getJson('/api/posts')->assertJsonCount(0, 'posts');
        $this->postJson("/api/posts/$id/comments", ['body' => 'x'])->assertNotFound();
        $this->postJson("/api/posts/$id/like")->assertNotFound();

        $this->actingAs($this->admin())->getJson('/api/admin/queue')->assertOk()->assertJsonPath('queue.0.id', $id);
        $this->postJson("/api/admin/posts/$id/moderate", ['action' => 'approve'])->assertOk();

        $this->actingAs($other)->getJson('/api/posts')->assertJsonCount(1, 'posts');
    }

    public function test_admin_can_remove_a_post_that_is_already_published(): void
    {
        $author = $this->member();
        $post = Post::create(['user_id' => $author->id, 'category' => 'food', 'body' => 'Hello', 'status' => 'approved']);

        $this->actingAs($this->admin())->getJson('/api/admin/queue')->assertOk()->assertJsonPath('published.0.id', $post->id);
        $this->postJson("/api/admin/posts/{$post->id}/moderate", ['action' => 'remove'])->assertOk();

        $this->actingAs($this->member())->getJson('/api/posts')->assertJsonCount(0, 'posts');
    }

    // --- Events ----------------------------------------------------------

    public function test_admin_manages_events_and_members_rsvp(): void
    {
        $admin = $this->admin();
        $member = $this->member();

        $id = $this->actingAs($admin)->postJson('/api/admin/events', [
            'title' => 'Kompa Night', 'description' => 'Live band', 'category' => 'music', 'starts_at' => now()->addWeek()->format('Y-m-d\TH:i'),
            'venue' => 'Little Haiti', 'city' => 'Miami', 'price_label' => 'Free', 'status' => 'published',
        ])->assertCreated()->json('event.id');

        $this->actingAs($member)->getJson('/api/events')->assertOk()->assertJsonPath('events.0.title', 'Kompa Night');
        $this->postJson("/api/events/$id/rsvp")->assertOk()->assertJsonPath('going', true)->assertJsonPath('count', 1);
        $this->postJson("/api/events/$id/rsvp")->assertOk()->assertJsonPath('going', false);

        $this->actingAs($admin)->putJson("/api/admin/events/$id", ['title' => 'Kompa Night 2', 'starts_at' => now()->addWeek()->format('Y-m-d\TH:i'), 'status' => 'cancelled'])
            ->assertOk()->assertJsonPath('event.status', 'cancelled');

        $this->actingAs($member)->getJson('/api/events')->assertJsonCount(0, 'events');
        $this->postJson("/api/events/$id/rsvp")->assertNotFound();

        $this->actingAs($admin)->deleteJson("/api/admin/events/$id")->assertNoContent();
        $this->assertDatabaseMissing('events', ['id' => $id]);
    }

    public function test_event_end_must_be_after_its_start(): void
    {
        $this->actingAs($this->admin())->postJson('/api/admin/events', [
            'title' => 'X', 'starts_at' => '2027-01-02 20:00:00', 'ends_at' => '2027-01-02 19:00:00', 'status' => 'published',
        ])->assertStatus(422)->assertJsonValidationErrors('ends_at');
    }

    public function test_event_detail_shows_who_is_going_and_hides_unpublished_events(): void
    {
        $me = $this->member();
        $going = $this->member();
        $blocked = $this->member();
        Block::create(['blocker_id' => $me->id, 'blocked_id' => $blocked->id]);
        $event = Event::create(['user_id' => $me->id, 'title' => 'Fete', 'starts_at' => now()->addDay(), 'status' => 'published']);
        $event->attendees()->attach([$going->id, $blocked->id]);
        $draft = Event::create(['user_id' => $me->id, 'title' => 'Draft', 'starts_at' => now()->addDay(), 'status' => 'draft']);

        $this->actingAs($me)->getJson("/api/events/{$event->id}")->assertOk()
            ->assertJsonPath('event.going', 2)->assertJsonCount(1, 'event.attendees')
            ->assertJsonPath('event.attendees.0.id', $going->id);
        $this->getJson("/api/events/{$draft->id}")->assertNotFound();
    }

    // --- Groups ----------------------------------------------------------

    public function test_groups_show_real_member_counts_and_can_be_joined_and_left(): void
    {
        $me = $this->member();
        $id = $this->actingAs($me)->getJson('/api/groups')->assertOk()
            ->assertJsonPath('groups.0.name', 'Haitian Diaspora')->assertJsonPath('groups.0.members', 0)->json('groups.0.id');

        $this->postJson("/api/groups/$id/join")->assertOk()->assertJson(['joined' => true, 'members' => 1]);
        $this->getJson('/api/groups')->assertJsonPath('groups.0.joined', true);
        $this->postJson("/api/groups/$id/join")->assertOk()->assertJson(['joined' => false, 'members' => 0]);
    }

    public function test_a_member_can_start_a_group_and_only_an_admin_can_delete_it(): void
    {
        $me = $this->member();
        $id = $this->actingAs($me)->postJson('/api/groups', ['name' => 'Kompa Lovers', 'description' => 'Tout moun'])
            ->assertCreated()->assertJsonPath('group.members', 1)->assertJsonPath('group.joined', true)->json('group.id');

        $this->postJson('/api/groups', ['name' => 'Kompa Lovers'])->assertStatus(422);
        $this->deleteJson("/api/admin/groups/$id")->assertForbidden();
        $this->actingAs($this->admin())->deleteJson("/api/admin/groups/$id")->assertNoContent();
    }

    public function test_culture_is_saved_and_reaches_discover(): void
    {
        $me = $this->member();
        $this->actingAs($me)->putJson('/api/profile', ['name' => 'N', 'culture' => 'caribbean'])->assertOk()->assertJsonPath('me.culture', 'caribbean');
        $this->putJson('/api/profile', ['name' => 'N', 'culture' => 'mars'])->assertStatus(422);
    }

    public function test_new_community_categories_are_accepted(): void
    {
        $this->actingAs($this->member())->postJson('/api/posts', ['body' => 'Plumber in Miami', 'category' => 'services'])->assertCreated();
    }

    // --- Admin -----------------------------------------------------------

    public function test_members_cannot_reach_any_admin_endpoint(): void
    {
        $member = $this->member();
        $event = Event::create(['user_id' => $member->id, 'title' => 'E', 'starts_at' => now()->addDay()]);
        $this->actingAs($member);

        foreach (['stats', 'users', 'reports', 'queue', 'events'] as $path) {
            $this->getJson("/api/admin/$path")->assertForbidden();
        }
        $this->postJson('/api/admin/events', [])->assertForbidden();
        $this->deleteJson("/api/admin/events/{$event->id}")->assertForbidden();
        $this->postJson("/api/admin/users/{$member->id}/status", ['status' => 'active'])->assertForbidden();
    }

    public function test_admin_can_suspend_and_reactivate_members_but_not_other_admins(): void
    {
        $admin = $this->admin();
        $member = $this->member();
        $other = $this->admin();
        $this->actingAs($admin);

        $this->postJson("/api/admin/users/{$member->id}/status", ['status' => 'suspended'])->assertOk();
        $this->assertNotNull($member->fresh()->suspended_at);
        $this->postJson("/api/admin/users/{$member->id}/status", ['status' => 'active'])->assertOk();
        $this->assertNull($member->fresh()->suspended_at);

        $this->postJson("/api/admin/users/{$other->id}/status", ['status' => 'suspended'])->assertStatus(422);
    }

    public function test_deleting_an_account_removes_it(): void
    {
        $me = $this->member();
        $this->actingAs($me)->deleteJson('/api/account')->assertNoContent();
        $this->assertDatabaseMissing('users', ['id' => $me->id]);
    }

    public function test_online_status_follows_real_activity(): void
    {
        $me = $this->member(['last_seen_at' => now()->subDay()]);
        $this->actingAs($me)->getJson('/api/events')->assertOk();
        $this->assertTrue($me->fresh()->last_seen_at->gt(now()->subMinute()));
    }
}
