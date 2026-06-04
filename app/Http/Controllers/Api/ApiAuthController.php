<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Cabinet;
use App\Models\Professionnel;
use App\Models\Specialite;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;

class ApiAuthController extends Controller
{
    /**
     * Connexion — authentification via session, retourne l'utilisateur en JSON.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        $user = Auth::user();

        if ($user->is_blocked) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            
            throw ValidationException::withMessages([
                'email' => ['Accès refusé : votre compte est actuellement suspendu.'],
            ]);
        }

        if ($user->role === 'professionnel') {
            $pro = $user->professionnel;
            if ($pro && $pro->etat === 'en_attente') {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                
                throw ValidationException::withMessages([
                    'email' => ['Votre compte est en cours de validation par notre équipe. Vous recevrez un email dès qu\'il sera accepté.'],
                ]);
            } elseif ($pro && $pro->etat === 'refuse') {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                
                throw ValidationException::withMessages([
                    'email' => ['Votre demande d\'inscription a été refusée. Veuillez nous contacter pour plus d\'informations.'],
                ]);
            }
        }

        $request->session()->regenerate();

        $user = Auth::user()->load([
            'professionnel.cabinet',
            'professionnel.specialite',
            'professionnel.subscription',
            'secretaire.professionnel.cabinet',
            'secretaire.professionnel.user'
        ]);

        return response()->json([
            'user' => $user,
        ]);
    }

    /**
     * Inscription — créer un utilisateur + profil de rôle, retourne l'utilisateur en JSON.
     */
    public function register(Request $request): JsonResponse
    {
        // Règles de validation communes
        $rules = [
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:' . User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => ['required', 'in:patient,professionnel,secretaire'],
            'date_naissance' => ['required', 'date', 'before_or_equal:-18 years'],
        ];

        // Règles de validation spécifiques au rôle
        if ($request->role === 'professionnel') {
            $rules['specialite_id'] = ['required', 'exists:specialites,id'];

            // Vérifier si la spécialité sélectionnée est "Infirmier"
            $specialite = Specialite::find($request->specialite_id);
            $isInfirmier = $specialite && strtolower($specialite->nom) === 'infirmier';

            // Les champs du cabinet sont optionnels pour Infirmier, requis pour les autres
            $cabinetRule = $isInfirmier ? 'nullable' : 'required';
            $rules = array_merge($rules, [
                'cabinet_nom' => [$cabinetRule, 'string', 'max:255'],
                'cabinet_adresse' => [$cabinetRule, 'string', 'max:255'],
                'cabinet_ville' => [$cabinetRule, 'string', 'max:255'],
                'cabinet_telephone' => [$cabinetRule, 'string', 'max:20'],
                'cabinet_email' => [$cabinetRule, 'email', 'max:255'],
                'diplome' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            ]);
        } elseif ($request->role === 'secretaire') {
            $rules['code_professionnel'] = ['required', 'string'];
        }

        $request->validate($rules);

        // Pour la secrétaire, vérifier le code professionnel
        if ($request->role === 'secretaire') {
            $professionnel = Professionnel::where('code_professionnel', $request->code_professionnel)->first();

            if (!$professionnel) {
                throw ValidationException::withMessages([
                    'code_professionnel' => ['Le code professionnel est invalide. Veuillez vérifier le code et réessayer.'],
                ]);
            }
        }

        // Créer l'utilisateur
        $user = User::create([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'date_naissance' => $request->date_naissance,
        ]);

        event(new Registered($user));

        // Créer un profil spécifique selon le rôle
        $responseData = [
            'user' => [
                'id' => $user->id,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ];

        if ($request->role === 'patient') {
            \App\Models\Patient::create([
                'user_id' => $user->id,
                'date_naissance' => $request->date_naissance,
            ]);
        } elseif ($request->role === 'professionnel') {
            $cabinetId = null;

            // Créer le cabinet uniquement si les champs du cabinet sont fournis (pas pour Infirmier)
            $specialite = Specialite::find($request->specialite_id);
            $isInfirmier = $specialite && strtolower($specialite->nom) === 'infirmier';

            if (!$isInfirmier && $request->cabinet_nom) {
                $cabinet = Cabinet::create([
                    'nom' => $request->cabinet_nom,
                    'adresse' => $request->cabinet_adresse,
                    'ville' => $request->cabinet_ville,
                    'telephone' => $request->cabinet_telephone,
                    'email' => $request->cabinet_email,
                    'pays' => 'France',
                ]);
                $cabinetId = $cabinet->id;
            }

            // Générer un code professionnel unique
            $codeProfessionnel = Professionnel::generateCode();

            // Stocker le diplôme téléversé
            $diplomePath = null;
            if ($request->hasFile('diplome')) {
                $diplomePath = $request->file('diplome')->store('diplomes', 'public');
            }

            // Créer le professionnel
            Professionnel::create([
                'user_id' => $user->id,
                'cabinet_id' => $cabinetId,
                'specialite_id' => $request->specialite_id,
                'code_professionnel' => $codeProfessionnel,
                'etat' => 'en_attente',
                'diplome_path' => $diplomePath,
            ]);

            $admins = User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                \App\Models\Notification::create([
                    'user_id' => $admin->id,
                    'type' => 'systeme',
                    'titre' => 'Nouvelle inscription professionnel',
                    'message' => 'Le professionnel ' . $user->prenom . ' ' . $user->nom . ' vient de s\'inscrire. Validation requise.',
                    'action_type' => 'admin_validation',
                ]);
            }

            $responseData['code_professionnel'] = $codeProfessionnel;
            $responseData['message'] = 'Votre compte est en cours de validation.';
        } elseif ($request->role === 'secretaire') {
            \App\Models\Secretaire::create([
                'user_id' => $user->id,
                'professionnel_id' => $professionnel->id,
            ]);
        }

        if ($request->role !== 'professionnel') {
            Auth::login($user);
        }

        // Charger les relations pour une réponse cohérente
        $user->load([
            'professionnel.cabinet',
            'professionnel.specialite',
            'professionnel.subscription',
            'secretaire.professionnel.cabinet',
            'secretaire.professionnel.user'
        ]);

        return response()->json([
            'user' => $user,
            'code_professionnel' => $responseData['code_professionnel'] ?? null,
            'message' => $responseData['message'] ?? null
        ], 201);
    }

