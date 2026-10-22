<?php

namespace Database\Seeders;

use App\Models\Block;
use App\Models\Conversation;
use App\Models\Event;
use App\Models\Like;
use App\Models\Message;
use App\Models\Photo;
use App\Models\Post;
use App\Models\Profile;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

/**
 * Demo data for the Phase 1 review — the same members, posts, events and
 * reports the UI shows. Every demo account's password is "password".
 */
class DatabaseSeeder extends Seeder
{
    private const MEMBERS = [
        ['nadia', 'Nadia', 29, 'woman', 'Miami', true, 'Pediatric nurse', ['English', 'Kreyòl'], ['Kompa', 'Beach days', 'Cooking', 'Church choir'], "Little Haiti girl with a big laugh. Sunday = griot at manman's, then the beach. Looking for someone who calls home every week."],
        ['jean', 'Jean-Robert', 33, 'man', 'Brooklyn', true, 'Architect', ['English', 'French', 'Kreyòl'], ['Design', 'Soccer', 'Rara', 'Travel'], 'Designing buildings in Flatbush, dreaming of a house in Jacmel. I make a serious soup joumou every January 1st.'],
        ['roselande', 'Roselande', 26, 'woman', 'Montréal', true, 'Law student', ['French', 'Kreyòl'], ['Poetry', 'Konpa', 'Hiking', 'Art'], 'Étudiante en droit, poète le soir. Kreyòl is my love language. Show me your favourite Frankétienne line.'],
        ['marc', 'Marc', 36, 'man', 'Miami', false, 'Restaurant owner', ['English', 'Kreyòl'], ['Food', 'Fishing', 'Kompa', 'Family'], "I run a little Haitian spot on NE 2nd Ave. If you like pikliz, we're already friends."],
        ['esther', 'Esther', 31, 'woman', 'Boston', true, 'Software engineer', ['English', 'French', 'Kreyòl'], ['Tech', 'Running', 'Books', 'Dance'], 'Building apps by day, dancing kompa by night. Proud Gonaïvienne. Bring good conversation and better jokes.'],
        ['wilson', 'Wilson', 28, 'man', 'Orlando', true, 'Physical therapist', ['English', 'Kreyòl'], ['Basketball', 'Gym', 'Music', 'Church'], 'Gym in the morning, family dinner at night. Looking for my partner in everything — including dominoes.'],
        ['mika', 'Mika', 24, 'woman', 'Paris', true, 'Fashion designer', ['French', 'Kreyòl', 'English'], ['Fashion', 'Photography', 'Rara', 'Travel'], 'Paris-born, Port-au-Prince at heart. I design with colours from the tap-taps of my childhood summers.'],
        ['ricardo', 'Ricardo', 41, 'man', 'Montréal', true, 'High school teacher', ['French', 'Kreyòl'], ['History', 'Jazz', 'Chess', 'Cooking'], "Prof d'histoire. I can talk 1804 for hours. Divorced, two great kids, ready for something real."],
        ['sabine', 'Sabine', 38, 'woman', 'Brooklyn', true, 'Entrepreneur', ['English', 'Kreyòl'], ['Business', 'Wine', 'Kompa', 'Travel'], 'Founder of a natural hair brand. I work hard and love harder. Family first, always.'],
        ['fritz', 'Fritz', 45, 'man', 'Port-au-Prince', false, 'Agronomist', ['Kreyòl', 'French'], ['Nature', 'Farming', 'Music', 'Faith'], 'Mwen renmen tè a. Coffee from Thiotte, music from Tabou Combo. Looking for a kind heart.'],
    ];

