<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Patient;
use App\Models\Professionnel;
use App\Models\Secretaire;
use App\Models\Specialite;
use App\Models\RendezVous;
use App\Models\Paiement;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminStatsController extends Controller
{
    /**
     * Obtenir les statistiques récapitulatives du tableau de bord.
     */
    public function getSummary()
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();

        // KPIs
        $totalPatients = Patient::count();
        $appointmentsThisMonth = RendezVous::whereBetween('date_heure', [$startOfMonth, $endOfMonth])->count();
        $revenueThisMonth = Paiement::where('statut', 'complete')
            ->whereBetween('date_paiement', [$startOfMonth, $endOfMonth])
            ->sum('montant');
        $activeDoctors = Professionnel::count();

        // 1. Rendez-vous par mois (6 derniers mois)
        $appointmentsTrend = RendezVous::select(
            DB::raw('count(id) as total'),
            DB::raw("DATE_FORMAT(date_heure, '%Y-%m') as month")
        )
        ->where('date_heure', '>=', $now->copy()->subMonths(6))
        ->groupBy('month')
        ->orderBy('month')
        ->get();

        // 2. Revenus par mois (6 derniers mois)
        $revenueTrend = Paiement::select(
            DB::raw('sum(montant) as total'),
            DB::raw("DATE_FORMAT(date_paiement, '%Y-%m') as month")
        )
        ->where('statut', 'complete')
        ->where('date_paiement', '>=', $now->copy()->subMonths(6))
        ->groupBy('month')
        ->orderBy('month')
        ->get();

        // 3. Répartition par spécialité
        $specialtyDistribution = DB::table('professionnels')
            ->join('specialites', 'professionnels.specialite_id', '=', 'specialites.id')
            ->select('specialites.nom', DB::raw('count(professionnels.id) as count'))
            ->groupBy('specialites.nom')
            ->get();

        // 4. Statut des rendez-vous (mois en cours)
        $statusBreakdown = RendezVous::whereBetween('date_heure', [$startOfMonth, $endOfMonth])
            ->select('statut', DB::raw('count(id) as count'))
            ->groupBy('statut')
            ->get();

        // 5. Taux d'occupation (simplifié : total des rendez-vous vs capacité moyenne)
        $occupancyRate = min(100, round(($appointmentsThisMonth / max(1, $activeDoctors * 8 * 22)) * 100));

        return response()->json([
            'success' => true,
            'data' => [
                'kpis' => [
                    'total_patients' => $totalPatients,
                    'appointments_this_month' => $appointmentsThisMonth,
                    'revenue_this_month' => $revenueThisMonth,
                    'active_doctors' => $activeDoctors,
                    'occupancy_rate' => $occupancyRate,
                ],
                'charts' => [
                    'appointments_trend' => $appointmentsTrend,
                    'revenue_trend' => $revenueTrend,
                    'specialties' => $specialtyDistribution,
                    'status' => $statusBreakdown,
                ]
            ]
        ]);
    }

    /**
     * Obtenir les statistiques détaillées des patients.
     */
    public function getPatientStats()
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();

        $totalPatients = Patient::count();
        $newThisMonth = Patient::where('created_at', '>=', $startOfMonth)->count();

        // Répartition par genre
        $genderBreakdown = User::where('role', 'patient')
            ->select('sexe', DB::raw('count(id) as count'))
            ->groupBy('sexe')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $totalPatients,
                'new_this_month' => $newThisMonth,
                'gender' => $genderBreakdown
            ]
        ]);
    }

    /**
     * Obtenir les statistiques des professionnels.
     */
    public function getProStats()
    {
        $doctorCount = Professionnel::count();
        $specialtyCount = Specialite::count();

        return response()->json([
            'success' => true,
            'data' => [
                'doctor_count' => $doctorCount,
                'specialty_count' => $specialtyCount
            ]
        ]);
    }

    /**
     * Obtenir les statistiques des secrétaires.
     */
    public function getSecretaryStats()
    {
        $secretaryCount = Secretaire::count();

        return response()->json([
            'success' => true,
            'data' => [
                'count' => $secretaryCount
            ]
        ]);
    }

    /**
     * Obtenir les statistiques financières.
     */
    public function getFinanceStats()
    {
        $now = Carbon::now();
        $startOfCurrentMonth = $now->copy()->startOfMonth();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        $totalRevenue = \App\Models\SubscriptionPayment::whereIn('statut', ['paye', 'complete'])->sum('montant');
        $currentMonthRevenue = \App\Models\SubscriptionPayment::whereIn('statut', ['paye', 'complete'])
            ->whereBetween('date_paiement', [$startOfCurrentMonth, $now])
            ->sum('montant');
        $lastMonthRevenue = \App\Models\SubscriptionPayment::whereIn('statut', ['paye', 'complete'])
            ->whereBetween('date_paiement', [$startOfLastMonth, $endOfLastMonth])
            ->sum('montant');
            
        $pendingAmount = \App\Models\SubscriptionPayment::where('statut', 'en_attente')->sum('montant');

        $paidCount = \App\Models\SubscriptionPayment::whereIn('statut', ['paye', 'complete'])->count();
        $unpaidCount = \App\Models\SubscriptionPayment::where('statut', 'en_attente')->count();
        
        // Revenus par mois (6 derniers mois) pour le graphe d'évolution
        $revenueTrend = \App\Models\SubscriptionPayment::select(
            DB::raw('sum(montant) as total'),
            DB::raw("DATE_FORMAT(date_paiement, '%Y-%m') as month")
        )
        ->whereIn('statut', ['paye', 'complete'])
        ->where('date_paiement', '>=', $now->copy()->subMonths(6)->startOfMonth())
        ->groupBy('month')
        ->orderBy('month')
        ->get();

        // Revenus par médecin (via abonnement)
        $revenueByDoctor = DB::table('subscription_payments')
            ->join('professionnels', 'subscription_payments.professionnel_id', '=', 'professionnels.id')
            ->join('users', 'professionnels.user_id', '=', 'users.id')
            ->whereIn('subscription_payments.statut', ['paye', 'complete'])
            ->select(DB::raw("CONCAT(users.prenom, ' ', users.nom) as name"), DB::raw('sum(subscription_payments.montant) as total'))
            ->groupBy('name')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        // Revenus par plan d'abonnement (remplace service)
        $revenueByService = DB::table('subscription_payments')
            ->join('subscriptions', 'subscription_payments.subscription_id', '=', 'subscriptions.id')
            ->whereIn('subscription_payments.statut', ['paye', 'complete'])
            ->select('subscriptions.name as nom', DB::raw('sum(subscription_payments.montant) as total'))
            ->groupBy('subscriptions.name')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_revenue' => $totalRevenue,
                'current_month_revenue' => $currentMonthRevenue,
                'pending_amount' => $pendingAmount,
                'monthly_growth' => $lastMonthRevenue > 0 ? (($currentMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100 : ($currentMonthRevenue > 0 ? 100 : 0),
                'paid_unpaid' => [
                    ['name' => 'Payés', 'value' => $paidCount],
                    ['name' => 'En attente', 'value' => $unpaidCount]
                ],
                'revenue_trend' => $revenueTrend,
                'by_doctor' => $revenueByDoctor,
                'by_service' => $revenueByService
            ]
        ]);
    }
}
