<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cabinet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;

class CabinetController extends Controller
{
    /**
     * Afficher les informations du cabinet.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $cabinet = null;

        if ($user->role === 'secretaire') {
            $cabinet = $user->secretaire?->professionnel?->cabinet;
        } elseif ($user->role === 'professionnel') {
            $cabinet = $user->professionnel?->cabinet;
        }

        if (!$cabinet) {
            return response()->json([
                'success' => false, 
                'message' => 'Cabinet non trouvé ou non associé'
            ], 404);
        }

        return response()->json([
            'success' => true, 
            'data' => $cabinet
        ]);
    }

    /**
     * Mettre à jour les informations du cabinet.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $cabinet = null;

        if ($user->role === 'secretaire') {
            $cabinet = $user->secretaire?->professionnel?->cabinet;
        } elseif ($user->role === 'professionnel') {
            $cabinet = $user->professionnel?->cabinet;
        }

        if (!$cabinet) {
            return response()->json([
                'success' => false, 
                'message' => 'Cabinet non trouvé ou accès non autorisé'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'adresse' => 'required|string|max:255',
            'ville' => 'required|string|max:255',
            'pays' => 'required|string|max:255',
            'telephone' => 'required|string|max:20',
            'email' => 'required|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false, 
                'errors' => $validator->errors()
            ], 422);
        }

        $cabinet->update($request->only([
            'nom', 'adresse', 'ville', 'pays', 'telephone', 'email'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Informations du cabinet mises à jour avec succès',
            'data' => $cabinet
        ]);
    }
}
