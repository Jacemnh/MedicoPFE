<?php

namespace App\Services;

use App\Models\AdminActivityLog;
use Illuminate\Support\Facades\Auth;

class AdminActivityLogger
{
    /**
     * Log an admin action.
     *
     * @param string $action
     * @param string|null $entityType
     * @param int|null $entityId
     * @param array|null $details
     * @return AdminActivityLog|null
     */
    public static function log(string $action, ?string $entityType = null, ?int $entityId = null, ?array $details = null)
    {
        if (!Auth::check() || !Auth::user()->admin) {
            return null;
        }

        return AdminActivityLog::create([
            'admin_id' => Auth::user()->admin->id,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'details' => $details,
            'ip_address' => request()->ip(),
        ]);
    }
}
