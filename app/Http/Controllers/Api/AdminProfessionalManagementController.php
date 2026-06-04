<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Professionnel;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\AccountDeletedMail;
use App\Services\AdminActivityLogger;

class AdminProfessionalManagementController extends Controller
{
    /**
     * Obtenir tous les professionnels de santé pour l'administrateur.
     */
    public function index()
    {
        $professionals = User::where('role', 'professionnel')
            ->with(['professionnel.specialite', 'professionnel.cabinet'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $professionals
        ]);
    }

    /**
     * Bloquer ou débloquer un compte professionnel.
     */
    public function toggleBlock(Request $request, $id)
    {
        $user = User::where('role', 'professionnel')->find($id);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Professionnel non trouvé'], 404);
        }

        $user->is_blocked = !$user->is_blocked;
        $user->save();

        AdminActivityLogger::log(
            $user->is_blocked ? 'blocked' : 'unblocked',
            User::class,
            $user->id,
            ['role' => 'professionnel']
        );

        return response()->json([
            'success' => true,
            'message' => 'Statut du professionnel mis à jour avec succès',
            'data' => $user
        ]);
    }

    /**
     * Supprimer un compte professionnel.
     */
    public function destroy($id)
    {
        $user = User::where('role', 'professionnel')->find($id);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Professionnel non trouvé'], 404);
        }

        if ($user->professionnel) {
            $user->professionnel->delete();
        }

        // Envoyer l'email de notification avant la suppression
        Mail::to($user->email)->send(new AccountDeletedMail($user->prenom . ' ' . $user->nom));
        
        AdminActivityLogger::log('deleted', User::class, $user->id, ['role' => 'professionnel', 'name' => $user->prenom . ' ' . $user->nom]);

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Professionnel supprimé avec succès'
        ]);
    }
}
