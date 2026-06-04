<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

use App\Models\User;
use App\Models\Patient;
use App\Models\Secretaire;

$user = User::where('email', 'sana@gmail.com')->first();
if (!$user) {
    echo "User not found\n";
    exit;
}

$secretaire = $user->secretaire;
if (!$secretaire) {
    echo "Secretaire not found\n";
    exit;
}

$proId = $secretaire->professionnel_id;
echo "Pro ID: $proId\n";

try {
    $patients = Patient::with([
        'user',
        'dossierMedical',
        'consultations' => function ($q) use ($proId) {
            $q->where('professionnel_id', $proId)->with(['rendezVous.service', 'ordonnances', 'ordonnance']);
        }
    ])
        ->whereHas('rendezVous', function ($q) use ($proId) {
            $q->where('professionnel_id', $proId);
        })
        ->withCount([
            'rendezVous' => function ($q) use ($proId) {
                $q->where('professionnel_id', $proId);
            }
        ])
        ->get();
    echo "Success: Found " . count($patients) . " patients.\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
