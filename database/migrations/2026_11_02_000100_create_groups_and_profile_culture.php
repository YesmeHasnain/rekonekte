<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Community groups and the culture filter on Discover, for the redesigned
 * Community and Discover screens.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->string('culture', 20)->default('haitian')->index();  // haitian | caribbean | other
        });

        Schema::create('community_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80)->unique();
            $table->string('description', 300)->nullable();
            $table->string('image_path')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('community_group_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['community_group_id', 'user_id']);
        });

        $now = now();
        DB::table('community_groups')->insert(array_map(fn ($g) => [...$g, 'created_at' => $now, 'updated_at' => $now], [
            ['name' => 'Haitian Diaspora', 'description' => 'Lakay wherever we are: news, stories and family from across the diaspora.', 'image_path' => '/img/group-haiti.jpg'],
            ['name' => 'Caribbean Culture', 'description' => 'Music, food and traditions from all over the islands.', 'image_path' => '/img/group-caribbean.jpg'],
            ['name' => 'Wellness & Lifestyle', 'description' => 'Healthy minds, healthy bodies and good habits together.', 'image_path' => '/img/group-wellness.jpg'],
            ['name' => 'Travel & Adventure', 'description' => 'Trips, tips and travel partners for your next journey.', 'image_path' => '/img/group-travel.jpg'],
        ]));

        // Spread the demo members across the Discover filters.
        foreach (['esther@example.com' => 'caribbean', 'wilson@example.com' => 'caribbean', 'mika@example.com' => 'other', 'ricardo@example.com' => 'other'] as $email => $culture) {
            DB::table('profiles')->whereIn('user_id', DB::table('users')->where('email', $email)->select('id'))->update(['culture' => $culture]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('community_group_user');
        Schema::dropIfExists('community_groups');
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropIndex(['culture']);
            $table->dropColumn('culture');
        });
    }
};
