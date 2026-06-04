<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\RendezVous;
use App\Models\PlageHoraire;
use App\Services\NotificationService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    $notificationService = app(NotificationService::class);
    $localNowStr = \Carbon\Carbon::now('Africa/Tunis')->format('Y-m-d H:i:s');

    RendezVous::where('date_heure', '<', $localNowStr)
        ->where('statut', 'en_attente')
        ->get()
        ->each(function ($rdv) use ($notificationService) {
            $rdv->update(['statut' => 'annule']);
            if ($rdv->plage_horaire_id) {
                PlageHoraire::where('id', $rdv->plage_horaire_id)
                    ->update(['statut' => 'disponible']);
            }
            
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
})->everyMinute();
