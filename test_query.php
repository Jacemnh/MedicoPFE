<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$specialtyStr = 'Généraliste';

echo "--- LISTE DES SPECIALITES EN BASE ---\n";
$specialties = \App\Models\Specialite::all();
foreach($specialties as $s) {
    echo "- " . $s->nom . " (ID: " . $s->id . ")\n";
}

echo "\n--- TEST REQUETE PROFESSIONNEL PAR SPECIALITE ---\n";
$doctors = \App\Models\Professionnel::with(['user', 'specialite'])
->whereHas('specialite', function($q) use ($specialtyStr) {
    $q->where('nom', 'like', "%{$specialtyStr}%");
})->get();

echo "Nombre de docs trouves avec 'like %$specialtyStr%': " . count($doctors) . "\n";
foreach($doctors as $d) {
    echo "- Dr. " . $d->user->nom . " (Specialite: " . $d->specialite->nom . ")\n";
    
    $availableSlots = \App\Models\PlageHoraire::where('professionnel_id', $d->id)
        ->where('statut', 'disponible')
        ->where('date', '>=', now()->format('Y-m-d'))
        ->count();
    echo "  Nombre de plages disponibles: $availableSlots\n";
}


