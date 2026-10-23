<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MemberController;
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

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/email/verify', [AuthController::class, 'verifyEmail'])->middleware('throttle:10,1');
    Route::post('/email/resend', [AuthController::class, 'resendVerification'])->middleware('throttle:3,1');
});

// Discover (age / gender / city filters).
Route::get('/members', [MemberController::class, 'index']);
