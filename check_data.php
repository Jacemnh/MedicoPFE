<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Consultation;

$consultations = Consultation::orderBy('id', 'desc')->take(5)->get();

foreach ($consultations as $c) {
    echo "ID: {$c->id}, RDV: {$c->rendez_vous_id}, Patient: " . ($c->patient_id ?? 'NULL') . ", Pro: " . ($c->professionnel_id ?? 'NULL') . ", Ord: " . ($c->ordonnance_id ?? 'NULL') . "\n";
}
