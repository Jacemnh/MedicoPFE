<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\Checkout\Session;
use Barryvdh\DomPDF\Facade\Pdf;

class PaymentController extends Controller
{
    /**
     * Liste des paiements du patient connecté.
     */
    public function index(Request $request)
    {
        $patient = $request->user()->patient;
        if (!$patient) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $payments = Paiement::with(['rendezVous.professionnel.user', 'rendezVous.service'])
            ->whereHas('rendezVous', function ($q) use ($patient) {
                $q->where('patient_id', $patient->id);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payments
        ]);
    }

    /**
     * Créer une session Stripe Checkout.
     */
    public function createCheckoutSession(Request $request, $id)
    {
        $patient = $request->user()->patient;
        $payment = Paiement::with(['rendezVous.service', 'rendezVous.professionnel.user'])->findOrFail($id);

        if ($payment->rendezVous->patient_id !== $patient->id) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        if ($payment->statut === 'paye') {
            return response()->json(['error' => 'Déjà payé'], 400);
        }

        Stripe::setApiKey(config('services.stripe.secret'));

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        $session = Session::create([
            'payment_method_types' => ['card'],
            'line_items' => [[
                'price_data' => [
                    'currency' => 'eur',
                    'product_data' => [
                        'name' => 'Consultation médicale - ' . ($payment->rendezVous->service->nom ?? 'Service médical'),
                    ],
                    'unit_amount' => (int) ($payment->montant * 100), // En centimes, doit être un entier
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'payment_intent_data' => [
                'description' => 'Paiement de consultation - ' . ($payment->rendezVous->service->nom ?? 'Service médical') . ' avec Dr. ' . $payment->rendezVous->professionnel->user->nom,
            ],
            'success_url' => $frontendUrl . '/patient/paiement?success=true&payment_id=' . $id,
            'cancel_url' => $frontendUrl . '/patient/paiement?canceled=true',
            'metadata' => [
                'paiement_id' => $id,
                'rendez_vous_id' => $payment->rendez_vous_id
            ]
        ]);

        return response()->json([
            'success' => true,
            'id' => $session->id,
            'url' => $session->url
        ]);
    }

    /**
     * Marquer un paiement comme réussi (appelé après retour de Stripe).
     * Note: Dans un vrai projet, on utiliserait un Webhook Stripe. 
     * Ici on simplifie pour le test.
     */
    public function verifyPayment(Request $request, $id)
    {
        $patient = $request->user()->patient;
        $payment = Paiement::findOrFail($id);

        if ($payment->rendezVous->patient_id !== $patient->id) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        // Pour ce projet de démonstration/test, on fait confiance au paramètre success si Stripe a redirigé
        $payment->update([
            'statut' => 'paye',
            'date_paiement' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Paiement confirmé'
        ]);
    }

    /**
     * Télécharger la facture en PDF.
     */
    public function downloadInvoice(Request $request, $id)
    {
        $patient = $request->user()->patient;
        $payment = Paiement::with(['rendezVous.professionnel.user', 'rendezVous.professionnel.cabinet', 'rendezVous.service', 'rendezVous.patient.user'])
            ->findOrFail($id);

        if ($payment->rendezVous->patient_id !== $patient->id) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        return $this->generateInvoicePdf($payment);
    }

    /**
     * Générer le PDF de facture (méthode partagée).
     */
    public function generateInvoicePdf(Paiement $payment)
    {
        $rdv = $payment->rendezVous;
        $pro = $rdv->professionnel;
        $patientUser = $rdv->patient->user;
        $cabinet = $pro->cabinet;

        $invoiceNumber = 'FAC-' . str_pad($payment->id, 5, '0', STR_PAD_LEFT);
        $dateFacture = $payment->date_paiement ? $payment->date_paiement->format('d/m/Y') : now()->format('d/m/Y');
        $dateRdv = $rdv->date_heure ? \Carbon\Carbon::parse($rdv->date_heure)->format('d/m/Y à H:i') : 'N/A';

        $data = [
            'payment' => $payment,
            'rdv' => $rdv,
            'pro' => $pro,
            'patientUser' => $patientUser,
            'cabinet' => $cabinet,
            'invoiceNumber' => $invoiceNumber,
            'dateFacture' => $dateFacture,
            'dateRdv' => $dateRdv
        ];

        $pdf = Pdf::loadView('pdf.facture_paiement_consultation', $data)->setPaper('a4');

        return $pdf->download('facture_' . $invoiceNumber . '.pdf');
    }
    /**
     * Exporter l'historique complet des paiements du patient en PDF.
     */
    public function exportReport(Request $request)
    {
        $patient = $request->user()->patient;
        if (!$patient) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $payments = Paiement::with(['rendezVous.professionnel.user', 'rendezVous.service'])
            ->whereHas('rendezVous', function ($q) use ($patient) {
                $q->where('patient_id', $patient->id);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        $totalPaye = $payments->where('statut', 'paye')->sum('montant');
        $totalAttente = $payments->where('statut', 'en_attente')->sum('montant');

        $data = [
            'user' => $request->user(),
            'payments' => $payments,
            'totalPaye' => $totalPaye,
            'totalAttente' => $totalAttente,
            'date_generation' => now()->format('d/m/Y à H:i')
        ];

        $pdf = Pdf::loadView('pdf.rapport_paiements_patient', $data)->setPaper('a4');

        return $pdf->download('rapport_paiements_' . now()->format('Y_m_d') . '.pdf');
    }
}
