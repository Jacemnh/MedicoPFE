<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RendezVous;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PatientDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $patient = $user->patient;

        if (!$patient) {
            return response()->json(['success' => false, 'message' => 'Profil patient non trouvé.'], 403);
        }

        $now = Carbon::now();

        // Statistiques
        $upcomingCount = RendezVous::where('patient_id', $patient->id)
            ->where('date_heure', '>=', $now)
            ->whereIn('statut', ['en_attente', 'confirme'])
            ->count();

        $totalConsultations = RendezVous::where('patient_id', $patient->id)->count();

        $pendingPayments = DB::table('rendez_vous')
            ->where('patient_id', $patient->id)
            ->where('statut', 'confirme')
            ->whereNotNull('montant')
            ->where('montant', '>', 0)
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('paiements')
                    ->whereColumn('paiements.rendez_vous_id', 'rendez_vous.id')
                    ->where('paiements.statut', 'paye');
            });

        $pendingPaymentsCount = (clone $pendingPayments)->count();
        $pendingPaymentsTotal = (clone $pendingPayments)->sum('montant');

        $documentsCount = \App\Models\Document::whereHas('dossierMedical', function($q) use ($patient) {
            $q->where('patient_id', $patient->id);
        })->count();

        // Calcul des données pour les graphiques (6 derniers mois)
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = Carbon::now()->subMonths($i)->startOfMonth();
            $months[$monthStart->format('Y-m')] = [
                'name' => str_replace(
                    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
                    $monthStart->format('M')
                ),
                'visites' => 0,
                'depenses' => 0,
                'status_termine' => 0,
                'status_annule' => 0,
                'status_confirme' => 0,
                'status_en_attente' => 0
            ];
        }

        $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();
        $pastAppointments = RendezVous::where('patient_id', $patient->id)
            ->where('date_heure', '>=', $sixMonthsAgo)
            ->get();

        foreach ($pastAppointments as $rdv) {
            $rdvDate = Carbon::parse($rdv->date_heure);
            $key = $rdvDate->format('Y-m');
            
            if (isset($months[$key])) {
                $months[$key]['visites']++;
                $months[$key]['depenses'] += $rdv->montant ?? 0;

                $status = $rdv->statut;
                if ($status === 'termine') $months[$key]['status_termine']++;
                elseif ($status === 'annule') $months[$key]['status_annule']++;
                elseif ($status === 'confirme') $months[$key]['status_confirme']++;
                elseif ($status === 'en_attente') $months[$key]['status_en_attente']++;
            }
        }

        $consultationsData = [];
        $expenseData = [];
        $statusData = [];
        foreach ($months as $m) {
            $consultationsData[] = ['month' => $m['name'], 'visites' => $m['visites']];
            $expenseData[] = ['month' => $m['name'], 'depenses' => $m['depenses']];
            $statusData[] = [
                'month' => $m['name'],
                'termine' => $m['status_termine'],
                'annule' => $m['status_annule']
            ];
        }

        // Répartition par spécialité
        $allAppointments = RendezVous::where('patient_id', $patient->id)
            ->with('professionnel.specialite')
            ->get();
            
        $specialtyCounts = [];
        foreach ($allAppointments as $rdv) {
            $specialtyName = ($rdv->professionnel && $rdv->professionnel->specialite) ? $rdv->professionnel->specialite->nom : 'Généraliste';
            if (!isset($specialtyCounts[$specialtyName])) {
                $specialtyCounts[$specialtyName] = 0;
            }
            $specialtyCounts[$specialtyName]++;
        }
        
        $specialtyData = [];
        foreach ($specialtyCounts as $name => $count) {
            $specialtyData[] = ['name' => $name, 'value' => $count];
        }
        
        // $statusData est déjà calculé ci-dessus avec les mois

        // Prochains rendez-vous (5 suivants)
        $upcoming = RendezVous::where('patient_id', $patient->id)
            ->where('date_heure', '>=', $now)
            ->whereIn('statut', ['en_attente', 'confirme'])
            ->with(['professionnel.user', 'professionnel.specialite', 'professionnel.cabinet', 'service'])
            ->orderBy('date_heure', 'asc')
            ->limit(5)
            ->get();

        $formattedAppointments = $upcoming->map(function ($rdv) {
            $dt = Carbon::parse($rdv->date_heure);
            $pro = $rdv->professionnel;
            return [
                'id' => $rdv->id,
                'doctorName' => $pro && $pro->user ? 'Dr. ' . $pro->user->nom . ' ' . $pro->user->prenom : 'Inconnu',
                'specialty' => $pro && $pro->specialite ? $pro->specialite->nom : 'Généraliste',
                'date' => $dt->format('Y-m-d'),
                'time' => $dt->format('H:i'),
                'status' => $rdv->statut === 'confirme' ? 'confirmed' : ($rdv->statut === 'en_attente' ? 'pending' : $rdv->statut),
                'location' => $pro && $pro->cabinet ? $pro->cabinet->nom : 'Cabinet',
                'address' => $pro && $pro->cabinet ? ($pro->cabinet->adresse . ', ' . $pro->cabinet->ville) : '',
                'service' => $rdv->service ? $rdv->service->nom : 'Consultation',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'upcoming_count' => $upcomingCount,
                    'total_consultations' => $totalConsultations,
                    'pending_payments_count' => $pendingPaymentsCount,
                    'pending_payments_total' => $pendingPaymentsTotal ?? 0,
                    'documents_count' => $documentsCount,
                ],
                'upcoming_appointments' => $formattedAppointments,
                'charts' => [
                    'statusData' => $statusData,
                    'consultationsData' => $consultationsData,
                    'specialtyData' => $specialtyData,
                    'expenseData' => $expenseData,
                ],
            ]
        ]);
    }
}
