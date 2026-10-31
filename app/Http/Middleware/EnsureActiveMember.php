<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

/**
 * Runs on every members-only API call: a suspended account loses its session
 * straight away, and an unverified account can't use the app yet.
 */
class EnsureActiveMember
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user->isSuspended()) {
            Auth::guard('web')->logout();
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return response()->json(['message' => 'This account is suspended. Contact support if you think this is a mistake.', 'suspended' => true], 403);
        }

        if (! $user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Please verify your email first.', 'unverified' => true], 403);
        }

        // Keeps "online" honest without writing to the database on every call.
        if (! $user->last_seen_at || $user->last_seen_at->lt(Carbon::now()->subMinute())) {
            $user->forceFill(['last_seen_at' => Carbon::now()])->saveQuietly();
        }

        return $next($request);
    }
}
