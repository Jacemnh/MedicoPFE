<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Professionnel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PublicSearchController extends Controller
{
    /**
     * Rechercher des professionnels — accès public.
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->input('query'); // Nom, spécialité, établissement
        $location = $request->input('location'); // Ville ou position

        $pros = Professionnel::query()
            ->with(['user:id,nom,prenom,photo,sexe', 'specialite:id,nom', 'cabinet:id,ville,nom,adresse', 'services']);

        if ($query) {
            $pros->where(function ($q) use ($query) {
                // Recherche par nom d'utilisateur
                $q->whereHas('user', function ($qu) use ($query) {
                    $qu->where('nom', 'like', "%{$query}%")
                        ->orWhere('prenom', 'like', "%{$query}%");
                })
                    // Recherche par spécialité
                    ->orWhereHas('specialite', function ($qs) use ($query) {
                        $qs->where('nom', 'like', "%{$query}%");
                    })
                    // Recherche par nom de cabinet
                    ->orWhereHas('cabinet', function ($qc) use ($query) {
                        $qc->where('nom', 'like', "%{$query}%");
                    });
            });
        }

        if ($location) {
            $pros->whereHas('cabinet', function ($qc) use ($location) {
                $qc->where('ville', 'like', "%{$location}%")
                    ->orWhere('adresse', 'like', "%{$location}%");
            });
        }

        $today = \Carbon\Carbon::now()->startOfDay();
        $nextWeek = $today->copy()->addDays(6)->endOfDay();

        $results = $pros->get()->map(function ($pro) use ($today, $nextWeek) {
            // Vérifier si nous devons générer automatiquement des créneaux si c'est vide
            $slotsCount = \App\Models\PlageHoraire::where('professionnel_id', $pro->id)
                ->whereBetween('date', [$today->format('Y-m-d'), $nextWeek->format('Y-m-d')])
                ->count();

            if ($slotsCount === 0) {
                // Essayer de les générer en appelant la logique interne si possible, 
                // mais comme elle est privée dans PlageHoraireController, nous récupérons juste ce qui existe.
                // Dans une vraie application, nous extrairions la logique de génération dans une classe Service.
            }

            $slots = \App\Models\PlageHoraire::where('professionnel_id', $pro->id)
                ->whereBetween('date', [$today->format('Y-m-d'), $nextWeek->format('Y-m-d')])
                ->whereIn('statut', ['disponible', 'reserve'])
                ->orderBy('date')
                ->orderBy('heure_debut')
                ->get();

            $groupedSlots = [];
            for ($i = 0; $i < 7; $i++) {
                $dateStr = $today->copy()->addDays($i)->format('Y-m-d');
                $groupedSlots[$dateStr] = [];
            }

            foreach ($slots as $slot) {
                $groupedSlots[$slot->date->format('Y-m-d')][] = [
                    'id' => $slot->id,
                    'time' => substr($slot->heure_debut, 0, 5), // "HH:MM"
                    'statut' => $slot->statut
                ];
            }

            return [
                'id' => $pro->id,
                'nom' => $pro->user ? $pro->user->nom : '',
                'prenom' => $pro->user ? $pro->user->prenom : '',
                'specialite' => $pro->specialite ? $pro->specialite->nom : '',
                'ville' => $pro->cabinet ? $pro->cabinet->ville : '',
                'cabinet' => $pro->cabinet ? $pro->cabinet->nom : '',
                'adresse' => $pro->cabinet ? $pro->cabinet->adresse : '',
                'conventionne' => 'Conventionné',
                'photo' => $pro->user ? $pro->user->photo : null,
                'sexe' => $pro->user ? $pro->user->sexe : null,
                'services' => $pro->services->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'nom' => $s->nom,
                        'prix' => $s->prix
                    ];
                }),
                'prochaines_dispos' => $groupedSlots,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $results
        ]);
    }

    /**
     * Obtenir des suggestions basées sur la saisie
     */
    public function suggestions(Request $request): JsonResponse
    {
        $type = $request->input('type'); // 'query' ou 'location'
        $val = $request->input('val');

        if (!$val || strlen($val) < 1) {
            return response()->json([]);
        }

        if ($type === 'query') {
            // Suggestions pour le nom ou la spécialité
            $specialties = \App\Models\Specialite::where('nom', 'like', "%{$val}%")
                ->limit(5)
                ->get()
                ->map(fn($s) => ['type' => 'specialty', 'text' => $s->nom]);

            $doctors = \App\Models\User::where('role', 'professionnel')
                ->where(function ($q) use ($val) {
                    $q->where('nom', 'like', "%{$val}%")
                        ->orWhere('prenom', 'like', "%{$val}%");
                })
                ->limit(5)
                ->get()
                ->map(fn($u) => ['type' => 'doctor', 'text' => "Dr. {$u->nom} {$u->prenom}"]);

            return response()->json($specialties->merge($doctors));
        } else {
            // Suggestions pour le lieu (Villes/Établissements)
            $cities = \App\Models\Cabinet::where('ville', 'like', "%{$val}%")
                ->distinct()
                ->limit(5)
                ->get(['ville'])
                ->map(fn($c) => ['type' => 'city', 'text' => $c->ville]);

            $establishments = \App\Models\Cabinet::where('nom', 'like', "%{$val}%")
                ->limit(5)
                ->get()
                ->map(fn($c) => ['type' => 'establishment', 'text' => $c->nom]);

            return response()->json($cities->merge($establishments));
        }
    }
}
