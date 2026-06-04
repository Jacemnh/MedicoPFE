<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DossierMedical;
use Illuminate\Http\Request;

class PatientDossierController extends Controller
{
    /**
     * Récupérer le dossier médical du patient avec consultations et documents
     */
    public function show(Request $request)
    {
        $user = $request->user();
        $patient = $user->patient;

        if (!$patient) {
            return response()->json(['success' => false, 'message' => 'Profil patient non trouvé.'], 403);
        }

        // Obtenir ou créer le dossier médical
        $dossier = $patient->dossierMedical;
        
        if (!$dossier) {
            $dossier = DossierMedical::create([
                'patient_id' => $patient->id,
            ]);
        }

        // Charger les relations (consultations + documents + médecin ayant fait la consultation)
        $dossier->load([
            'consultations.professionnel.user', 
            'consultations.professionnel.specialite',
            'consultations.ordonnance',
            'consultations.rendezVous.paiement',
            'documents'
        ]);


        return response()->json([
            'success' => true,
            'data' => $dossier,
        ]);
    }

    /**
     * Mettre à jour les informations de santé
     */
    public function update(Request $request)
    {
        $user = $request->user();
        $patient = $user->patient;

        if (!$patient) {
            return response()->json(['success' => false, 'message' => 'Profil patient non trouvé.'], 403);
        }

        $dossier = $patient->dossierMedical;
        if (!$dossier) {
            $dossier = DossierMedical::create([
                'patient_id' => $patient->id,
            ]);
        }

        $validated = $request->validate([
            'groupe_sanguin' => 'nullable|string|max:10',
            'allergies' => 'nullable|array',
            'poids' => 'nullable|numeric',
            'taille' => 'nullable|numeric',
            'maladies_chroniques' => 'nullable|string',
            'vaccinations' => 'nullable|array',
        ]);

        $dossier->update($validated);

        return response()->json([
            'success' => true,
            'data' => $dossier,
        ]);
    }

    /**
     * Télécharger le fichier de synthèse
     */
    public function download(Request $request)
    {
        $user = $request->user();
        $patient = $user->patient;

        if (!$patient) {
            return response()->json(['success' => false, 'message' => 'Profil patient non trouvé.'], 403);
        }

        $dossier = $patient->dossierMedical;
        if (!$dossier) {
            return response()->json(['success' => false, 'message' => 'Dossier introuvable.'], 404);
        }

        $html = "<div style=\"font-family: sans-serif; padding: 20px;\">";
        $html .= "<h1 style=\"color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;\">Dossier Médical de " . $user->prenom . " " . $user->nom . "</h1>";
        $html .= "<div style=\"margin-top: 20px;\">";
        $html .= "<p><strong>Groupe Sanguin :</strong> " . ($dossier->groupe_sanguin ?? 'Non renseigné') . "</p>";
        $html .= "<p><strong>Poids :</strong> " . ($dossier->poids ? $dossier->poids . ' kg' : 'Non renseigné') . "</p>";
        $html .= "<p><strong>Taille :</strong> " . ($dossier->taille ? $dossier->taille . ' cm' : 'Non renseignée') . "</p>";
        $html .= "<p><strong>Allergies :</strong> " . ($dossier->allergies ? implode(', ', $dossier->allergies) : 'Aucune renseignée') . "</p>";
        $html .= "<p><strong>Maladies chroniques :</strong> " . ($dossier->maladies_chroniques ?? 'Aucune renseignée') . "</p>";
        $html .= "</div>";
        
        $html .= "<h2 style=\"margin-top: 30px; color: #4b5563;\">Historique des vaccinations</h2><ul style=\"line-height: 1.6;\">";
        if ($dossier->vaccinations && count($dossier->vaccinations) > 0) {
            foreach ($dossier->vaccinations as $vaccin) {
                $html .= "<li>" . ($vaccin['name'] ?? 'Inconnu') . " (Le " . ($vaccin['date'] ?? '') . ")</li>";
            }
        } else {
            $html .= "<li>Aucun vaccin renseigné.</li>";
        }
        $html .= "</ul></div>";

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
        return $pdf->download('dossier_medical.pdf');
    }

    /**
     * Télécharger l'ordonnance de la consultation spécifique
     */
    public function downloadOrdonnance(Request $request, $id)
    {
        $user = $request->user();
        $patient = $user->patient;

        if (!$patient) {
            return response()->json(['success' => false, 'message' => 'Profil patient non trouvé.'], 403);
        }

        $consultation = \App\Models\Consultation::where('id', $id)
            ->where('patient_id', $patient->id)
            ->with(['professionnel.user', 'ordonnance'])
            ->first();

        if (!$consultation) {
            return response()->json(['success' => false, 'message' => 'Consultation introuvable.'], 404);
        }

        $ordonnance = $consultation->ordonnance;
        if (!$ordonnance) {
            return response()->json(['success' => false, 'message' => 'Aucune ordonnance pour cette consultation.'], 404);
        }

        $pro = $consultation->professionnel->user;
        $html = "<div style=\"font-family: sans-serif; padding: 20px; line-height: 1.5;\">";
        $html .= "<h1 style=\"color: #6366f1; text-align: center; letter-spacing: 2px;\">ORDONNANCE</h1>";
        $html .= "<hr style=\"border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;\">";
        $html .= "<div style=\"display: flex; justify-content: space-between;\">";
        $html .= "<div><p><strong>Médecin :</strong> Dr. " . $pro->nom . " " . $pro->prenom . "</p></div>";
        $html .= "<div><p><strong>Date :</strong> " . $ordonnance->created_at->format('d/m/Y') . "</p></div>";
        $html .= "</div>";
        $html .= "<p><strong>Patient :</strong> " . $user->nom . " " . $user->prenom . "</p>";
        $html .= "<hr style=\"border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;\">";
        $html .= "<h3 style=\"margin-top: 30px;\">MÉDICAMENTS PRESCRITS :</h3><ul style=\"font-size: 1.1em; padding-left: 20px;\">";
        
        $medicaments = $ordonnance->medicaments;
        if (is_array($medicaments)) {
            foreach ($medicaments as $med) {
                $html .= "<li style=\"margin-bottom: 10px;\"><strong>" . ($med['nom'] ?? $med) . "</strong> " . (!empty($med['posologie']) ? " - <em>" . $med['posologie'] . "</em>" : "") . "</li>";
            }
        } else {
            $html .= "<li>" . $medicaments . "</li>";
        }
        $html .= "</ul>";
        $html .= "<hr style=\"border: none; border-top: 1px solid #e5e7eb; margin-top: 40px;\">";
        $html .= "<p style=\"text-align: right; color: #9ca3af; font-size: 0.85em;\">Document généré le " . now()->format('d/m/Y H:i') . "</p></div>";

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
        return $pdf->download('ordonnance_' . $id . '.pdf');
    }
}

