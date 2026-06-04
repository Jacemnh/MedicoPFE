<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\RendezVous;
use App\Models\PlageHoraire;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Récupérer toutes les notifications de l'utilisateur authentifié
     */
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications
        ]);
    }

    /**
     * Marquer une notification comme lue
     */
    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($notification) {
            $notification->update(['read' => true]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    public function markAllAsRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->where('read', false)
            ->update(['read' => true]);

        return response()->json(['success' => true]);
    }

    /**
     * Répondre à une notification d'action (ex: reprogrammation)
     */
    public function respondToReschedule(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:accept,refuse'
        ]);

        $notification = Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->where('action_type', 'reschedule_response')
            ->first();

        if (!$notification) {
            return response()->json(['success' => false, 'message' => 'Notification introuvable ou non applicable'], 404);
        }

        $rdv = RendezVous::find($notification->related_id);
        if (!$rdv) {
            return response()->json(['success' => false, 'message' => 'Rendez-vous introuvable'], 404);
        }

        $patientName = $rdv->patient->user->prenom . ' ' . $rdv->patient->user->nom;
        $dt = \Carbon\Carbon::parse($rdv->date_heure);
        $dateStr = $dt->format('d/m/Y à H:i');

        if ($request->status === 'accept') {
            $rdv->update([
                'statut' => 'confirme',
                'reprogrammed' => false
            ]);
            
            app(NotificationService::class)->notifyProAndSecretary(
                $rdv->professionnel,
                'Reprogrammation acceptée',
                "Le patient {$patientName} a accepté la nouvelle proposition de rendez-vous pour le {$dateStr}.",
                $rdv->id,
                'success'
            );
        } else {
            $rdv->update([
                'statut' => 'annule',
                'reprogrammed' => false
            ]);
            if ($rdv->plage_horaire_id) {
                PlageHoraire::where('id', $rdv->plage_horaire_id)->update(['statut' => 'disponible']);
            }

            app(NotificationService::class)->notifyProAndSecretary(
                $rdv->professionnel,
                'Reprogrammation refusée',
                "Le patient {$patientName} a refusé la reprogrammation de son rendez-vous pour le {$dateStr}.",
                $rdv->id,
                'warning'
            );
        }

        // Mettre à jour la notification pour ne plus demander d'action
        $notification->update([
            'read' => true,
            'type' => 'info',
            'action_type' => null
        ]);

        return response()->json(['success' => true, 'message' => 'Réponse enregistrée avec succès.']);
    }
}
