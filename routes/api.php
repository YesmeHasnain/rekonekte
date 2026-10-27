<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\InteractionController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SafetyController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Foundation check: the app is up and talking to the database.
Route::get('/health', fn () => ['ok' => true, 'app' => config('app.name'), 'db' => DB::connection()->getDatabaseName() !== null, 'members' => DB::table('users')->count()]);

// Account access — registration (18+), login, email verification, password reset.
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/password/forgot', [AuthController::class, 'forgotPassword']);
    Route::post('/password/reset', [AuthController::class, 'resetPassword']);
});
Route::get('/me', [AuthController::class, 'me']);

// Everything below needs a signed-in member (the SPA's session cookie).
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/email/verify', [AuthController::class, 'verifyEmail'])->middleware('throttle:10,1');
    Route::post('/email/resend', [AuthController::class, 'resendVerification'])->middleware('throttle:3,1');

    // Discover + matching.
    Route::get('/members', [MemberController::class, 'index']);
    Route::get('/members/{user}', [MemberController::class, 'show']);
    Route::post('/members/{user}/like', [InteractionController::class, 'like']);
    Route::delete('/members/{user}/like', [InteractionController::class, 'unlike']);
    Route::post('/members/{user}/pass', [InteractionController::class, 'pass']);
    Route::post('/passes/clear', [InteractionController::class, 'clearPasses']);
    Route::get('/likes', [InteractionController::class, 'likes']);

    // Messaging (by member id — the conversation is found or created).
    Route::get('/threads', [MessageController::class, 'threads']);
    Route::get('/threads/{user}', [MessageController::class, 'thread']);
    Route::post('/threads/{user}', [MessageController::class, 'send']);

    // Community board.
    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::post('/posts/{post}/like', [PostController::class, 'like']);
    Route::get('/posts/{post}/comments', [PostController::class, 'comments']);
    Route::post('/posts/{post}/comments', [PostController::class, 'comment']);

    // Events.
    Route::get('/events', [EventController::class, 'index']);
    Route::post('/events/{event}/rsvp', [EventController::class, 'rsvp']);

    // My profile + account.
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/photo', [ProfileController::class, 'uploadPhoto']);
    Route::delete('/account', [ProfileController::class, 'destroy']);

    // Safety.
    Route::post('/members/{user}/block', [SafetyController::class, 'block']);
    Route::delete('/members/{user}/block', [SafetyController::class, 'unblock']);
    Route::get('/blocked', [SafetyController::class, 'blocked']);
    Route::post('/members/{user}/report', [SafetyController::class, 'report']);

    // Notifications bell.
    Route::get('/notifications', [NotificationController::class, 'index']);

    // Admin / moderation.
    Route::prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::post('/users/{user}/status', [AdminController::class, 'setUserStatus']);
        Route::get('/reports', [AdminController::class, 'reports']);
        Route::post('/reports/{report}/resolve', [AdminController::class, 'resolveReport']);
        Route::get('/queue', [AdminController::class, 'queue']);
        Route::post('/posts/{post}/moderate', [AdminController::class, 'moderatePost']);
    });
});
