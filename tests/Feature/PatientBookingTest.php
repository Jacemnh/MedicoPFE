<?php

namespace Tests\Feature;

use App\Models\Patient;
use App\Models\Professionnel;
use App\Models\User;
use App\Models\PlageHoraire;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class PatientBookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_can_list_rendez_vous_without_timeout()
    {
        $user = User::factory()->create(['role' => 'patient']);
        $patient = Patient::create([
            'user_id' => $user->id,
            'num_carte_vitale' => '123456789012345',
            'date_naissance' => '1990-01-01'
        ]);

        $this->actingAs($user);

        $response = $this->getJson('/api/patient/rendez-vous');

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
    }

    public function test_patient_can_get_professionnels_efficiently()
    {
        $user = User::factory()->create(['role' => 'patient']);
        $patient = Patient::create(['user_id' => $user->id, 'num_carte_vitale' => '123', 'date_naissance' => '1990-01-01']);

        // Create a pro
        $proUser = User::factory()->create(['role' => 'professionnel']);
        $pro = Professionnel::create(['user_id' => $proUser->id]);

        // Create some slots
        PlageHoraire::create([
            'professionnel_id' => $pro->id,
            'date' => now()->format('Y-m-d'),
            'heure_debut' => '09:00:00',
            'heure_fin' => '09:30:00',
            'statut' => 'disponible'
        ]);

        $this->actingAs($user);

        $response = $this->getJson('/api/patient/professionnels');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'prochaines_dispos'
                ]
            ]
        ]);
    }
}
