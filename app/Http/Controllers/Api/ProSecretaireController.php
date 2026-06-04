<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Secretaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProSecretaireController extends Controller
{
    /**
     * Obtenir la liste des secrétaires pour le professionnel authentifié.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $professionnel = $user->professionnel;

        if (!$professionnel) {
            return response()->json([
                'success' => false,
                'message' => 'Profil professionnel non trouvé.'
            ], 403);
        }

        $secretaires = Secretaire::where('professionnel_id', $professionnel->id)
            ->with('user')
            ->get();

        $formattedSecretaires = $secretaires->map(function ($sec) {
            return [
                'id' => $sec->id,
                'user_id' => $sec->user->id,
                'nom' => $sec->user->nom,
                'prenom' => $sec->user->prenom,
                'email' => $sec->user->email,
                'telephone' => $sec->user->telephone,
                'photo' => $sec->user->photo,
                'date_inscription' => $sec->created_at->format('d/m/Y'),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formattedSecretaires
        ]);
    }

    /**
     * Retirer une secrétaire du cabinet du professionnel.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $professionnel = $user->professionnel;

        if (!$professionnel) {
            return response()->json([
                'success' => false,
                'message' => 'Profil professionnel non trouvé.'
            ], 403);
        }

        $secretaire = Secretaire::where('id', $id)
            ->where('professionnel_id', $professionnel->id)
            ->first();

        if (!$secretaire) {
            return response()->json([
                'success' => false,
                'message' => 'Secrétaire non trouvée ou non autorisée.'
            ], 404);
        }

        // Dissocier la secrétaire du professionnel 
        // Ou supprimer complètement l'enregistrement de secrétaire selon la logique métier.
        // Nous allons simplement supprimer l'enregistrement Secretaire pour l'instant.
        // Supprimons-le pour que l'utilisateur puisse se réinscrire avec un code différent.
        // Puisque ce n'est généralement pas nullable, nous supprimons le lien.
        $secretaire->delete();

        // Pourrait également vouloir changer le rôle de l'utilisateur en patient ou le supprimer ? Nous laissons l'utilisateur intact.
        // Changeons le rôle de l'utilisateur à 'patient'
        // En fait, supprimer le modèle Secretaire est suffisant.

        return response()->json([
            'success' => true,
            'message' => 'Secrétaire retirée avec succès.'
        ]);
    }
}
