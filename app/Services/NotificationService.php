<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Mail\PatientAppointmentActionMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Mettre à jour une notification
     */
    public function createNotification($userId, $type, $titre, $message, $actionType = null, $relatedId = null)
    {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'titre' => $titre,
            'message' => $message,
            'action_type' => $actionType,
            'related_id' => $relatedId,
            'read' => false,
        ]);
    }

    /**
     * Notifier le Professionnel (et ses secrétaires) - Notification In-App uniquement
     */
    public function notifyProAndSecretary($pro, $titre, $message, $relatedId = null, $type = 'info')
    {
        if (!$pro) return;

        // Notifier le médecin
        $this->createNotification(
            $pro->user_id,
            $type,
            $titre,
            $message,
            null,
            $relatedId
        );

        // Notifier toutes les secrétaires associées
        $secretaires = $pro->secretaires;
        if ($secretaires) {
            foreach ($secretaires as $secretaire) {
                // Assuming secretaire has user relation
                if ($secretaire->user) {
                    $this->createNotification(
                        $secretaire->user->id,
                        $type,
                        $titre,
                        $message,
                        null,
                        $relatedId
                    );
                }
            }
        }
    }

    /**
     * Notifier le Patient - Notification In-App ET Envoi d'Email
     */
    public function notifyPatient($userId, $titre, $message, $actionType = null, $relatedId = null)
    {
        $user = User::find($userId);
        if (!$user) return;

        // 1. In-App Notification
        $type = $actionType ? 'action_required' : 'info';
        
        $this->createNotification(
            $user->id,
            $type,
            $titre,
            $message,
            $actionType,
            $relatedId
        );

        // 2. Email Sending
        $actionUrl = null;
        $actionText = null;

        if ($actionType === 'reschedule_response') {
            // Lien vers le frontend pour voir le RDV
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            $actionUrl = $frontendUrl . '/patient/dashboard'; // Le patient verra la popup dans son app
            $actionText = 'Ouvrir mon tableau de bord';
        }

        try {
            Mail::to($user->email)->send(new PatientAppointmentActionMail(
                $titre,
                $message,
                $actionUrl,
                $actionText
            ));
        } catch (\Exception $e) {
            // Fallback: log the error if email fails (ex: SMTP not configured)
            Log::error("Erreur lors de l'envoi de l'email de notification: " . $e->getMessage());
        }
    }
}
