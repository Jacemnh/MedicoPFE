<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PatientsController extends Controller
{
    /**
     * Obtenir tous les patients associés au professionnel (ceux qui ont réservé au moins un rendez-vous).
     */
    public function index(Request $request)
    {
        $pro = $request->user()->professionnel;

        if (!$pro) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $patients = Patient::with([
            'user',
            'dossierMedical',
            'consultations' => function ($q) use ($pro) {
                $q->where('professionnel_id', $pro->id)->with(['rendezVous.service', 'ordonnances', 'ordonnance']);
            }
        ])
            ->whereHas('consultations', function ($q) use ($pro) {
                $q->where('professionnel_id', $pro->id);
            })
            ->withCount([
                'rendezVous' => function ($q) use ($pro) {
                    $q->where('professionnel_id', $pro->id)->where('statut', 'termine');
                }
            ])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $patients
        ]);
    }

    /**
     * Obtenir le dossier médical et l'historique (5 mois) pour un patient spécifique.
     */
    public function getDossierComplet(Request $request, $id)
    {
        $pro = $request->user()->professionnel;

        if (!$pro) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $patient = Patient::with(['user', 'dossierMedical'])->find($id);

        if (!$patient) {
            return response()->json(['error' => 'Patient introuvable'], 404);
        }

        $fiveMonthsAgo = Carbon::now()->subMonths(5);

        $historique = $patient->consultations()
            ->with(['rendezVous.service', 'ordonnances', 'ordonnance'])
            ->where('created_at', '>=', $fiveMonthsAgo)
            ->where('professionnel_id', $pro->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'patient' => $patient->user,
                'dossier_medical' => $patient->dossierMedical,
                'historique_consultations' => $historique
            ]
        ]);
    }
}
