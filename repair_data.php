<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Consultation;
use App\Models\Ordonnance;

$consultations = Consultation::all();
$count = 0;

foreach ($consultations as $c) {
    echo "Processing Consultation ID: {$c->id}...\n";
    $rdv = $c->rendezVous;
    if ($rdv) {
        $c->patient_id = $rdv->patient_id;
        $c->professionnel_id = $rdv->professionnel_id;

        // Try to find an ordonnance linked to this consultation
        $ord = Ordonnance::where('consultation_id', $c->id)->first();
        if ($ord) {
            $c->ordonnance_id = $ord->id;
        }

        $c->save();
        $count++;
        echo " - Updated Patient: {$c->patient_id}, Pro: {$c->professionnel_id}\n";
    } else {
        echo " - No linked RendezVous found.\n";
    }
}

echo "Total updated: $count\n";
