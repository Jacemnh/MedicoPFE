<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    /**
     * Lister les services pour le professionnel authentifié.
     */
    public function index(Request $request)
    {
        $pro = $request->user()->professionnel;

        if (!$pro) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $services = Service::where('professionnel_id', $pro->id)
            ->orWhereNull('professionnel_id') // Inclure les services globaux s'il y en a
            ->get();

        return response()->json([
            'success' => true,
            'data' => $services
        ]);
    }

    /**
     * Créer un nouveau service personnalisé pour le professionnel.
     */
    public function store(Request $request)
    {
        $pro = $request->user()->professionnel;

        if (!$pro) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
            'prix' => 'required|numeric|min:0',
            'specialite_id' => 'required|exists:specialites,id',
            'est_actif' => 'boolean'
        ]);

        $service = Service::create(array_merge($validated, [
            'professionnel_id' => $pro->id
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Service créé avec succès',
            'data' => $service
        ], 201);
    }

    /**
     * Mettre à jour un service existant.
     */
    public function update(Request $request, Service $service)
    {
        $pro = $request->user()->professionnel;

        if (!$pro || $service->professionnel_id !== $pro->id) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
            'prix' => 'sometimes|required|numeric|min:0',
            'est_actif' => 'sometimes|boolean'
        ]);

        $service->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service mis à jour avec succès',
            'data' => $service
        ]);
    }

    /**
     * Supprimer un service personnalisé.
     */
    public function destroy(Service $service)
    {
        $pro = request()->user()->professionnel;

        if (!$pro || $service->professionnel_id !== $pro->id) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service supprimé avec succès'
        ]);
    }
}
