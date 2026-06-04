<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Stripe\Stripe;
use Stripe\Checkout\Session;
use Carbon\Carbon;
use App\Models\SubscriptionPayment;
use Barryvdh\DomPDF\Facade\Pdf;

class ProSubscriptionController extends Controller
{
    /**
     * Créer une session Stripe Checkout pour un abonnement.
     */
    public function createCheckoutSession(Request $request)
    {
        $request->validate([
            'subscription_id' => 'required|exists:subscriptions,id',
        ]);

        $pro = $request->user()->professionnel;
        if (!$pro) {
            return response()->json(['error' => 'Accès réservé aux professionnels'], 403);
        }

        $subscription = Subscription::findOrFail($request->subscription_id);

        Stripe::setApiKey(config('services.stripe.secret'));

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        $session = Session::create([
            'payment_method_types' => ['card'],
            'line_items' => [
                [
                    'price_data' => [
                        'currency' => 'eur',
                        'product_data' => [
                            'name' => 'Abonnement Medico - ' . $subscription->name,
                            'description' => $subscription->description,
                        ],
                        'unit_amount' => (int) ($subscription->price * 100),
                    ],
                    'quantity' => 1,
                ]
            ],
            'mode' => 'payment',
            'payment_intent_data' => [
                'description' => 'Paiement d’abonnement - ' . $subscription->name . ' (Professionnel: ' . $pro->user->nom . ' ' . $pro->user->prenom . ')',
            ],
            'success_url' => $frontendUrl . '/professionnel/abonnement?success=true&subscription_id=' . $subscription->id,
            'cancel_url' => $frontendUrl . '/professionnel/abonnement?canceled=true',
            'metadata' => [
                'professionnel_id' => $pro->id,
                'subscription_id' => $subscription->id
            ]
        ]);

        // Créer un enregistrement de paiement en attente
        SubscriptionPayment::create([
            'professionnel_id' => $pro->id,
            'subscription_id' => $subscription->id,
            'stripe_session_id' => $session->id,
            'montant' => $subscription->price,
            'statut' => 'en_attente',
        ]);

        return response()->json([
            'success' => true,
            'url' => $session->url
        ]);
    }

    /**
     * Vérifier et activer l'abonnement après le retour de Stripe.
     */
    public function verifySubscription(Request $request)
    {
        $request->validate([
            'subscription_id' => 'required|exists:subscriptions,id',
        ]);

        $pro = $request->user()->professionnel;
        if (!$pro) {
            return response()->json(['error' => 'Accès réservé aux professionnels'], 403);
        }

        $subscription = Subscription::findOrFail($request->subscription_id);

        // Calculer la date de fin
        $duration = 30; // Défaut mensuel
        if (str_contains(strtolower($subscription->type), 'annuel') || str_contains(strtolower($subscription->name), 'annuel')) {
            $duration = 365;
        }

        $pro->update([
            'subscription_id' => $subscription->id,
            'subscription_ends_at' => Carbon::now()->addDays($duration),
        ]);

        // Mettre à jour l'enregistrement de paiement
        SubscriptionPayment::where('professionnel_id', $pro->id)
            ->where('subscription_id', $subscription->id)
            ->where('statut', 'en_attente')
            ->orderBy('created_at', 'desc')
            ->first()
            ?->update([
                'statut' => 'paye',
                'date_paiement' => Carbon::now(),
            ]);

        // Notifier les administrateurs
        $admins = \App\Models\User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            \App\Models\Notification::create([
                'user_id' => $admin->id,
                'type' => 'success',
                'titre' => 'Nouveau paiement d\'abonnement',
                'message' => 'Le professionnel ' . $pro->user->prenom . ' ' . $pro->user->nom . ' a payé son abonnement (' . $subscription->name . ').',
                'action_type' => 'admin_finance',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Abonnement activé avec succès',
            'pro' => $pro
        ]);
    }

    /**
     * Récupérer l'état actuel de l'abonnement du professionnel.
     */
    public function getStatus(Request $request)
    {
        $pro = $request->user()->professionnel;
        if (!$pro) {
            return response()->json(['error' => 'Accès réservé aux professionnels'], 403);
        }

        $now = Carbon::now();
        $status = 'aucun';
        $daysRemaining = 0;

        if ($pro->subscription_ends_at && $pro->subscription_ends_at->isFuture()) {
            $status = 'actif';
            $daysRemaining = $now->diffInDays($pro->subscription_ends_at);
        } elseif ($pro->trial_ends_at && $pro->trial_ends_at->isFuture()) {
            $status = 'essai';
            $daysRemaining = $now->diffInDays($pro->trial_ends_at);
        } elseif ($pro->subscription_ends_at && $pro->subscription_ends_at->isPast()) {
            $status = 'expire';
        } elseif ($pro->trial_ends_at && $pro->trial_ends_at->isPast()) {
            $status = 'essai_termine';
        }

        $history = SubscriptionPayment::where('professionnel_id', $pro->id)
            ->with('subscription')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'status' => $status,
            'days_remaining' => $daysRemaining,
            'subscription_ends_at' => $pro->subscription_ends_at,
            'trial_ends_at' => $pro->trial_ends_at,
            'current_subscription' => $pro->subscription,
            'history' => $history
        ]);
    }

    /**
     * Télécharger une facture d'abonnement.
     */
    public function downloadInvoice(Request $request, $id)
    {
        $pro = $request->user()->professionnel;
        $payment = SubscriptionPayment::with(['subscription', 'professionnel.user', 'professionnel.cabinet'])
            ->where('professionnel_id', $pro->id)
            ->findOrFail($id);

        $data = [
            'payment' => $payment,
            'invoice_number' => 'SUB-' . str_pad($payment->id, 5, '0', STR_PAD_LEFT),
            'date' => $payment->date_paiement ? $payment->date_paiement->format('d/m/Y') : $payment->created_at->format('d/m/Y'),
            'professional' => $pro,
            'cabinet' => $pro->cabinet,
            'user' => $pro->user,
            'items' => [
                [
                    'description' => 'Abonnement ' . $payment->subscription->name,
                    'amount' => $payment->montant
                ]
            ],
            'total' => $payment->montant
        ];

        $pdf = Pdf::loadView('pdf.facture_paiement_abonnement', $data);
        return $pdf->download('facture-' . $data['invoice_number'] . '.pdf');
    }
}
