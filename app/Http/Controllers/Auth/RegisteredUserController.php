<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\View\View;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): View
    {
        $cabinets = \App\Models\Cabinet::all();
        return view('auth.register', compact('cabinets'));
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => ['required', 'in:patient,professionnel,secretaire'],
            'cabinet_id' => ['required_if:role,professionnel,secretaire', 'nullable', 'exists:cabinets,id'],
            'specialite_id' => ['required_if:role,professionnel', 'nullable', 'exists:specialites,id'],
            'tarif' => ['required_if:role,professionnel', 'nullable', 'numeric', 'min:0'],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        event(new Registered($user));

        // Create specific profile based on role
        if ($request->role === 'patient') {
            \App\Models\Patient::create([
                'user_id' => $user->id,
            ]);
        } elseif ($request->role === 'professionnel') {
            \App\Models\Professionnel::create([
                'user_id' => $user->id,
                'cabinet_id' => $request->cabinet_id,
                'specialite_id' => $request->specialite_id,
                'tarif' => $request->tarif ?? 0,
            ]);
        } elseif ($request->role === 'secretaire') {
            \App\Models\Secretaire::create([
                'user_id' => $user->id,
                'cabinet_id' => $request->cabinet_id,
            ]);
        }

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }

    }

