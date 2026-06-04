<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RendezVous;
use App\Models\Paiement;
use App\Models\User;
use Illuminate\Http\Request;

class RendezVousController extends Controller
{
    /**
     * Obtenir tous les rendez-vous pour le professionnel.
     */
    public function index(Request $request)
    {
        $pro = $request->user()->professionnel;

        if (!$pro) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $query = RendezVous::with(['patient.user', 'patient.dossierMedical', 'service', 'consultation.ordonnances', 'plageHoraire'])
            ->where('professionnel_id', $pro->id);

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

        // Annulation automatique des rendez-vous passés non traités
        $notificationService = app(\App\Services\NotificationService::class);
        $localNowStr = \Carbon\Carbon::now('Africa/Tunis')->format('Y-m-d H:i:s');
        
        RendezVous::where('date_heure', '<', $localNowStr)
            ->where('statut', 'en_attente')
            ->get()
            ->each(function (RendezVous $rdv) use ($notificationService) {
                $rdv->update(['statut' => 'annule']);
                if ($rdv->plage_horaire_id) {
                    \App\Models\PlageHoraire::where('id', $rdv->plage_horaire_id)
                        ->update(['statut' => 'disponible']);
                }
                
                // Envoyer un email d'annulation automatique au patient
                $dt = \Carbon\Carbon::parse($rdv->date_heure);
                $msg = "Le cabinet médical n'a malheureusement pas pu traiter votre demande de rendez-vous pour le " . $dt->format('d/m/Y à H:i') . " à temps. La date étant dépassée, cette demande a été automatiquement annulée.";
                
                $notificationService->notifyPatient(
                    $rdv->patient->user_id,
                    'Demande de rendez-vous expirée',
                    $msg,
                    null,
                    $rdv->id
                );
            });

        $consultations = $query->orderBy('date_heure', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $consultations
        ]);
    }

    /**
     * Mettre à jour le statut du rendez-vous et le statut du créneau associé.
     */
    public function updateStatus(Request $request, $id)
    {
        $user = $request->user();
        $pro = null;

        if ($user->isProfessionnel()) {
            $pro = $user->professionnel;
        } elseif ($user->isSecretaire()) {
            $pro = $user->secretaire->professionnel ?? null;
        }

        if (!$pro) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $rdv = RendezVous::where('id', $id)->where('professionnel_id', $pro->id)->first();

        if (!$rdv) {
            return response()->json(['error' => 'Rendez-vous non trouvé'], 404);
        }

        $request->validate([
            'statut' => 'required|in:en_attente,confirme,annule,termine'
        ]);

        if ($request->statut === 'confirme' && $rdv->reprogrammed) {
            return response()->json(['error' => 'Le rendez-vous ne peut pas être confirmé tant que le patient n\'a pas accepté le nouveau créneau.'], 422);
        }

        $rdv->update([
            'statut' => $request->statut,
            'reprogrammed' => $request->statut === 'annule' ? false : $rdv->reprogrammed
        ]);

        // Mettre à jour la plage horaire liée
        if ($rdv->plage_horaire_id) {
            $plage = \App\Models\PlageHoraire::find($rdv->plage_horaire_id);
            if ($plage) {
                if (in_array($request->statut, ['confirme', 'en_attente'])) {
                    $plage->update(['statut' => 'reserve']);
                } elseif (in_array($request->statut, ['annule'])) {
                    $plage->update(['statut' => 'disponible']);
                }
            }
        }

        // Notification au Patient (In-App + Email)
        if (in_array($request->statut, ['confirme', 'annule'])) {
            $dt = \Carbon\Carbon::parse($rdv->date_heure);
            $actionWord = $request->statut === 'confirme' ? 'confirmé' : 'annulé';
            $msg = "Votre rendez-vous du " . $dt->format('d/m/Y à H:i') . " a été " . $actionWord . " par le cabinet.";
            $type = $request->statut === 'confirme' ? 'success' : 'warning';
            
            app(\App\Services\NotificationService::class)->notifyPatient(
                $rdv->patient->user_id,
                'Rendez-vous ' . $actionWord,
                $msg,
                null,
                $rdv->id
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Statut mis à jour',
            'data' => $rdv
        ]);
    }

    /**
     * Enregistrer les notes de consultation et marquer le rendez-vous au statut demandé (défaut 'termine').
     */
    public function saveNotes(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isProfessionnel()) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $pro = $user->professionnel;

        $rdv = RendezVous::where('id', $id)->where('professionnel_id', $pro->id)->first();
        if (!$rdv) {
            return response()->json(['error' => 'Rendez-vous non trouvé'], 404);
        }

        $request->validate([
            'notes' => 'required|string',
            'diagnostique' => 'nullable|string',
            'ordonnance' => 'nullable|string',
            'groupe_sanguin' => 'nullable|string',
            'maladies_chroniques' => 'nullable|string',
            'poids' => 'nullable|numeric',
            'taille' => 'nullable|integer',
        ]);

        // S'assurer que le patient a un dossier médical
        $patient = $rdv->patient;
        $dossier = $patient->dossierMedical;

        if (!$dossier) {
            $dossier = \App\Models\DossierMedical::create([
                'patient_id' => $patient->id,
                'description' => 'Dossier créé automatiquement lors de la première consultation.',
                'groupe_sanguin' => $request->groupe_sanguin,
                'maladies_chroniques' => $request->maladies_chroniques,
                'poids' => $request->poids,
                'taille' => $request->taille,
            ]);
        } else {
            // Mettre à jour les informations du dossier
            $dossier->update([
                'groupe_sanguin' => $request->groupe_sanguin ?? $dossier->groupe_sanguin,
                'maladies_chroniques' => $request->maladies_chroniques ?? $dossier->maladies_chroniques,
                'poids' => $request->poids ?? $dossier->poids,
                'taille' => $request->taille ?? $dossier->taille,
            ]);
        }

        // Mettre à jour le statut du RDV
        $rdv->update(['statut' => 'termine']);

        // Créer ou mettre à jour la consultation
        $consultation = \App\Models\Consultation::updateOrCreate(
            ['rendez_vous_id' => $rdv->id],
            [
                'notes' => $request->notes,
                'diagnostique' => $request->diagnostique,
                'date_consultation' => now(),
                'dossier_medical_id' => $dossier->id,
                'patient_id' => $rdv->patient_id,
                'professionnel_id' => $rdv->professionnel_id,
            ]
        );

        // Mettre à jour le dossier médical avec l'ID de cette consultation
        $dossier->update(['consultation_id' => $consultation->id]);

        // Enregistrer l'ordonnance si fournie
        if ($request->filled('ordonnance')) {
            $ordonnance = \App\Models\Ordonnance::create([
                'consultation_id' => $consultation->id,
                'medicaments' => $request->ordonnance,
                'date_prescription' => now(),
            ]);

            $consultation->update(['ordonnance_id' => $ordonnance->id]);
        }

        // Créer un enregistrement de paiement en attente
        // Utiliser le montant total calculé lors de la réservation (qui inclut tous les services sélectionnés)
        // ou retomber sur le prix du service principal
        $montant = $rdv->montant > 0 ? $rdv->montant : ($rdv->service ? $rdv->service->prix : 0);
        
        Paiement::create([
            'rendez_vous_id' => $rdv->id,
            'montant' => $montant,
            'statut' => 'en_attente',
        ]);

        // Notification au Patient pour le paiement
        $msg = "Votre consultation avec le Dr. " . $pro->user->nom . " est terminée. Merci de procéder au règlement de " . $montant . "€ dans l'onglet 'Mes Paiements'.";
        app(\App\Services\NotificationService::class)->notifyPatient(
            $rdv->patient->user_id,
            'Règlement de consultation',
            $msg,
            'payment_required',
            $rdv->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Notes et ordonnance enregistrées. Demande de paiement envoyée.',
            'data' => $consultation->load(['ordonnances', 'ordonnance'])
        ]);
    }

    /**
     * Reprogrammer un rendez-vous.
     */
    public function reschedule(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isProfessionnel() && !$user->isSecretaire()) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $pro = $user->isProfessionnel() ? $user->professionnel : ($user->secretaire->professionnel ?? null);
        if (!$pro)
            return response()->json(['error' => 'Non autorisé'], 403);

        $rdv = RendezVous::where('id', $id)->where('professionnel_id', $pro->id)->first();
        if (!$rdv)
            return response()->json(['error' => 'Rendez-vous non trouvé'], 404);

        $request->validate([
            'date_heure' => 'required|date',
            'plage_horaire_id' => 'nullable|exists:plages_horaires,id'
        ]);

        // Libérer l'ancienne plage si elle existe
        if ($rdv->plage_horaire_id) {
            \App\Models\PlageHoraire::where('id', $rdv->plage_horaire_id)->update(['statut' => 'disponible']);
        }

        // Mettre à jour le RDV (statut: en attente de la réponse du patient)
        $rdv->update([
            'date_heure' => $request->date_heure,
            'plage_horaire_id' => $request->plage_horaire_id,
            'statut' => 'en_attente',
            'reprogrammed' => true
        ]);

        // Réserver la nouvelle plage si fournie
        if ($request->plage_horaire_id) {
            \App\Models\PlageHoraire::where('id', $request->plage_horaire_id)->update(['statut' => 'reserve']);
        }

        // Notification ACTION_REQUIRED au patient
        $dt = \Carbon\Carbon::parse($request->date_heure);
        app(\App\Services\NotificationService::class)->notifyPatient(
            $rdv->patient->user_id,
            'Proposition de nouvelle date pour votre rendez-vous',
            "Le cabinet médical vous propose de reprogrammer votre rendez-vous au " . $dt->format('d/m/Y à H:i') . ". Souhaitez-vous accepter ce créneau ?",
            'reschedule_response', // action_type pour afficher les boutons Accepter/Refuser en frontend
            $rdv->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Rendez-vous reprogrammé avec succès',
            'data' => $rdv->load(['patient.user', 'service'])
        ]);
    }
}
