<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Creneau;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    /**
     * Obtenir tous les créneaux pour le professionnel authentifié.
     */
    public function index(Request $request)
    {
        $pro = $request->user()->professionnel;

        if (!$pro) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $creneaux = Creneau::where('professionnel_id', $pro->id)
            ->orderBy('date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $creneaux,
        ]);
    }

    /**
     * Enregistrer un créneau (créer ou mettre à jour pour une date donnée).
     */
    public function store(Request $request)
    {
        $pro = $request->user()->professionnel;

        if (!$pro) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'date' => 'required|date',
            'horaires_travail' => 'required|array',
            'duree_consultation_defaut' => 'required|integer|in:15,20,30,45,60',
        ]);

        $creneau = Creneau::updateOrCreate(
            [
                'professionnel_id' => $pro->id,
                'date' => $validated['date'],
            ],
            [
                'horaires_travail' => $validated['horaires_travail'],
                'duree_consultation_defaut' => $validated['duree_consultation_defaut'],
                'disponible' => true,
            ]
        );

        // Régénérer automatiquement les créneaux pour cette semaine basés sur la nouvelle configuration
        $plageHoraireCtrl = app(\App\Http\Controllers\Api\PlageHoraireController::class);
        $plageHoraireCtrl->regenerateWeek($pro->id, $validated['date'], $creneau);

        return response()->json([
            'success' => true,
            'message' => 'Créneau enregistré avec succès',
            'data' => $creneau,
        ]);
    }

    /**
     * Supprimer un créneau.
     */
    public function destroy(Request $request, $id)
    {
        $pro = $request->user()->professionnel;

        if (!$pro) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $creneau = Creneau::where('id', $id)
            ->where('professionnel_id', $pro->id)
            ->first();

        if (!$creneau) {
            return response()->json(['error' => 'Créneau non trouvé'], 404);
        }

        $creneau->delete();

        return response()->json([
            'success' => true,
            'message' => 'Créneau supprimé',
        ]);
    }
}
