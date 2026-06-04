<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    /**
     * Obtenir le profil de l'utilisateur authentifié avec les détails du professionnel/cabinet.
     */
    public function show(Request $request)
    {
        $user = $request->user()->load([
            'professionnel.cabinet',
            'professionnel.specialite',
            'secretaire.professionnel.cabinet',
            'secretaire.professionnel.user'
        ]);

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    /**
     * Mettre à jour le profil de l'utilisateur authentifié.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'prenom' => 'sometimes|required|string|max:255',
            'email' => [
                'sometimes',
                'required',
                'email',
                Rule::unique('users')->ignore($user->id),
            ],
            'telephone' => 'sometimes|nullable|string|max:20',
            'password' => 'sometimes|nullable|string|min:8|confirmed',
            'photo' => 'sometimes|nullable|string', // Base64 ou URL

            // Mises à jour imbriquées Professionnel & Cabinet
            'cabinet' => 'sometimes|array',
            'cabinet.nom' => 'sometimes|nullable|string|max:255',
            'cabinet.adresse' => 'sometimes|nullable|string|max:255',
            'cabinet.ville' => 'sometimes|nullable|string|max:255',
            'cabinet.pays' => 'sometimes|nullable|string|max:255',
            'cabinet.telephone' => 'sometimes|nullable|string|max:255',
            'cabinet.email' => 'sometimes|nullable|email|max:255',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        // Gérer la photo (stockage Base64 simple pour la démo, ou stockage réel)
        if (isset($validated['photo']) && str_starts_with($validated['photo'], 'data:image')) {
            // Dans une vraie application, enregistrer sur le disque. Pour l'instant, on met à jour tel quel ou on implémente un stockage simple.
            // Implémentons un stockage simple vers public/uploads
            try {
                $imageData = $validated['photo'];
                $fileName = time() . '_' . $user->id . '.png';
                $path = public_path('uploads/profiles/' . $fileName);

                if (!file_exists(public_path('uploads/profiles'))) {
                    mkdir(public_path('uploads/profiles'), 0777, true);
                }

                $data = explode(',', $imageData);
                file_put_contents($path, base64_decode($data[1]));
                $validated['photo'] = '/uploads/profiles/' . $fileName;
            } catch (\Exception $e) {
                // Ignorer l'erreur photo ou la journaliser
            }
        }

        $user->update($validated);

        // Mettre à jour Professionnel/Cabinet si nécessaire
        if ($user->role === 'professionnel' && $user->professionnel) {
            if (isset($validated['cabinet']) && $user->professionnel->cabinet) {
                // Supprimer les valeurs nulles pour éviter d'écraser les colonnes NON NULLES
                $cabinetData = array_filter($validated['cabinet'], fn($v) => $v !== null);
                if (!empty($cabinetData)) {
                    $user->professionnel->cabinet->update($cabinetData);
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour avec succès',
            'data' => $user->load([
                'professionnel.cabinet',
                'professionnel.specialite',
                'secretaire.professionnel.cabinet',
                'secretaire.professionnel.user'
            ])
        ]);
    }

    /**
     * Envoyer le code professionnel par email
     */
    public function sendCode(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'email' => 'required|email'
        ]);

        if ($user->role !== 'professionnel' || !$user->professionnel) {
            return response()->json(['success' => false, 'message' => 'Non autorisé'], 403);
        }

        $code = $user->professionnel->code_professionnel;
        $email = $request->input('email');
        $nom = $user->nom;
        $prenom = $user->prenom;

        try {
            \Illuminate\Support\Facades\Mail::to($email)->send(new \App\Mail\CabinetCodeMail($code, $nom, $prenom));
            return response()->json(['success' => true, 'message' => 'Email envoyé avec succès !']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => "Erreur lors de l'envoi de l'email : " . $e->getMessage()], 500);
        }
    }
}
