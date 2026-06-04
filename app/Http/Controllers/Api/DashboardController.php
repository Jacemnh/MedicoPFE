<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RendezVous;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Obtenir les statistiques du tableau de bord professionnel.
     */
    public function index(Request $request)
    {
        $pro = $request->user()->professionnel;

        if (!$pro) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $today = Carbon::today();
        $startOfWeek = Carbon::now()->startOfWeek();
        $endOfWeek = Carbon::now()->endOfWeek();

        // Rendez-vous aujourd'hui
        $todayAppointments = RendezVous::where('professionnel_id', $pro->id)
            ->whereDate('date_heure', $today)
            ->with(['patient.user', 'service'])
            ->orderBy('date_heure')
            ->get();

        // Total hebdomadaire
        $weeklyTotal = RendezVous::where('professionnel_id', $pro->id)
            ->whereBetween('date_heure', [$startOfWeek, $endOfWeek])
            ->count();

        // Revenus estimés (cette semaine)
        $estimatedRevenue = RendezVous::where('rendez_vous.professionnel_id', $pro->id)
            ->whereBetween('date_heure', [$startOfWeek, $endOfWeek])
            ->where('statut', '!=', 'annule')
            ->join('services', 'rendez_vous.service_id', '=', 'services.id')
            ->sum('services.prix');

        // Nombre de services actifs
        $activeServicesCount = DB::table('services')
            ->where('professionnel_id', $pro->id)
            ->where('est_actif', true)
            ->count();

        // Calcul des données pour les graphiques (6 derniers mois)
        $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();

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
                'revenus' => 0
            ];
        }

        $pastAppointments = RendezVous::where('rendez_vous.professionnel_id', $pro->id)
            ->where('date_heure', '>=', $sixMonthsAgo)
            ->leftJoin('services', 'rendez_vous.service_id', '=', 'services.id')
            ->select('rendez_vous.*', 'services.prix as service_prix', 'services.nom as service_nom')
            ->get();

        $statusCounts = [];
        $serviceCounts = [];

        foreach ($pastAppointments as $rdv) {
            $rdvDate = Carbon::parse($rdv->date_heure);
            $key = $rdvDate->format('Y-m');

            // 1 & 2. Visites et Revenus
            if (isset($months[$key])) {
                $months[$key]['visites']++;
                if ($rdv->statut === 'termine') {
                    $months[$key]['revenus'] += $rdv->service_prix ?? 0;
                }
            }

            // 3. Répartition Statut
            $status = $rdv->statut;
            if (!isset($statusCounts[$status])) {
                $statusCounts[$status] = 0;
            }
            $statusCounts[$status]++;

            // 4. Répartition Service
            $serviceName = $rdv->service_nom ?? 'Inconnu';
            if (!isset($serviceCounts[$serviceName])) {
                $serviceCounts[$serviceName] = 0;
            }
            $serviceCounts[$serviceName]++;
        }

        $consultationsData = [];
        $revenueData = [];
        foreach ($months as $m) {
            $consultationsData[] = ['month' => $m['name'], 'visites' => $m['visites']];
            $revenueData[] = ['month' => $m['name'], 'revenus' => $m['revenus']];
        }

        $statusData = [];
        $statusColors = [
            'en_attente' => 'En attente',
            'confirme' => 'Confirmé',
            'termine' => 'Terminé',
            'annule' => 'Annulé'
        ];
        foreach ($statusCounts as $name => $count) {
            $displayName = $statusColors[$name] ?? ucfirst(str_replace('_', ' ', $name));
            $statusData[] = ['name' => $displayName, 'value' => $count];
        }

        $serviceData = [];
        foreach ($serviceCounts as $name => $count) {
            $serviceData[] = ['name' => $name, 'value' => $count];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'today_count' => $todayAppointments->count(),
                    'weekly_total' => $weeklyTotal,
                    'estimated_revenue' => $estimatedRevenue,
                    'active_services' => $activeServicesCount,
                ],
                'today_appointments' => $todayAppointments,
                'charts' => [
                    'revenueData' => $revenueData,
                    'consultationsData' => $consultationsData,
                    'statusData' => $statusData,
                    'serviceData' => $serviceData,
                ]
            ]
        ]);
    }
}
