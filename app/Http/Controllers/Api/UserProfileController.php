<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * Contrôleur de profil générique utilisable par tous les rôles.
 */
class UserProfileController extends Controller
{
    /**
     * Obtenir le profil de l'utilisateur authentifié.
     */
    public function show(Request $request)
    {
        $user = $request->user()->load([
            'patient',
            'professionnel.cabinet',
            'professionnel.specialite',
            'secretaire.professionnel.cabinet',
        ]);

        return response()->json([
            'success' => true,
            'data'    => $user,
        ]);
    }

    /**
     * Mettre à jour le profil de l'utilisateur authentifié.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'nom'            => 'sometimes|required|string|max:255',
            'prenom'         => 'sometimes|required|string|max:255',
            'email'          => [
                'sometimes', 'required', 'email',
                Rule::unique('users')->ignore($user->id),
            ],
            'telephone'      => 'sometimes|nullable|string|max:20',
            'date_naissance' => 'sometimes|nullable|date|before:today',
            'password'       => 'sometimes|nullable|string|min:8|confirmed',
            'photo'          => 'sometimes|nullable|string',
        ]);

        // Hacher le mot de passe si fourni
        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        // Gérer l'upload de photo en Base64
        if (!empty($validated['photo']) && str_starts_with($validated['photo'], 'data:image')) {
            try {
                $fileName = time() . '_' . $user->id . '.png';
                $dir = public_path('uploads/profiles');
                if (!file_exists($dir)) {
                    mkdir($dir, 0777, true);
                }
                $data = explode(',', $validated['photo']);
                file_put_contents($dir . '/' . $fileName, base64_decode($data[1]));
                $validated['photo'] = '/uploads/profiles/' . $fileName;
            } catch (\Exception $e) {
                unset($validated['photo']);
            }
        } else {
            unset($validated['photo']);
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour avec succès',
            'data'    => $user->load([
                'patient',
                'professionnel.cabinet',
                'professionnel.specialite',
                'secretaire.professionnel.cabinet',
            ]),
        ]);
    }

    /**
     * Lier une secrétaire à un professionnel via son code.
     */
    public function linkProfessional(Request $request)
    {
        $request->validate([
            'code_professionnel' => 'required|string',
        ]);

        $user = $request->user();

        if ($user->role !== 'secretaire') {
            return response()->json(['success' => false, 'message' => 'Seules les secrétaires peuvent se lier à un professionnel'], 403);
        }

        $professionnel = \App\Models\Professionnel::where('code_professionnel', $request->code_professionnel)->first();

        if (!$professionnel) {
            return response()->json(['success' => false, 'message' => 'Code professionnel invalide'], 404);
        }

        if (!$user->secretaire) {
            $user->secretaire()->create([
                'professionnel_id' => $professionnel->id,
            ]);
        } else {
            $user->secretaire->update([
                'professionnel_id' => $professionnel->id,
            ]);
        }

        \App\Models\Notification::create([
            'user_id' => $professionnel->user->id,
            'titre' => 'Nouvelle secrétaire rattachée',
            'message' => "La secrétaire {$user->nom} {$user->prenom} vient de se lier à votre cabinet.",
            'type' => 'secretaire',
            'read' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Compte lié avec succès au Dr. ' . $professionnel->user->nom,
            'data'    => $user->load([
                'secretaire.professionnel.user',
                'secretaire.professionnel.cabinet',
            ]),
        ]);
    }
}
