<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Professionnel;
use App\Models\RendezVous;
use App\Models\PlageHoraire;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PatientBookingController extends Controller
{
    public function index(Request $request)
    {
        $patient = $request->user()->patient;

        if (!$patient) {
            return response()->json(['error' => 'Non autorisé. Profil patient requis.'], 403);
        }

        $rendezvous = RendezVous::where('patient_id', $patient->id)
            ->with(['professionnel.user', 'professionnel.specialite', 'professionnel.cabinet', 'service', 'consultation.ordonnances', 'paiement'])
            ->orderBy('date_heure', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rendezvous->map(function ($rdv) {
                $dt = Carbon::parse($rdv->date_heure);
                $pro = $rdv->professionnel;
                $statusType = 'upcoming'; // par défaut
    
                if ($dt->isPast() && in_array($rdv->statut, ['confirme', 'en_attente'])) {
                    $statusType = 'past';
                    // Simulation: marquer comme terminé si passé et confirmé
                    if ($rdv->statut === 'confirme') {
                        $rdv->statut = 'termine';
                    }
                } elseif ($rdv->statut === 'annule') {
                    $statusType = 'past';
                }

                $result = [
                    'id' => $rdv->id,
                    'doctor' => 'Dr. ' . ($pro && $pro->user ? $pro->user->nom . ' ' . $pro->user->prenom : 'Inconnu'),
                    'specialty' => $pro && $pro->specialite ? $pro->specialite->nom : 'Généraliste',
                    'date' => $dt->format('d M Y'), // ex: 15 Fév 2024
                    'day' => $dt->format('d'),
                    'month' => $dt->format('M'),
                    'year' => $dt->format('Y'),
                    'time' => $dt->format('H:i'),
                    'status' => $rdv->statut === 'confirme' ? 'confirmed' : ($rdv->statut === 'en_attente' ? 'pending' : ($rdv->statut === 'termine' ? 'done' : 'cancelled')),
                    'statusLabel' => $rdv->statut === 'confirme' ? 'Confirmé' : ($rdv->statut === 'en_attente' ? 'En attente' : ($rdv->statut === 'termine' ? 'Terminé' : 'Annulé')),
                    'type' => $statusType, // 'upcoming' or 'past'
                    'consultType' => 'in-person', // ou teleconsult si dispo dans bd
                    'location' => $pro && $pro->cabinet ? ($pro->cabinet->adresse . ', ' . $pro->cabinet->ville) : 'Cabinet',
                    'rating' => 5, // Simulation
                    'color' => '#6366F1',
                    'initials' => $pro && $pro->user ? strtoupper(substr($pro->user->nom, 0, 1) . substr($pro->user->prenom, 0, 1)) : 'DR',
                    'photo_url' => $pro && $pro->user && $pro->user->photo ? $pro->user->photo : null,
                    'pro_id' => $pro ? $pro->id : null,
                    'cabinet_name' => $pro && $pro->cabinet ? $pro->cabinet->nom : '',
                    'cabinet_address' => $pro && $pro->cabinet ? $pro->cabinet->adresse : '',
                    'cabinet_city' => $pro && $pro->cabinet ? $pro->cabinet->ville : '',
                    'cabinet_tel' => $pro && $pro->cabinet ? $pro->cabinet->telephone : '',
                    'cabinet_email' => $pro && $pro->cabinet ? $pro->cabinet->email : '',
                    'bio' => $pro ? $pro->bio : 'Professionnel de santé sur la plateforme.',
                    'services' => $pro && $pro->services ? $pro->services->map(function ($s) {
                        return [
                            'id' => $s->id,
                            'nom' => $s->nom,
                            'prix' => $s->prix
                        ];
                    }) : [],
                ];

                // Inclure les données de consultation si disponibles ET si le paiement est effectué
                $isPaid = $rdv->paiement && $rdv->paiement->statut === 'paye';
                $result['is_paid'] = $isPaid;

                if ($rdv->consultation && $isPaid) {
                    $result['consultation'] = [
                        'notes' => $rdv->consultation->notes,
                        'ordonnances' => $rdv->consultation->ordonnances ? $rdv->consultation->ordonnances->map(function ($ord) {
                            return ['medicaments' => $ord->medicaments];
                        }) : [],
                    ];
                }

                return $result;
            })
        ]);
    }

    /**
     * Vérifie si le patient a des paiements en attente depuis plus de 3 jours
     */
    public function checkPaymentStatus(Request $request)
    {
        $patient = $request->user()->patient;

        if (!$patient) {
            return response()->json(['success' => false, 'error' => 'Profil patient requis.'], 403);
        }

        $hasUnpaid = DB::table('paiements')
            ->join('rendez_vous', 'paiements.rendez_vous_id', '=', 'rendez_vous.id')
            ->where('rendez_vous.patient_id', $patient->id)
            ->where('paiements.statut', 'en_attente')
            ->where('paiements.created_at', '<', Carbon::now()->subDays(3))
            ->exists();

        return response()->json([
            'success' => true,
            'blocked' => $hasUnpaid
        ]);
    }

    public function getProfessionnels(Request $request)
    {
        $today = Carbon::now()->startOfDay();
        $nextWeek = $today->copy()->addDays(6)->endOfDay();

        $pros = Professionnel::with([
            'user',
            'specialite',
            'cabinet',
            'services',
            'plagesHoraires' => function ($query) use ($today, $nextWeek) {
                $query->whereBetween('date', [$today->format('Y-m-d'), $nextWeek->format('Y-m-d')])
                    ->whereIn('statut', ['disponible', 'reserve'])
                    ->orderBy('date')
                    ->orderBy('heure_debut');
            }
        ])->get();

        return response()->json([
            'success' => true,
            'data' => $pros->map(function ($pro) use ($today) {
                $groupedSlots = [];
                for ($i = 0; $i < 7; $i++) {
                    $dateStr = $today->copy()->addDays($i)->format('Y-m-d');
                    $groupedSlots[$dateStr] = [];
                }

                foreach ($pro->plagesHoraires as $slot) {
                    $dateStr = $slot->date instanceof Carbon ? $slot->date->format('Y-m-d') : Carbon::parse($slot->date)->format('Y-m-d');
                    if (isset($groupedSlots[$dateStr])) {
                        $groupedSlots[$dateStr][] = [
                            'id' => $slot->id,
                            'time' => substr($slot->heure_debut, 0, 5), // "HH:MM"
                            'statut' => $slot->statut
                        ];
                    }
                }

                return [
                    'id' => $pro->id,
                    'name' => 'Dr. ' . ($pro->user ? $pro->user->nom . ' ' . $pro->user->prenom : 'Inconnu'),
                    'nom' => $pro->user ? $pro->user->nom : '',
                    'prenom' => $pro->user ? $pro->user->prenom : '',
                    'sexe' => $pro->user ? $pro->user->sexe : null,
                    'specialty' => $pro->specialite ? $pro->specialite->nom : 'Généraliste',
                    'location' => $pro->cabinet ? $pro->cabinet->ville : 'Non spécifié',
                    'cabinet_name' => $pro->cabinet ? $pro->cabinet->nom : '',
                    'cabinet_address' => $pro->cabinet ? $pro->cabinet->adresse : '',
                    'cabinet_city' => $pro->cabinet ? $pro->cabinet->ville : '',
                    'cabinet_tel' => $pro->cabinet ? $pro->cabinet->telephone : '',
                    'cabinet_email' => $pro->cabinet ? $pro->cabinet->email : '',
                    'photo' => $pro->user ? $pro->user->photo : null,
                    'price' => 'Conventionné',
                    'color' => '#8B5CF6',
                    'bio' => 'Professionnel de santé sur la plateforme.',
                    'initials' => $pro->user ? strtoupper(substr($pro->user->nom, 0, 1) . substr($pro->user->prenom, 0, 1)) : 'DR',
                    'teleconsult' => true,
                    'services' => $pro->services->map(function ($s) {
                        return [
                            'id' => $s->id,
                            'nom' => $s->nom,
                            'prix' => $s->prix
                        ];
                    }),
                    'prochaines_dispos' => $groupedSlots
                ];
            })
        ]);
    }

    public function store(Request $request)
    {
        $patient = $request->user()->patient;

        if (!$patient) {
            return response()->json(['error' => 'Non autorisé. Profil patient requis.'], 403);
        }

        // Vérifier s'il y a des paiements en attente depuis plus de 3 jours
        $hasUnpaid = DB::table('paiements')
            ->join('rendez_vous', 'paiements.rendez_vous_id', '=', 'rendez_vous.id')
            ->where('rendez_vous.patient_id', $patient->id)
            ->where('paiements.statut', 'en_attente')
            ->where('paiements.created_at', '<', Carbon::now()->subDays(3))
            ->exists();

        if ($hasUnpaid) {
            return response()->json([
                'error' => 'Paiement requis',
                'message' => 'Vous avez une ou plusieurs consultations impayées de plus de 3 jours. Veuillez régler vos factures avant de prendre un nouveau rendez-vous.',
                'requires_payment' => true
            ], 403);
        }

        $validated = $request->validate([
            'professionnel_id' => 'required|exists:professionnels,id',
            'plage_horaire_id' => 'required|exists:plages_horaires,id',
            'service_ids' => 'nullable|array',
            'service_ids.*' => 'exists:services,id',
            'motif' => 'nullable|string',
        ]);

        $plage = PlageHoraire::find($validated['plage_horaire_id']);

        if ($plage->statut !== 'disponible') {
            return response()->json(['error' => 'Ce créneau n\'est plus disponible.'], 400);
        }

        // Analyser la date et l'heure correctement
        $dateStr = $plage->date instanceof Carbon ? $plage->date->format('Y-m-d') : Carbon::parse($plage->date)->format('Y-m-d');
        // $plage->heure_debut format H:i:s
        $dateTime = Carbon::parse($dateStr . ' ' . $plage->heure_debut);

        $montant = null;
        if (!empty($validated['service_ids'])) {
            $services = \App\Models\Service::whereIn('id', $validated['service_ids'])->get();
            if ($services->count() > 0) {
                $montant = $services->sum('prix');
            }
        }

        $rdv = RendezVous::create([
            'patient_id' => $patient->id,
            'professionnel_id' => $validated['professionnel_id'],
            'plage_horaire_id' => $plage->id,
            'service_id' => !empty($validated['service_ids']) ? $validated['service_ids'][0] : null,
            'date_heure' => $dateTime,
            'statut' => 'en_attente',
            'montant' => $montant,
            'motif' => $validated['motif'] ?? '',
        ]);

        // Mettre à jour statut créneau
        $plage->update(['statut' => 'reserve']);

        // Notification au professionnel et à la secrétaire
        app(\App\Services\NotificationService::class)->notifyProAndSecretary(
            $rdv->professionnel,
            'Nouveau rendez-vous',
            'Le patient ' . $patient->user->prenom . ' ' . $patient->user->nom . ' a pris un rendez-vous pour le ' . $dateTime->format('d/m/Y à H:i') . '.',
            $rdv->id
        );

        return response()->json([
            'success' => true,
            'data' => $rdv
        ]);
    }

    /**
     * Annuler un rendez-vous (côté patient).
     */
    public function cancel(Request $request, $id)
    {
        $patient = $request->user()->patient;

        if (!$patient) {
            return response()->json(['error' => 'Non autorisé.'], 403);
        }

        $rdv = RendezVous::where('id', $id)
            ->where('patient_id', $patient->id)
            ->first();

        if (!$rdv) {
            return response()->json(['error' => 'Rendez-vous introuvable.'], 404);
        }

        if ($rdv->statut === 'annule') {
            return response()->json(['error' => 'Ce rendez-vous est déjà annulé.'], 422);
        }

        // Libérer le créneau horaire s'il y en a un de réservé
        if ($rdv->plage_horaire_id) {
            PlageHoraire::where('id', $rdv->plage_horaire_id)->update(['statut' => 'disponible']);
        }

        $rdv->update(['statut' => 'annule']);

        // Notification au professionnel
        $dt = Carbon::parse($rdv->date_heure);
        app(\App\Services\NotificationService::class)->notifyProAndSecretary(
            $rdv->professionnel,
            'Rendez-vous annulé',
            'Le patient ' . $patient->user->prenom . ' ' . $patient->user->nom . ' a annulé son rendez-vous du ' . $dt->format('d/m/Y à H:i') . '.',
            $rdv->id,
            'warning'
        );

        return response()->json(['success' => true, 'message' => 'Rendez-vous annulé avec succès.']);
    }

    /**
     * Reprogrammer un rendez-vous (côté patient).
     */
    public function reschedule(Request $request, $id)
    {
        $patient = $request->user()->patient;

        if (!$patient) {
            return response()->json(['error' => 'Non autorisé.'], 403);
        }

        $rdv = RendezVous::where('id', $id)
            ->where('patient_id', $patient->id)
            ->first();

        if (!$rdv) {
            return response()->json(['error' => 'Rendez-vous introuvable.'], 404);
        }

        $validated = $request->validate([
            'plage_horaire_id' => 'required|exists:plages_horaires,id',
            'service_ids' => 'nullable|array',
            'service_ids.*' => 'exists:services,id',
            'motif' => 'nullable|string',
        ]);

        $newPlage = PlageHoraire::find($validated['plage_horaire_id']);

        if ($newPlage->statut !== 'disponible') {
            return response()->json(['error' => 'Ce créneau n\'est plus disponible.'], 400);
        }

        // Libérer l'ancien créneau
        if ($rdv->plage_horaire_id) {
            PlageHoraire::where('id', $rdv->plage_horaire_id)->update(['statut' => 'disponible']);
        }

        // Analyser la date et l'heure pour le nouveau créneau
        $dateStr = $newPlage->date instanceof Carbon ? $newPlage->date->format('Y-m-d') : Carbon::parse($newPlage->date)->format('Y-m-d');
        $dateTime = Carbon::parse($dateStr . ' ' . $newPlage->heure_debut);

        $montant = $rdv->montant;
        if (!empty($validated['service_ids'])) {
            $services = \App\Models\Service::whereIn('id', $validated['service_ids'])->get();
            if ($services->count() > 0) {
                $montant = $services->sum('prix');
            }
        }

        $rdv->update([
            'plage_horaire_id' => $newPlage->id,
            'service_id' => !empty($validated['service_ids']) ? $validated['service_ids'][0] : $rdv->service_id,
            'date_heure' => $dateTime,
            'statut' => 'en_attente', // Réinitialiser en attente après la reprogrammation
            'montant' => $montant,
            'motif' => $validated['motif'] ?? $rdv->motif,
        ]);

        // Réserver le nouveau créneau
        $newPlage->update(['statut' => 'reserve']);

        // Notification au professionnel
        app(\App\Services\NotificationService::class)->notifyProAndSecretary(
            $rdv->professionnel,
            'Rendez-vous reprogrammé',
            'Le patient ' . $patient->user->prenom . ' ' . $patient->user->nom . ' a reprogrammé son rendez-vous au ' . $dateTime->format('d/m/Y à H:i') . '.',
            $rdv->id,
            'info'
        );

        return response()->json([
            'success' => true,
            'message' => 'Rendez-vous reprogrammé avec succès.',
            'data' => $rdv
        ]);
    }
}
