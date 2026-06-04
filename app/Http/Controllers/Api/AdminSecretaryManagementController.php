<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\AccountDeletedMail;
use App\Services\AdminActivityLogger;

class AdminSecretaryManagementController extends Controller
{
    /**
     * Obtenir toutes les secrétaires pour l'administrateur.
     */
    public function index()
    {
        $secretaries = User::where('role', 'secretaire')
            ->with(['secretaire.professionnel.user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $secretaries
        ]);
    }

    /**
     * Bloquer ou débloquer un compte de secrétaire.
     */
    public function toggleBlock(Request $request, $id)
    {
        $user = User::where('role', 'secretaire')->find($id);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Secrétaire non trouvé(e)'], 404);
        }

        $user->is_blocked = !$user->is_blocked;
        $user->save();

        AdminActivityLogger::log(
            $user->is_blocked ? 'blocked' : 'unblocked',
            User::class,
            $user->id,
            ['role' => 'secretaire']
        );

        return response()->json([
            'success' => true,
            'message' => 'Statut de la secrétaire mis à jour avec succès',
            'data' => $user
        ]);
    }

    /**
     * Supprimer un compte de secrétaire.
     */
    public function destroy($id)
    {
        $user = User::where('role', 'secretaire')->find($id);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Secrétaire non trouvé(e)'], 404);
        }

        if ($user->secretaire) {
            $user->secretaire->delete();
        }

        // Envoyer l'email de notification avant la suppression
        Mail::to($user->email)->send(new AccountDeletedMail($user->prenom . ' ' . $user->nom));
        
        AdminActivityLogger::log('deleted', User::class, $user->id, ['role' => 'secretaire', 'name' => $user->prenom . ' ' . $user->nom]);

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Secrétaire supprimé(e) avec succès'
        ]);
    }
}
