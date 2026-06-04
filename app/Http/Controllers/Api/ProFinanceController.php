<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class ProFinanceController extends Controller
{
    public function index(Request $request)
    {
        $pro = $request->user()->professionnel;

        if (!$pro) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        // Get all base payments for this professional
        $baseQuery = \App\Models\Paiement::whereHas('rendezVous', function($q) use ($pro) {
            $q->where('professionnel_id', $pro->id);
        });

        // 1. Calculate Stats
        $todaySum = (clone $baseQuery)
            ->where('statut', 'paye')
            ->whereDate('date_paiement', Carbon::today())
            ->sum('montant');

        $monthSum = (clone $baseQuery)
            ->where('statut', 'paye')
            ->whereMonth('date_paiement', Carbon::now()->month)
            ->whereYear('date_paiement', Carbon::now()->year)
            ->sum('montant');

        $yearSum = (clone $baseQuery)
            ->where('statut', 'paye')
            ->whereYear('date_paiement', Carbon::now()->year)
            ->sum('montant');

        $pendingSum = (clone $baseQuery)
            ->where('statut', 'en_attente')
            ->sum('montant');

        // 2. Chart Data (Monthly)
        $chartData = [];
        for ($i = 1; $i <= 12; $i++) {
            $sum = (clone $baseQuery)
                ->where('statut', 'paye')
                ->whereMonth('date_paiement', $i)
                ->whereYear('date_paiement', Carbon::now()->year)
                ->sum('montant');
            
            // Format month abbreviation in French
            $monthName = Carbon::create()->month($i)->translatedFormat('M');
            
            $chartData[] = [
                'name' => ucfirst($monthName),
                'total' => (float) $sum
            ];
        }

        // Weekly chart data for the current month
        $weeklyChartData = [];
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();
        
        $currentDate = clone $startOfMonth;
        $weekCount = 1;
        while ($currentDate <= $endOfMonth) {
            $endOfWeek = (clone $currentDate)->endOfWeek();
            if ($endOfWeek > $endOfMonth) {
                $endOfWeek = clone $endOfMonth;
            }

            $sum = (clone $baseQuery)
                ->where('statut', 'paye')
                ->whereBetween('date_paiement', [$currentDate->copy()->startOfDay(), $endOfWeek->copy()->endOfDay()])
                ->sum('montant');

            $weeklyChartData[] = [
                'name' => 'Sem ' . $weekCount,
                'total' => (float) $sum
            ];

            $currentDate = $endOfWeek->addDay();
            $weekCount++;
        }

        // 3. Transactions List
        $transactions = (clone $baseQuery)
            ->with(['rendezVous.patient.user', 'rendezVous.service'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'today' => (float) $todaySum,
                    'this_month' => (float) $monthSum,
                    'this_year' => (float) $yearSum,
                    'pending' => (float) $pendingSum,
                ],
                'chart' => [
                    'monthly' => $chartData,
                    'weekly' => $weeklyChartData,
                ],
                'transactions' => $transactions
            ]
        ]);
    }

    /**
     * Télécharger la facture en PDF (côté professionnel).
     */
    public function downloadInvoice(Request $request, $id)
    {
        $pro = $request->user()->professionnel;
        if (!$pro) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $payment = \App\Models\Paiement::with(['rendezVous.professionnel.user', 'rendezVous.professionnel.cabinet', 'rendezVous.service', 'rendezVous.patient.user'])
            ->findOrFail($id);

        if ($payment->rendezVous->professionnel_id !== $pro->id) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        // Delegate to PaymentController's shared logic
        $paymentController = new PaymentController();
        return $paymentController->generateInvoicePdf($payment);
    }
    /**
     * Exporter le rapport financier global en PDF.
     */
    public function exportReport(Request $request)
    {
        $pro = $request->user()->professionnel;
        if (!$pro) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $baseQuery = \App\Models\Paiement::whereHas('rendezVous', function($q) use ($pro) {
            $q->where('professionnel_id', $pro->id);
        });

        // 1. Calculate Stats (This Year)
        $monthSum = (clone $baseQuery)
            ->where('statut', 'paye')
            ->whereMonth('date_paiement', Carbon::now()->month)
            ->whereYear('date_paiement', Carbon::now()->year)
            ->sum('montant');

        $yearSum = (clone $baseQuery)
            ->where('statut', 'paye')
            ->whereYear('date_paiement', Carbon::now()->year)
            ->sum('montant');

        $pendingSum = (clone $baseQuery)
            ->where('statut', 'en_attente')
            ->sum('montant');

        // 2. Transactions List (This Year)
        $transactions = (clone $baseQuery)
            ->whereYear('created_at', Carbon::now()->year)
            ->with(['rendezVous.patient.user', 'rendezVous.service'])
            ->orderBy('created_at', 'desc')
            ->get();

        $data = [
            'pro' => $pro,
            'user' => $request->user(),
            'cabinet' => $pro->cabinet,
            'stats' => [
                'month' => $monthSum,
                'year' => $yearSum,
                'pending' => $pendingSum,
            ],
            'transactions' => $transactions,
            'date_generation' => now()->format('d/m/Y à H:i')
        ];

        $pdf = Pdf::loadView('pdf.rapport_finances', $data)->setPaper('a4');

        return $pdf->download('rapport_financier_' . now()->format('Y_m_d') . '.pdf');
    }
}
