<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Rekonekte Phase 1 (MVP) schema — one migration so the whole data model reads
 * top to bottom. Maps 1:1 to the quotation's feature list:
 *   accounts (18+), profiles + photos, matching (likes), refresh-based messaging,
 *   safety (blocks + reports), community posts, events (+ RSVPs), admin roles.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Account fields on top of Laravel's users table.
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('member')->after('password');       // member | moderator | admin
            $table->date('date_of_birth')->nullable()->after('role');
            $table->timestamp('adult_confirmed_at')->nullable()->after('date_of_birth'); // 18+ checkbox at sign-up
            $table->string('locale', 5)->default('en')->after('adult_confirmed_at');    // en | fr | ht
            $table->timestamp('suspended_at')->nullable()->after('locale');
            $table->string('suspension_reason')->nullable()->after('suspended_at');
            $table->timestamp('last_seen_at')->nullable()->after('suspension_reason');
        });

        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('display_name', 60);
            $table->string('gender', 20)->nullable();          // woman | man | other
            $table->string('interested_in', 20)->nullable();    // women | men | everyone
            $table->string('city', 80)->nullable()->index();
            $table->string('country', 80)->nullable();
            $table->string('hometown', 80)->nullable();          // where the family is from in Haiti
            $table->string('job', 80)->nullable();
            $table->string('looking_for', 40)->nullable();      // something serious | friendship | not sure
            $table->text('bio')->nullable();
            $table->json('languages')->nullable();               // ["Kreyòl","English"]
            $table->json('interests')->nullable();               // ["Kompa","Cooking"]
            $table->boolean('is_verified')->default(false);
            $table->boolean('show_in_discover')->default(true);
            $table->timestamps();
            $table->index(['gender', 'city']);
        });

        Schema::create('photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->boolean('is_primary')->default(false);
            $table->unsignedTinyInteger('position')->default(0);
            $table->timestamps();
        });

        // Matching: a like in each direction = a match.
        Schema::create('likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('liker_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('liked_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['liker_id', 'liked_id']);
        });

        Schema::create('passes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('passed_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'passed_id']);
        });

        // Private messaging (refresh-based, not real-time).
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_one_id')->constrained('users')->cascadeOnDelete(); // lower user id
            $table->foreignId('user_two_id')->constrained('users')->cascadeOnDelete(); // higher user id
            $table->timestamp('last_message_at')->nullable()->index();
            $table->timestamps();
            $table->unique(['user_one_id', 'user_two_id']);
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['conversation_id', 'created_at']);
        });

        // Safety.
        Schema::create('blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blocker_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('blocked_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['blocker_id', 'blocked_id']);
        });

        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->morphs('reportable');                         // a User, Message or Post
            $table->string('reason', 60);                         // fake profile | harassment | scam | underage | …
            $table->text('details')->nullable();
            $table->string('severity', 10)->default('low');       // low | medium | high
            $table->string('status', 20)->default('open');        // open | dismissed | warned | suspended
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at']);
        });

        // Community.
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('category', 30);                       // housing | jobs | events | food | advice | business
            $table->text('body');
            $table->string('image_path')->nullable();
            $table->string('city', 80)->nullable();
            $table->string('status', 20)->default('pending');     // pending | approved | removed
            $table->foreignId('moderated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('moderated_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'category']);
        });

        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // organiser
            $table->string('title', 120);
            $table->text('description')->nullable();
            $table->string('category', 30)->nullable();           // music | food | dating | culture | business
            $table->dateTime('starts_at')->index();
            $table->dateTime('ends_at')->nullable();
            $table->string('venue', 160)->nullable();
            $table->string('city', 80)->nullable()->index();
            $table->string('image_path')->nullable();
            $table->string('price_label', 40)->nullable();         // "Free for members"
            $table->string('status', 20)->default('published');  // draft | published | cancelled
            $table->timestamps();
        });

        Schema::create('event_rsvps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['event_id', 'user_id']);
        });
    }

    public function down(): void
    {
        foreach (['event_rsvps', 'events', 'posts', 'reports', 'blocks', 'messages', 'conversations', 'passes', 'likes', 'photos', 'profiles'] as $t) {
            Schema::dropIfExists($t);
        }
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'date_of_birth', 'adult_confirmed_at', 'locale', 'suspended_at', 'suspension_reason', 'last_seen_at']);
        });
    }
};
