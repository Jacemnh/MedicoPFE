<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RendezVous;
use App\Models\Patient;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SecretaireController extends Controller
{
    /**
     * Obtenir les métriques et les listes du tableau de bord pour le professionnel de la secrétaire.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $secretaire = $user->secretaire;

        if (!$secretaire || !$secretaire->professionnel_id) {
            return response()->json(['success' => false, 'message' => 'Lien professionnel non trouvé'], 403);
        }

        $proId = $secretaire->professionnel_id;
        $today = Carbon::today();

        // 1. Statistiques de base
        $totalRdv = RendezVous::where('professionnel_id', $proId)->count();

        $todayCount = RendezVous::where('professionnel_id', $proId)
            ->whereDate('date_heure', $today)
            ->count();

        $pendingCount = RendezVous::where('professionnel_id', $proId)
            ->where('statut', 'en attente')
            ->count();

        $confirmedCount = RendezVous::where('professionnel_id', $proId)
            ->where('statut', 'confirmé')
            ->count();

        $cancelledCount = RendezVous::where('professionnel_id', $proId)
            ->where('statut', 'annule')
            ->count();

        $totalPatients = DB::table('rendez_vous')
            ->where('professionnel_id', $proId)
            ->distinct('patient_id')
            ->count('patient_id');

        // 2. Rendez-vous en attente (5 derniers)
        $pendingAppointments = RendezVous::where('professionnel_id', $proId)
            ->where('statut', 'en attente')
            ->with(['patient.user', 'service'])
            ->orderBy('date_heure', 'asc')
            ->limit(5)
            ->get();

        // 3. Planning d'aujourd'hui
        $todaySchedule = RendezVous::where('professionnel_id', $proId)
            ->whereDate('date_heure', $today)
            ->with(['patient.user', 'service'])
            ->orderBy('date_heure', 'asc')
            ->get();

        // 4. Activité hebdomadaire — 7 dernières semaines
        $weeklyData = [];
        for ($i = 6; $i >= 0; $i--) {
            $weekStart = Carbon::now()->subWeeks($i)->startOfWeek();
            $weekEnd   = Carbon::now()->subWeeks($i)->endOfWeek();
            $weekLabel = 'S' . $weekStart->weekOfYear;

            $consultations = RendezVous::where('professionnel_id', $proId)
                ->whereBetween('date_heure', [$weekStart, $weekEnd])
                ->where('statut', '!=', 'annule')
                ->count();

            $urgences = RendezVous::where('professionnel_id', $proId)
                ->whereBetween('date_heure', [$weekStart, $weekEnd])
                ->where('statut', '!=', 'annule')
                ->whereHas('service', fn($q) => $q->where('nom', 'like', '%urgence%'))
                ->count();

            $weeklyData[] = [
                'semaine'       => $weekLabel,
                'consultations' => $consultations,
                'urgences'      => $urgences,
            ];
        }

        // 5. Répartition par type de service (donut chart)
        $serviceStats = RendezVous::where('professionnel_id', $proId)
            ->where('statut', '!=', 'annule')
            ->with('service')
            ->get()
            ->groupBy(fn($rdv) => $rdv->service->nom ?? 'Autre')
            ->map(fn($group, $name) => ['name' => $name, 'value' => $group->count()])
            ->values();

        $totalServices = $serviceStats->sum('value');
        $colors = ['#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#EC4899', '#6366F1'];

        $pieData = $serviceStats->map(function ($item, $index) use ($totalServices, $colors) {
            $pct = $totalServices > 0 ? round(($item['value'] / $totalServices) * 100) : 0;
            return [
                'name'    => $item['name'],
                'value'   => $item['value'],
                'percent' => $pct . '%',
                'color'   => $colors[$index % count($colors)],
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'today_rdv'      => $todayCount,
                    'total_rdv'      => $totalRdv,
                    'pending_rdv'    => $pendingCount,
                    'confirmed_rdv'  => $confirmedCount,
                    'cancelled_rdv'  => $cancelledCount,
                    'total_patients' => $totalPatients,
                ],
                'pending'      => $pendingAppointments->map(fn($rdv) => $this->formatRdv($rdv)),
                'schedule'     => $todaySchedule->map(fn($rdv) => $this->formatRdv($rdv)),
                'weekly_chart' => $weeklyData,
                'pie_chart'    => $pieData,
            ]
        ]);
    }

    /**
     * Obtenir tous les rendez-vous pour le professionnel lié.
     */
    public function appointments(Request $request): JsonResponse
    {
        $secretaire = $request->user()->secretaire;
        if (!$secretaire || !$secretaire->professionnel_id) {
            return response()->json(['success' => false, 'message' => 'Lien professionnel non trouvé'], 403);
        }
        $proId = $secretaire->professionnel_id;

        $query = RendezVous::with(['patient.user', 'patient.dossierMedical', 'service', 'consultation.ordonnances', 'plageHoraire'])
            ->where('professionnel_id', $proId);

        if ($request->has('statut') && $request->statut !== 'tous') {
            $query->where('statut', $request->statut);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('patient.user', function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                    ->orWhere('prenom', 'like', "%{$search}%");
            });
        }

        $appointments = $query->orderBy('date_heure', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $appointments
        ]);
    }

    /**
     * Obtenir la liste des patients pour le professionnel lié.
     */
    public function patients(Request $request): JsonResponse
    {
        try {
            $secretaire = $request->user()->secretaire;
            if (!$secretaire || !$secretaire->professionnel_id) {
                return response()->json(['success' => false, 'message' => 'Lien professionnel non trouvé'], 403);
            }
            $proId = $secretaire->professionnel_id;

            $patients = Patient::with([
                'user',
                'dossierMedical',
                'consultations' => function ($q) use ($proId) {
                    $q->where('professionnel_id', $proId)->with(['rendezVous.service', 'ordonnances', 'ordonnance']);
                }
            ])
                ->whereHas('consultations', function ($q) use ($proId) {
                    $q->where('professionnel_id', $proId);
                })
                ->withCount([
                    'rendezVous' => function ($q) use ($proId) {
                        $q->where('professionnel_id', $proId)->where('statut', 'termine');
                    }
                ])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $patients
            ]);
        } catch (\Exception $e) {
            \Log::error('SecretaireController@patients error: ' . $e->getMessage(), [
                'exception' => $e
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des patients',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Aide pour formater le RendezVous pour le frontend.
     */
    private function formatRdv($rdv)
    {
        $dt = Carbon::parse($rdv->date_heure);
        return [
            'id' => $rdv->id,
            'patient' => $rdv->patient->user->prenom . ' ' . $rdv->patient->user->nom,
            'initials' => strtoupper($rdv->patient->user->prenom[0] . $rdv->patient->user->nom[0]),
            'date' => $dt->translatedFormat('d M Y'),
            'time' => $dt->format('H:i'),
            'status' => $rdv->statut,
            'doctor' => 'Cabinet',
            'reason' => $rdv->service->nom ?? 'Consultation',
            'telephone' => $rdv->patient->user->telephone ?? '—',
            'email' => $rdv->patient->user->email ?? '—',
            'color' => '#8B5CF6',
            'reprogrammed' => (bool)$rdv->reprogrammed
        ];
    }
}

