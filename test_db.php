<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Pending means status = 'pending' in App\Models\Professionnel or something similar
// Let's just check the last 3 uploaded
$pros = App\Models\Professionnel::whereNotNull('diplome_path')->orderBy('id', 'desc')->take(3)->get();
foreach($pros as $p) {
    echo "ID: " . $p->id . "\n";
    echo "Path: " . $p->diplome_path . "\n";
    $fullPath = storage_path('app/public/' . $p->diplome_path);
    if (file_exists($fullPath)) {
        echo "File EXISTS at: " . $fullPath . "\n";
    } else {
        echo "File MISSING at: " . $fullPath . "\n";
    }
    echo "------------------\n";
}
