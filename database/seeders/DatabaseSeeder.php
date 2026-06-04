<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Specialites via our new Seeder
        $this->call(SpecialiteSeeder::class);

        // Get some reference specialities
        $specGen = \App\Models\Specialite::where('nom', 'Médecine générale')->first();

        // 2. Create Admin
        \App\Models\User::factory()->create([
            'nom' => 'System',
            'prenom' => 'Admin',
            'email' => 'admin@example.com',
            'role' => 'admin',
        ]);

        // 3. Create Cabinet
        $cabinet = \App\Models\Cabinet::create([
            'nom' => 'Cabinet Médical Central',
            'adresse' => '123 Rue de la Santé',
            'ville' => 'Casablanca',
            'telephone' => '0522000000',
            'email' => 'contact@cabinet.ma',
            'pays' => 'Maroc',
        ]);

        // 4. Create Professionnel
        $proUser = \App\Models\User::factory()->create([
            'nom' => 'House',
            'prenom' => 'Gregory',
            'email' => 'pro@example.com',
            'role' => 'professionnel',
        ]);

        $professionnel = \App\Models\Professionnel::create([
            'user_id' => $proUser->id,
            'cabinet_id' => $cabinet->id,
            'specialite_id' => $specGen->id,
            'code_professionnel' => 'MED-001X',
        ]);

        // 5. Create Secretaire (linked to the professionnel)
        $secUser = \App\Models\User::factory()->create([
            'nom' => 'Secretaire',
            'prenom' => 'Sophie',
            'email' => 'sec@example.com',
            'role' => 'secretaire',
        ]);
        \App\Models\Secretaire::create([
            'user_id' => $secUser->id,
            'professionnel_id' => $professionnel->id,
        ]);

        // 6. Create Patient
        $patUser = \App\Models\User::factory()->create([
            'nom' => 'Patient',
            'prenom' => 'Jean',
            'email' => 'patient@example.com',
            'role' => 'patient',
            'date_naissance' => '1990-01-01',
        ]);
        \App\Models\Patient::create([
            'user_id' => $patUser->id,
            'date_naissance' => '1990-01-01',
        ]);
    }
}
