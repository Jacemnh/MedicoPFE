<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminActivityLog;
use Illuminate\Http\Request;

class AdminActivityLogController extends Controller
{
    /**
     * Obtenir tous les journaux d'activité avec pagination.
     */
    public function index(Request $request)
    {
        $query = AdminActivityLog::with('admin.user:id,nom,prenom,email');

        // Filtrer par action si spécifié
        if ($request->has('action') && !empty($request->action)) {
            $query->where('action', $request->action);
        }

        // Filtrer par admin_id si spécifié
        if ($request->has('admin_id') && !empty($request->admin_id)) {
            $query->where('admin_id', $request->admin_id);
        }

        // Ordonner par les plus récents
        $logs = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }
}
