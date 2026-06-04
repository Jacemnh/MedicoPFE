<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Professionnel;
use App\Mail\ProfessionalStatusMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Services\AdminActivityLogger;

class AdminProfessionalValidationController extends Controller
{
    /**
     * Trouvez des professionnels en attente.
     */
    public function getPending()
    {
        $pendingProfessionals = User::where('role', 'professionnel')
            ->whereHas('professionnel', function ($query) {
                $query->where('etat', 'en_attente');
            })
            ->with(['professionnel.specialite', 'professionnel.cabinet'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pendingProfessionals
        ]);
    }

    /**
     * Accept a professional.
     */
    public function accept(Request $request, $id)
    {
        $user = User::where('role', 'professionnel')->findOrFail($id);
        
        $professionnel = $user->professionnel;
        if ($professionnel) {
            $professionnel->etat = 'accepte';
            
            // Handle trial duration
            if ($request->has('trial_days') && is_numeric($request->trial_days) && $request->trial_days > 0) {
                $professionnel->trial_ends_at = now()->addDays((int) $request->trial_days)->toDateTimeString();
            }
            
            $professionnel->save();

            // Send acceptance email
            Mail::to($user->email)->send(new ProfessionalStatusMail($user, 'accepte'));

            AdminActivityLogger::log('accepted', User::class, $user->id, ['role' => 'professionnel']);

            return response()->json([
                'success' => true,
                'message' => 'Professionnel accepté avec succès.'
            ]);
        }

        return response()->json(['success' => false, 'message' => 'Profil professionnel non trouvé'], 404);
    }

    /**
     * Reject a professional.
     */
    public function reject($id)
    {
        $user = User::where('role', 'professionnel')->findOrFail($id);
        
        $professionnel = $user->professionnel;
        if ($professionnel) {
            // Send rejection email before deleting
            Mail::to($user->email)->send(new ProfessionalStatusMail($user, 'refuse'));

            // Delete the professional profile and the user account
            $professionnel->delete();
            
            AdminActivityLogger::log('rejected', User::class, $user->id, ['role' => 'professionnel', 'name' => $user->prenom . ' ' . $user->nom]);
            
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'Professionnel refusé et compte supprimé avec succès.'
            ]);
        }

        return response()->json(['success' => false, 'message' => 'Profil professionnel non trouvé'], 404);
    }
}
