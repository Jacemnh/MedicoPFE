<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\AccountDeletedMail;
use App\Services\AdminActivityLogger;

class AdminPatientManagementController extends Controller
{
    /**
     * Obtenir tous les patients pour l'administrateur.
     */
    public function index()
    {
        $patients = User::where('role', 'patient')
            ->with(['patient.dossierMedical'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $patients
        ]);
    }

    /**
     * Bloquer ou débloquer un compte patient.
     */
    public function toggleBlock(Request $request, $id)
    {
        $user = User::where('role', 'patient')->find($id);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Patient non trouvé'], 404);
        }

        $user->is_blocked = !$user->is_blocked;
        $user->save();

        AdminActivityLogger::log(
            $user->is_blocked ? 'blocked' : 'unblocked',
            User::class,
            $user->id,
            ['role' => 'patient']
        );

        return response()->json([
            'success' => true,
            'message' => 'Statut du patient mis à jour avec succès',
            'data' => $user
        ]);
    }

    /**
     * Supprimer un compte patient.
     */
    public function destroy($id)
    {
        $user = User::where('role', 'patient')->find($id);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Patient non trouvé'], 404);
        }

        // La suppression en cascade du modèle utilisateur devrait s'occuper des modèles Patient liés si les clés étrangères de la BD sont configurées avec la suppression en cascade.
        // Sinon, nous supprimons manuellement. Supprimons également manuellement le modèle patient au cas où.
        if ($user->patient) {
            $user->patient->delete();
        }

        // Envoyer l'email de notification avant la suppression
        Mail::to($user->email)->send(new AccountDeletedMail($user->prenom . ' ' . $user->nom));
        
        AdminActivityLogger::log('deleted', User::class, $user->id, ['role' => 'patient', 'name' => $user->prenom . ' ' . $user->nom]);

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Patient supprimé avec succès'
        ]);
    }
}
