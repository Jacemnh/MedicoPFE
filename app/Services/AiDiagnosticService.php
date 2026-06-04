<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class AiDiagnosticService
{
    public function mapIcd10($args)
    {
        $term = $args['symptom_term'] ?? '';
        try {
            $response = Http::get('https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search', [
                'terms' => $term,
                'maxList' => 3
            ]);
            
            if ($response->successful()) {
                $data = $response->json();
                $codes = $data[1] ?? [];
                $descriptions = $data[3] ?? [];
                
                $results = [];
                foreach ($codes as $index => $code) {
                    $results[] = [
                        'code' => $code,
                        'description' => $descriptions[$index] ?? ''
                    ];
                }
                return ['found_codes' => $results];
            }
        } catch (\Exception $e) {
            return ['error' => 'API ICD-10 indisponible'];
        }
        return ['found_codes' => []];
    }

    public function calculateRisk($args)
    {
        // Logique simplifiée pour l'exemple, peut être enrichie
        $score = $args['risk_score'] ?? 1;
        $specialty = $args['recommended_specialty'] ?? 'Généraliste';
        
        return [
            'score' => $score,
            'severity' => $score > 8 ? 'Haute' : ($score > 4 ? 'Moyenne' : 'Basse'),
            'recommended_specialty' => $specialty,
            'advice' => $score > 10 ? "Consultez d'urgence." : "Prenez rendez-vous prochainement."
        ];
    }
}