    /**
     * Vérifier un code professionnel — retourne valide/invalide + nom du professionnel.
     */
    public function verifyProfessionalCode(Request $request): JsonResponse
    {
        $request->validate([
            'code_professionnel' => ['required', 'string'],
        ]);

        $professionnel = Professionnel::where('code_professionnel', $request->code_professionnel)
            ->with('user:id,nom,prenom')
            ->first();

        if (!$professionnel) {
            return response()->json([
                'valid' => false,
                'message' => 'Code professionnel invalide.',
            ]);
        }

        $fullName = $professionnel->user->prenom . ' ' . $professionnel->user->nom;

        return response()->json([
            'valid' => true,
            'professionnel_name' => $fullName,
            'message' => 'Code valide — ' . $fullName,
        ]);
    }

    /**
     * Déconnexion — détruire la session.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Déconnecté avec succès.']);
    }

    /**
     * Utilisateur — retourner l'utilisateur authentifié.
     */
    public function user(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['user' => null]);
        }

        $user->load([
            'professionnel.cabinet',
            'professionnel.specialite',
            'professionnel.subscription',
            'secretaire.professionnel.cabinet',
            'secretaire.professionnel.user'
        ]);

        return response()->json([
            'user' => $user
        ]);
    }

    /**
     * Cabinets — lister tous les cabinets (pour d'autres usages).
     */
    public function cabinets(): JsonResponse
    {
        return response()->json(Cabinet::all(['id', 'nom', 'adresse']));
    }

    /**
     * Spécialités — lister toutes les spécialités (pour le formulaire d'inscription).
     */
    public function specialites(): JsonResponse
    {
        return response()->json(Specialite::all(['id', 'nom']));
    }
}
