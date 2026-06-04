<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Creneau;
use App\Models\PlageHoraire;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PlageHoraireController extends Controller
{
    /**
     * Obtenir et générer automatiquement les créneaux d'un professionnel pour une semaine spécifique.
     */
    public function index(Request $request)
    {
        $pro = $request->user()->professionnel;

        if (!$pro) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $request->validate([
            'date' => 'required|date' // Doit être un lundi
        ]);

        $dateStr = $request->date;
        $slots = $this->generateAndFetchWeek($pro->id, $dateStr);
        $slots->load(['rendezVous.patient.user']);

        return response()->json([
            'success' => true,
            'data' => $slots,
        ]);
    }

    /**
     * Mettre à jour un créneau (changer le statut à inactif ou changer la durée).
     */
    public function update(Request $request, $id)
    {
        $pro = $request->user()->professionnel;

        if (!$pro) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $plage = PlageHoraire::where('id', $id)->where('professionnel_id', $pro->id)->first();

        if (!$plage) {
            return response()->json(['error' => 'Créneau non trouvé'], 404);
        }

        if ($plage->statut === 'reserve' || $plage->statut === 'en_attente') {
            return response()->json(['error' => 'Impossible de modifier un créneau réservé ou en attente'], 400);
        }

        $validated = $request->validate([
            'statut' => 'sometimes|in:disponible,inactif',
            'heure_fin' => 'sometimes|date_format:H:i:s',
        ]);

        if (isset($validated['heure_fin'])) {
            $debut = Carbon::parse($plage->heure_debut);
            $newFin = Carbon::parse($validated['heure_fin']);
            if ($newFin->lte($debut)) {
                return response()->json(['error' => 'L\'heure de fin doit être supérieure à l\'heure de début'], 400);
            }
        }

        $oldFin = Carbon::parse($plage->getOriginal('heure_fin') ?? $plage->heure_fin);
        $plage->update($validated);

        if (isset($validated['heure_fin'])) {
            $newFin = Carbon::parse($validated['heure_fin']);
            $diffInMinutes = $oldFin->diffInMinutes($newFin, false);

            if ($diffInMinutes !== 0) {
                // Décaler les créneaux suivants le même jour
                $subsequentSlots = PlageHoraire::with('rendezVous')
                    ->where('date', $plage->date)
                    ->where('professionnel_id', $pro->id)
                    ->where('id', '!=', $plage->id)
                    ->where('heure_debut', '>=', $oldFin->format('H:i:s'))
                    ->orderBy('heure_debut')
                    ->get();

                foreach ($subsequentSlots as $nextSlot) {
                    $nextStart = Carbon::parse($nextSlot->heure_debut);
                    $nextEnd = Carbon::parse($nextSlot->heure_fin);

                    $nextSlot->heure_debut = $nextStart->addMinutes($diffInMinutes)->format('H:i:s');
                    $nextSlot->heure_fin = $nextEnd->addMinutes($diffInMinutes)->format('H:i:s');
                    $nextSlot->save();

                    // Mettre à jour également la date_heure de RendezVous liée si applicable
                    if ($nextSlot->rendezVous && in_array($nextSlot->rendezVous->statut, ['en_attente', 'confirme'])) {
                        $rdvDatetime = Carbon::parse($nextSlot->rendezVous->date_heure);
                        $nextSlot->rendezVous->date_heure = $rdvDatetime->addMinutes($diffInMinutes);
                        $nextSlot->rendezVous->save();
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Créneau mis à jour',
            'data' => $plage
        ]);
    }

    /**
     * Obtenir les créneaux disponibles pour un professionnel donné pour les patients.
     */
    public function patientIndex(Request $request, $proId)
    {
        $request->validate([
            'date' => 'required|date' // Un lundi pour définir la semaine
        ]);

        $dateStr = $request->date;

        // Générer automatiquement s'ils n'existent pas, pour que le patient puisse les voir même si le pro n'a pas visité son tableau de bord
        $this->generateAndFetchWeek($proId, $dateStr);

        $monday = Carbon::parse($dateStr)->startOfDay();
        $sunday = $monday->copy()->addDays(6)->endOfDay();

        $slots = PlageHoraire::where('professionnel_id', $proId)
            ->whereBetween('date', [$monday->format('Y-m-d'), $sunday->format('Y-m-d')])
            ->whereIn('statut', ['disponible', 'reserve'])
            ->orderBy('date')
            ->orderBy('heure_debut')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $slots,
        ]);
    }

    /**
     * Logique principale pour générer ou récupérer les créneaux d'une semaine.
     */
    private function generateAndFetchWeek($proId, $mondayStr)
    {
        $monday = Carbon::parse($mondayStr)->startOfDay();
        $sunday = $monday->copy()->addDays(6)->endOfDay();

        $count = PlageHoraire::where('professionnel_id', $proId)
            ->whereBetween('date', [$monday->format('Y-m-d'), $sunday->format('Y-m-d')])
            ->count();

        // S'il n'y a pas du tout de créneaux pour cette semaine, essayer de les générer avec la configuration la plus proche
        if ($count === 0) {
            $creneau = Creneau::where('professionnel_id', $proId)
                ->where('date', '<=', $monday->format('Y-m-d'))
                ->orderByDesc('date')
                ->first();

            // S'il n'y a pas de configuration passée, vérifier s'il y a la moindre configuration
            if (!$creneau) {
                $creneau = Creneau::where('professionnel_id', $proId)->orderBy('date')->first();
            }

            if ($creneau) {
                $this->regenerateWeek($proId, $mondayStr, $creneau);
            }
        }

        // Récupérer et retourner les créneaux nouvellement générés (ou existants)
        return PlageHoraire::with(['rendezVous.patient.user'])
            ->where('professionnel_id', $proId)
            ->whereBetween('date', [$monday->format('Y-m-d'), $sunday->format('Y-m-d')])
            ->orderBy('date')
            ->orderBy('heure_debut')
            ->get();
    }

    /**
     * Forcer la régénération d'une semaine basée sur une configuration de Créneau donnée.
     */
    public function regenerateWeek($proId, $mondayStr, $creneau)
    {
        $monday = Carbon::parse($mondayStr)->startOfDay();
        $sunday = $monday->copy()->addDays(6)->endOfDay();

        // 1. Supprimer tous les créneaux non réservés pour cette semaine
        PlageHoraire::where('professionnel_id', $proId)
            ->whereBetween('date', [$monday->format('Y-m-d'), $sunday->format('Y-m-d')])
            ->whereNotIn('statut', ['reserve', 'en_attente'])
            ->delete();

        // 2. Récupérer les créneaux réservés existants pour éviter les chevauchements
        $reservedSlots = PlageHoraire::where('professionnel_id', $proId)
            ->whereBetween('date', [$monday->format('Y-m-d'), $sunday->format('Y-m-d')])
            ->whereIn('statut', ['reserve', 'en_attente'])
            ->get();

        $horaires = $creneau->horaires_travail;
        $duree = $creneau->duree_consultation_defaut;

        $jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        $newSlots = [];

        for ($i = 0; $i < 7; $i++) {
            $jourStr = $jours[$i];
            $currentDate = $monday->copy()->addDays($i);
            $dateStr = $currentDate->format('Y-m-d');

            if (isset($horaires[$jourStr]) && ($horaires[$jourStr]['actif'] ?? false)) {
                $periods = ['matin', 'apresmidi'];
                foreach ($periods as $period) {
                    if (isset($horaires[$jourStr][$period])) {
                        $debut = $horaires[$jourStr][$period]['debut'];
                        $fin = $horaires[$jourStr][$period]['fin'];

                        if ($debut && $fin) {
                            $start = Carbon::parse($dateStr . ' ' . $debut);
                            $end = Carbon::parse($dateStr . ' ' . $fin);

                            while ($start->copy()->addMinutes($duree)->lte($end)) {
                                $slotStart = $start->format('H:i:s');
                                $slotEnd = $start->copy()->addMinutes($duree)->format('H:i:s');

                                // Check overlap
                                $overlap = false;
                                foreach ($reservedSlots as $rs) {
                                    if ($rs->date->format('Y-m-d') === $dateStr) {
                                        // $rs->heure_debut est une chaîne "HH:MM:SS" de la BD
                                        // Attendez, $rs->heure_debut est casté en chaîne ou Carbon ? C'est une colonne de temps, donc généralement "HH:MM:SS"
                                        $rsStart = substr((string) $rs->heure_debut, 0, 8);
                                        $rsEnd = substr((string) $rs->heure_fin, 0, 8);

                                        if ($slotStart < $rsEnd && $slotEnd > $rsStart) {
                                            $overlap = true;
                                            break;
                                        }
                                    }
                                }

                                if (!$overlap) {
                                    $newSlots[] = [
                                        'professionnel_id' => $proId,
                                        'date' => $dateStr,
                                        'heure_debut' => $slotStart,
                                        'heure_fin' => $slotEnd,
                                        'statut' => 'disponible',
                                        'created_at' => now(),
                                        'updated_at' => now(),
                                    ];
                                }

                                $start->addMinutes($duree);
                            }
                        }
                    }
                }
            }
        }

        if (!empty($newSlots)) {
            PlageHoraire::insert($newSlots);
        }
    }
}
