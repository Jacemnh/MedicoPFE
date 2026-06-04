<?php

namespace App\Services;

use App\Models\Professionnel;
use App\Models\PlageHoraire;
use App\Models\RendezVous;
use App\Models\Service;
use App\Models\Patient;

class AiServiceRendezVous
{
    public function trouverMedecin($args)
    {
        $specialtyStr = $args['specialty'] ?? '';

        if (stripos($specialtyStr, 'général') !== false || stripos($specialtyStr, 'general') !== false) {
            $searchStr = 'générale';
        } else {
            $searchStr = $specialtyStr;
        }

        $targetDate = $args['date'] ?? null;

        $doctors = Professionnel::with([
            'user',
            'specialite',
            'plagesHoraires' => function ($q) use ($targetDate) {
                $q->where('statut', 'disponible')
                    ->where('date', '>=', now()->format('Y-m-d'));

                if ($targetDate) {
                    $q->where('date', $targetDate);
                }

                $q->orderBy('date')
                    ->orderBy('heure_debut')
                    ->take(20);
            }
        ])
            ->whereHas('specialite', function ($q) use ($searchStr) {
                $q->where('nom', 'like', "%{$searchStr}%");
            })->take(84)->get();

        $docList = [];
        foreach ($doctors as $doc) {
            $creneauxList = [];
            foreach ($doc->plagesHoraires as $p) {
                // Filtrer les créneaux dans le passé (par rapport à la date et heure actuelles)
                $slotDatetime = \Carbon\Carbon::parse($p->date->format('Y-m-d') . ' ' . $p->heure_debut);
                if ($slotDatetime->lt(now())) {
                    continue;
                }

                $creneauxList[] = [
                    'id' => $p->id,
                    'datetime' => $p->date->format('Y-m-d') . ' ' . $p->heure_debut
                ];
            }
            $docList[] = [
                'id' => $doc->id,
                'name' => "Dr. " . $doc->user->prenom . " " . $doc->user->nom,
                'specialty' => $doc->specialite->nom,
                'available_slots' => $creneauxList
            ];
        }

        return ['doctors_found' => count($docList), 'doctors' => $docList];
    }

    public function reserverRendezVous($args, $patientId)
    {
        \Illuminate\Support\Facades\Log::info("IA tente de réserver avec args: ", $args ?? []);
        try {
            $nomMedecin = $args['nom_medecin'] ?? null;
            $datetimeStr = $args['datetime'] ?? null;

            if (!$nomMedecin || !$datetimeStr) {
                return ['status' => 'error', 'message' => 'Les paramètres nom_medecin et datetime sont obligatoires.'];
            }

            // Chercher le médecin par son nom. Le format est souvent "Dr. prenom nom"
            $nomEpur = trim(str_replace(['Dr.', 'Dr '], '', $nomMedecin));
            // On sépare en mots pour chercher dans nom et prenom
            $mots = explode(' ', $nomEpur);
            
            $proQuery = Professionnel::whereHas('user', function($q) use ($mots) {
                foreach ($mots as $mot) {
                    $q->where(function($subq) use ($mot) {
                        $subq->where('nom', 'like', "%$mot%")
                             ->orWhere('prenom', 'like', "%$mot%");
                    });
                }
            });
            $pro = $proQuery->first();

            if (!$pro) {
                return ['status' => 'error', 'message' => "Le professionnel '$nomMedecin' n'existe pas dans la base."];
            }
            $proId = $pro->id;

            // Extraire la date et l'heure
            $dt = \Carbon\Carbon::parse(str_replace('le', '', $datetimeStr));
            $plage = PlageHoraire::where('professionnel_id', $proId)
                ->whereDate('date', $dt->format('Y-m-d'))
                ->where('heure_debut', 'like', $dt->format('H:i') . '%')
                ->first();

            if (!$plage || $plage->statut !== 'disponible') {
                return ['status' => 'error', 'message' => "Le créneau demandé n'est pas disponible ou est invalide. Veuillez proposer une autre date parmi celles disponibles."];
            }
            $plageId = $plage->id;

            $service = Service::where('professionnel_id', $proId)->first();

            $rdv = RendezVous::create([
                'patient_id' => $patientId,
                'professionnel_id' => $proId,
                'plage_horaire_id' => $plageId,
                'date_heure' => $plage->date->format('Y-m-d') . ' ' . $plage->heure_debut,
                'service_id' => $service ? $service->id : null,
                'statut' => 'en_attente'
            ]);

            $plage->update(['statut' => 'reserve']);

            $notificationService = app(NotificationService::class);
            $pro = Professionnel::with('user', 'secretaires.user')->find($proId);
            $patient = Patient::with('user')->find($patientId);

            $titre = "Nouvelle demande de RDV (IA)";
            $message = "Le patient " . $patient->user->prenom . " " . $patient->user->nom . " a sollicité un rendez-vous via l'assistant médical IA pour le " . $plage->date->format('d/m/Y') . " à " . substr($plage->heure_debut, 0, 5) . ".";

            $notificationService->notifyProAndSecretary($pro, $titre, $message, $rdv->id, 'action_required');

            return [
                'status' => 'success',
                'appointment_id' => $rdv->id,
                'datetime' => $plage->date->format('Y-m-d') . ' ' . $plage->heure_debut,
                'message' => 'La demande de rendez-vous a été envoyée au médecin. Elle est actuellement en attente de validation.'
            ];
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Erreur réservation IA: ' . $e->getMessage());
            return ['status' => 'error', 'message' => "Erreur base de données lors de la réservation."];
        }
    }
}