    public function run(): void
    {
        $now = Carbon::now();

        $admin = User::create([
            'name' => 'Rekonekte Admin', 'email' => 'admin@rekonekte.com', 'password' => Hash::make('password'),
            'role' => 'admin', 'date_of_birth' => '1990-01-01', 'adult_confirmed_at' => $now, 'email_verified_at' => $now,
        ]);

        $me = $this->member('daniela', 'Daniela', 30, 'woman', 'Miami', true, 'Marketing manager', ['English', 'Kreyòl'],
            ['Kompa', 'Travel', 'Cooking', 'Books'], 'Miami-raised, Jacmel roots. I love long dinners, loud families and Sunday drives with old kompa on.', 'p-nadia.jpg');

        $u = [];
        foreach (self::MEMBERS as [$h, $name, $age, $gender, $city, $verified, $job, $langs, $interests, $bio]) {
            $u[$h] = $this->member($h, $name, $age, $gender, $city, $verified, $job, $langs, $interests, $bio, "p-$h.jpg");
        }

        // Mutual likes = matches (so these conversations are allowed).
        foreach (['jean', 'roselande', 'wilson', 'esther'] as $h) {
            Like::create(['liker_id' => $me->id, 'liked_id' => $u[$h]->id]);
            Like::create(['liker_id' => $u[$h]->id, 'liked_id' => $me->id]);
        }

        $threads = [
            'jean' => [['jean', 'Bonjou Daniela! I saw you love Jacmel — my grandmother is from there too.'], ['me', 'Sak pase! No way, which part?'],
                ['jean', 'Près de la plage, near Raymond-les-Bains. Have you been to the carnival?'], ['jean', 'We should compare soup joumou recipes 😄']],
            'roselande' => [['roselande', 'Your bio made me laugh — loud families are the best families.'], ['me', 'You get it! Tell me what you think of the last poem you read.']],
            'wilson' => [['wilson', 'Are you going to the Lakou Kompa night on Saturday?']],
            'esther' => [['esther', 'Haha mèsi! Coffee next time you\'re in Boston?']],
        ];
        foreach ($threads as $h => $lines) {
            $c = Conversation::between($me->id, $u[$h]->id);
            $t = $now->copy()->subHours(count($lines) + 1);
            foreach ($lines as [$from, $body]) {
                Message::create(['conversation_id' => $c->id, 'sender_id' => $from === 'me' ? $me->id : $u[$h]->id, 'body' => $body,
                    'created_at' => $t = $t->copy()->addMinutes(9), 'updated_at' => $t]);
            }
            $c->update(['last_message_at' => $t]);
        }

        $posts = [
            ['sabine', 'business', "Haitian-owned businesses in Brooklyn: I'm putting together a free directory for the kominote. Drop your business below.", 'toast.jpg', 'Brooklyn', 'approved'],
            ['marc', 'food', 'Griot Friday is back at the restaurant! First 20 Rekonekte members get free pikliz to go. Mèsi for the love, Miami.', 'cooking.jpg', 'Miami', 'approved'],
            ['esther', 'jobs', 'My company is hiring 2 junior developers in Boston (remote-friendly). Kreyòl speakers very welcome — DM me for a referral.', null, 'Boston', 'approved'],
            ['ricardo', 'housing', 'Room available in a family home in Montréal-Nord from December 1st. Quiet, close to the metro. Ideal for a student.', 'hillside.jpg', 'Montréal', 'approved'],
            ['mika', 'events', "Paris fam! We're organising a Fèt Drapo picnic recap night — photos, music, and a little fashion pop-up.", 'dancers.jpg', 'Paris', 'approved'],
            ['wilson', 'advice', 'How do you all keep Kreyòl alive with your kids in the diaspora? My nephew only answers in English.', null, 'Orlando', 'approved'],
            ['fritz', 'business', 'Send me $50 and I will triple it in a week, guaranteed!!! DM now', null, 'Port-au-Prince', 'pending'],
            ['mika', 'events', 'Pop-up shop this Saturday in Belleville — Haitian designers only. Come through!', null, 'Paris', 'pending'],
        ];
        foreach ($posts as [$h, $cat, $body, $img, $city, $status]) {
            Post::create(['user_id' => $u[$h]->id, 'category' => $cat, 'body' => $body, 'image_path' => $img ? "/img/$img" : null, 'city' => $city, 'status' => $status]);
        }

        $events = [
            ['Lakou Kompa Night', 'music', '2026-11-08 21:00', 'Little Haiti Cultural Complex', 'Miami', 'live-crowd.jpg', 'Free for members'],
            ['Soup Joumou Cook-off', 'food', '2026-11-16 13:00', 'Flatbush Community Hall', 'Brooklyn', 'kitchen.jpg', '$10'],
            ['Speed Dating — Ann Pale', 'dating', '2026-11-21 19:30', 'Café Lakay, Saint-Michel', 'Montréal', 'dinner.jpg', '$15'],
            ['Rara on the Beach', 'culture', '2026-11-29 16:00', 'North Beach Bandshell', 'Miami', 'parade.jpg', 'Free'],
            ['Diaspora Founders Brunch', 'business', '2026-12-07 11:00', 'Mattapan Commons', 'Boston', 'toast.jpg', '$20'],
            ['Live: Voices of Lakay', 'music', '2026-12-13 20:00', 'La Bellevilloise', 'Paris', 'live-yellow.jpg', '€18'],
        ];
        foreach ($events as [$title, $cat, $at, $venue, $city, $img, $price]) {
            $e = Event::create(['user_id' => $admin->id, 'title' => $title, 'category' => $cat, 'starts_at' => $at, 'venue' => $venue,
                'city' => $city, 'image_path' => "/img/$img", 'price_label' => $price]);
            $e->attendees()->attach(collect($u)->random(4)->pluck('id'));
        }

        $reports = [
            ['nadia', 'marc', 'Inappropriate messages', 'Sent several unwanted messages after I said no.', 'high', 'open'],
            ['esther', 'fritz', 'Fake profile / scam', 'Asked me to send money for a "visa fee".', 'high', 'open'],
            ['mika', 'wilson', 'Spam', 'Posting the same promo in multiple threads.', 'low', 'open'],
            ['sabine', 'ricardo', 'Underage concern', 'Photos look much younger than stated age.', 'medium', 'open'],
            ['roselande', 'jean', 'Harassment', 'Resolved after warning.', 'medium', 'warned'],
        ];
        foreach ($reports as [$by, $target, $reason, $details, $sev, $status]) {
            Report::create(['reporter_id' => $u[$by]->id, 'reportable_type' => User::class, 'reportable_id' => $u[$target]->id,
                'reason' => $reason, 'details' => $details, 'severity' => $sev, 'status' => $status,
                'resolved_by' => $status === 'open' ? null : $admin->id, 'resolved_at' => $status === 'open' ? null : $now]);
        }

        Block::create(['blocker_id' => $u['esther']->id, 'blocked_id' => $u['fritz']->id]);
        $u['fritz']->update(['suspended_at' => $now, 'suspension_reason' => 'Scam report confirmed']);
    }

    private function member(string $handle, string $name, int $age, string $gender, string $city, bool $verified, string $job,
        array $langs, array $interests, string $bio, string $photo): User
    {
        $user = User::create([
            'name' => $name, 'email' => "$handle@example.com", 'password' => Hash::make('password'),
            'date_of_birth' => Carbon::now()->subYears($age)->subMonths(3)->toDateString(),
            'adult_confirmed_at' => Carbon::now(), 'email_verified_at' => Carbon::now(), 'last_seen_at' => Carbon::now()->subMinutes(rand(1, 600)),
        ]);
        Profile::create([
            'user_id' => $user->id, 'display_name' => $name, 'gender' => $gender, 'interested_in' => $gender === 'woman' ? 'men' : 'women',
            'city' => $city, 'job' => $job, 'bio' => $bio, 'languages' => $langs, 'interests' => $interests,
            'is_verified' => $verified, 'looking_for' => 'Something serious',
        ]);
        Photo::create(['user_id' => $user->id, 'path' => "/img/$photo", 'is_primary' => true]);

        return $user;
    }
}
