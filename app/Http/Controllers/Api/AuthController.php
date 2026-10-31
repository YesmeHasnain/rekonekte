<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

/**
 * Account access (quotation §1): registration with an 18+ check, email
 * verification by 6-digit code, login/logout, and password reset by code.
 * The SPA is on the same domain, so this uses Laravel's session cookie
 * (Sanctum "stateful" API) rather than tokens.
 */
class AuthController extends Controller
{
    private const CODE_TTL_MINUTES = 15;

    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'email' => ['required', 'email:rfc', 'max:190', 'unique:users,email'],
            'password' => ['required', Password::min(8)],
            'gender' => ['required', 'in:woman,man,other'],
            'interested_in' => ['nullable', 'in:women,men,everyone'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'adult_confirmed' => ['accepted'],
            'terms_accepted' => ['accepted'],
        ], [
            'adult_confirmed.accepted' => 'Please confirm you are 18 or older.',
            'terms_accepted.accepted' => 'Please accept the Terms and Privacy Policy.',
        ]);

        // The browser checks age too, but only this check counts.
        if (! User::isAdult($data['date_of_birth'])) {
            throw ValidationException::withMessages(['date_of_birth' => 'You must be at least 18 to join Rekonekte.']);
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'password' => $data['password'],
            'date_of_birth' => $data['date_of_birth'],
            'adult_confirmed_at' => Carbon::now(),
            'locale' => in_array($request->header('X-Locale'), ['en', 'fr', 'ht', 'es'], true) ? $request->header('X-Locale') : 'en',
            'last_seen_at' => Carbon::now(),
        ]);
        Profile::create([
            'user_id' => $user->id,
            'display_name' => $data['name'],
            'gender' => $data['gender'],
            'interested_in' => $data['interested_in'] ?? 'everyone',
        ]);

        Auth::login($user, true);
        $request->session()->regenerate();
        $this->sendCode($user, 'verify');

        return response()->json(['user' => $this->present($user)], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['boolean'],
        ]);

        if (! Auth::attempt(['email' => strtolower($data['email']), 'password' => $data['password']], $data['remember'] ?? true)) {
            throw ValidationException::withMessages(['email' => 'That email and password don’t match an account.']);
        }

        $user = $request->user();
        if ($user->isSuspended()) {
            Auth::guard('web')->logout();
            throw ValidationException::withMessages(['email' => 'This account is suspended. Contact support if you think this is a mistake.']);
        }

        $request->session()->regenerate();
        $user->forceFill(['last_seen_at' => Carbon::now()])->save();

        return ['user' => $this->present($user)];
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    public function me(Request $request)
    {
        return ['user' => $request->user() ? $this->present($request->user()) : null];
    }

    public function verifyEmail(Request $request)
    {
        $data = $request->validate(['code' => ['required', 'digits:6']]);
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return ['user' => $this->present($user)];
        }
        if (! $this->checkCode($user->email, 'verify', $data['code'])) {
            throw ValidationException::withMessages(['code' => 'That code is incorrect or has expired.']);
        }

        $user->markEmailAsVerified();

        return ['user' => $this->present($user->fresh())];
    }

    public function resendVerification(Request $request)
    {
        $user = $request->user();
        if (! $user->hasVerifiedEmail()) {
            $this->sendCode($user, 'verify');
        }

        return ['sent' => true];
    }

    public function forgotPassword(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        if ($user = User::where('email', strtolower($data['email']))->first()) {
            $this->sendCode($user, 'reset');
        }

        // Same answer whether or not the account exists, so the form can't be used to find members.
        return ['sent' => true];
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'digits:6'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);
        $email = strtolower($data['email']);

        if (! $this->checkCode($email, 'reset', $data['code']) || ! ($user = User::where('email', $email)->first())) {
            throw ValidationException::withMessages(['code' => 'That code is incorrect or has expired.']);
        }

        $user->forceFill(['password' => Hash::make($data['password'])])->save();

        return ['reset' => true];
    }

    // ---------------------------------------------------------------------

    private function sendCode(User $user, string $purpose): void
    {
        $code = (string) random_int(100000, 999999);
        Cache::put($this->codeKey($user->email, $purpose), Hash::make($code), now()->addMinutes(self::CODE_TTL_MINUTES));

        $subject = $purpose === 'verify' ? 'Your Rekonekte verification code' : 'Reset your Rekonekte password';
        $line = $purpose === 'verify' ? 'Use this code to verify your email' : 'Use this code to choose a new password';
        $body = "Bonjou {$user->name},\n\n{$line}:\n\n    {$code}\n\nIt expires in ".self::CODE_TTL_MINUTES." minutes. If you didn't ask for this, you can ignore this email.\n\nLanmou · Kominote · Lakay\nRekonekte";

        try {
            Mail::raw($body, fn ($m) => $m->to($user->email)->subject($subject));
        } catch (\Throwable $e) {
            // A mail outage must not block sign-up; the member can press "resend".
            Log::warning('Rekonekte code email failed', ['email' => $user->email, 'error' => $e->getMessage()]);
        }
    }

    private function checkCode(string $email, string $purpose, string $code): bool
    {
        $key = $this->codeKey($email, $purpose);
        $hash = Cache::get($key);
        if (! $hash || ! Hash::check($code, $hash)) {
            return false;
        }
        Cache::forget($key);

        return true;
    }

    private function codeKey(string $email, string $purpose): string
    {
        return "code:$purpose:".sha1(strtolower($email));
    }

    private function present(User $user): array
    {
        $user->loadMissing('profile', 'photos');

        return [
            'id' => $user->id,
            'name' => $user->profile?->display_name ?? $user->name,
            'email' => $user->email,
            'email_verified' => $user->hasVerifiedEmail(),
            'role' => $user->role,
            'age' => $user->date_of_birth?->age,
            'city' => $user->profile?->city,
            'photo' => optional($user->photos->firstWhere('is_primary', true))->path,
        ];
    }
}
