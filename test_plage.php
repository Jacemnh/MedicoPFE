<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\PlageHoraire;

$slots = PlageHoraire::with('rendezVous')->take(2)->get();
echo "Type of elements in collection:\n";
foreach ($slots as $slot) {
    echo get_class($slot) . "\n";
    if (isset($slot->rendezVous) && $slot->rendezVous) {
        echo "Type of rendezVous: " . get_class($slot->rendezVous) . "\n";
    }
}
