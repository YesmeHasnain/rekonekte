<?php

use App\Http\Controllers\Api\MemberController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Foundation check: the app is up and talking to the database.
Route::get('/health', fn () => ['ok' => true, 'app' => config('app.name'), 'db' => DB::connection()->getDatabaseName() !== null, 'members' => DB::table('users')->count()]);

// Phase 1 — Discover (age / gender / city filters).
Route::get('/members', [MemberController::class, 'index']);

Route::get('/user', fn (Request $request) => $request->user())->middleware('auth:sanctum');
