<?php

use App\Http\Controllers\Api\ApiAuthController;
use App\Http\Controllers\Api\NotificationController;
use Illuminate\Support\Facades\Route;

// Routes publiques d'authentification
Route::post('/login', [ApiAuthController::class, 'login']);
Route::post('/register', [ApiAuthController::class, 'register']);
Route::post('/forgot-password', [\App\Http\Controllers\Api\PasswordResetController::class, 'sendResetLinkEmail']);
Route::post('/reset-password', [\App\Http\Controllers\Api\PasswordResetController::class, 'reset']);

// Données publiques pour la recherche/l'inscription
Route::get('/cabinets', [ApiAuthController::class, 'cabinets']);
Route::get('/specialites', [ApiAuthController::class, 'specialites']);
Route::get('/professionnels/search', [\App\Http\Controllers\Api\PublicSearchController::class, 'search']);
Route::get('/professionnels/suggestions', [\App\Http\Controllers\Api\PublicSearchController::class, 'suggestions']);
Route::post('/verify-professional-code', [ApiAuthController::class, 'verifyProfessionalCode']);
Route::get('/user', [ApiAuthController::class, 'user']);
Route::post('/contact', [\App\Http\Controllers\Api\ContactController::class, 'sendContactMessage']);

// Routes protégées (nécessitent l'authentification de session)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [ApiAuthController::class, 'logout']);

    // Profil générique (tous les rôles)
    Route::get('/profile', [\App\Http\Controllers\Api\UserProfileController::class, 'show']);
    Route::post('/profile', [\App\Http\Controllers\Api\UserProfileController::class, 'update']);
    Route::post('/profile/link-professional', [\App\Http\Controllers\Api\UserProfileController::class, 'linkProfessional']);

    // Notifications (tous les rôles)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/{id}/respond', [NotificationController::class, 'respondToReschedule']);

    // Plages horaires (Accès patient/public avec authentification)
    Route::get('/plages-horaires/{pro_id}', [\App\Http\Controllers\Api\PlageHoraireController::class, 'patientIndex']);

    // Routes des patients
    Route::prefix('patient')->group(function () {
        Route::get('/check-payment-status', [\App\Http\Controllers\Api\PatientBookingController::class, 'checkPaymentStatus']);
        Route::get('/dashboard', [\App\Http\Controllers\Api\PatientDashboardController::class, 'index']);
        Route::get('/professionnels', [\App\Http\Controllers\Api\PatientBookingController::class, 'getProfessionnels']);
        Route::get('/rendez-vous', [\App\Http\Controllers\Api\PatientBookingController::class, 'index']);
        Route::post('/rendez-vous', [\App\Http\Controllers\Api\PatientBookingController::class, 'store']);
        Route::put('/rendez-vous/{id}/cancel', [\App\Http\Controllers\Api\PatientBookingController::class, 'cancel']);
        Route::put('/rendez-vous/{id}/reschedule', [\App\Http\Controllers\Api\PatientBookingController::class, 'reschedule']);
        
        // Dossier Médical
        Route::get('/dossier', [\App\Http\Controllers\Api\PatientDossierController::class, 'show']);
        Route::put('/dossier', [\App\Http\Controllers\Api\PatientDossierController::class, 'update']);
        Route::get('/dossier/download', [\App\Http\Controllers\Api\PatientDossierController::class, 'download']);
        Route::get('/consultation/{id}/ordonnance/download', [\App\Http\Controllers\Api\PatientDossierController::class, 'downloadOrdonnance']);

        // AI Agent
        Route::get('/ai-agent/session', [\App\Http\Controllers\Api\AiAgentController::class, 'getSession']);
        Route::post('/ai-agent/message', [\App\Http\Controllers\Api\AiAgentController::class, 'sendMessage']);
        Route::delete('/ai-agent/session', [\App\Http\Controllers\Api\AiAgentController::class, 'clearSession']);

        // Paiements
        Route::get('/paiements', [\App\Http\Controllers\Api\PaymentController::class, 'index']);
        Route::get('/paiements/export', [\App\Http\Controllers\Api\PaymentController::class, 'exportReport']);
        Route::post('/paiements/{id}/checkout', [\App\Http\Controllers\Api\PaymentController::class, 'createCheckoutSession']);
        Route::post('/paiements/{id}/verify', [\App\Http\Controllers\Api\PaymentController::class, 'verifyPayment']);
        Route::get('/paiements/{id}/invoice', [\App\Http\Controllers\Api\PaymentController::class, 'downloadInvoice']);
    });


    // Routes du tableau de bord professionnel
    Route::prefix('pro')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Api\DashboardController::class, 'index']);
        Route::get('/finances', [\App\Http\Controllers\Api\ProFinanceController::class, 'index']);
        Route::get('/finances/export', [\App\Http\Controllers\Api\ProFinanceController::class, 'exportReport']);
        Route::get('/finances/{id}/invoice', [\App\Http\Controllers\Api\ProFinanceController::class, 'downloadInvoice']);

        Route::get('/profile', [\App\Http\Controllers\Api\ProfileController::class, 'show']);
        Route::post('/profile', [\App\Http\Controllers\Api\ProfileController::class, 'update']);
        Route::post('/profile/send-code', [\App\Http\Controllers\Api\ProfileController::class, 'sendCode']);

        Route::apiResource('/services', \App\Http\Controllers\Api\ServiceController::class);

        Route::get('/creneaux', [\App\Http\Controllers\Api\ScheduleController::class, 'index']);
        Route::post('/creneaux', [\App\Http\Controllers\Api\ScheduleController::class, 'store']);
        Route::delete('/creneaux/{id}', [\App\Http\Controllers\Api\ScheduleController::class, 'destroy']);

        Route::get('/plages-horaires', [\App\Http\Controllers\Api\PlageHoraireController::class, 'index']);
        Route::put('/plages-horaires/{id}', [\App\Http\Controllers\Api\PlageHoraireController::class, 'update']);

        Route::get('/consultations', [\App\Http\Controllers\Api\RendezVousController::class, 'index']);
        Route::put('/consultations/{id}/status', [\App\Http\Controllers\Api\RendezVousController::class, 'updateStatus']);
        Route::post('/consultations/{id}/notes', [\App\Http\Controllers\Api\RendezVousController::class, 'saveNotes']);
        Route::put('/consultations/{id}/reschedule', [\App\Http\Controllers\Api\RendezVousController::class, 'reschedule']);
        Route::get('/patients', [\App\Http\Controllers\Api\PatientsController::class, 'index']);
        Route::get('/patients/{id}/dossier-complet', [\App\Http\Controllers\Api\PatientsController::class, 'getDossierComplet']);
        Route::get('/secretaires', [\App\Http\Controllers\Api\ProSecretaireController::class, 'index']);
        Route::delete('/secretaires/{id}', [\App\Http\Controllers\Api\ProSecretaireController::class, 'destroy']);

        // Abonnements
        Route::post('/subscribe', [\App\Http\Controllers\Api\ProSubscriptionController::class, 'createCheckoutSession']);
        Route::post('/subscribe/verify', [\App\Http\Controllers\Api\ProSubscriptionController::class, 'verifySubscription']);
        Route::get('/subscription/status', [\App\Http\Controllers\Api\ProSubscriptionController::class, 'getStatus']);
        Route::get('/subscription/invoice/{id}', [\App\Http\Controllers\Api\ProSubscriptionController::class, 'downloadInvoice']);
    });

    // Routes des secrétaires
    Route::prefix('secretaire')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Api\SecretaireController::class, 'dashboard']);
        Route::get('/rendez-vous', [\App\Http\Controllers\Api\SecretaireController::class, 'appointments']);
        Route::get('/patients', [\App\Http\Controllers\Api\SecretaireController::class, 'patients']);
        Route::put('/rendez-vous/{id}/status', [\App\Http\Controllers\Api\RendezVousController::class, 'updateStatus']);

        // Gestion du cabinet
        Route::get('/cabinet', [\App\Http\Controllers\Api\CabinetController::class, 'show']);
        Route::put('/cabinet', [\App\Http\Controllers\Api\CabinetController::class, 'update']);
    });

    // Routes de l'administrateur
    Route::prefix('admin')->group(function () {
        Route::get('/activity-logs', [\App\Http\Controllers\Api\AdminActivityLogController::class, 'index']);
        
        Route::get('/summary', [\App\Http\Controllers\Api\AdminStatsController::class, 'getSummary']);
        Route::get('/stats/patients', [\App\Http\Controllers\Api\AdminStatsController::class, 'getPatientStats']);
        Route::get('/stats/pros', [\App\Http\Controllers\Api\AdminStatsController::class, 'getProStats']);
        Route::get('/stats/secretaries', [\App\Http\Controllers\Api\AdminStatsController::class, 'getSecretaryStats']);
        Route::get('/stats/finances', [\App\Http\Controllers\Api\AdminStatsController::class, 'getFinanceStats']);

        // Routes de gestion
        Route::get('/patients', [\App\Http\Controllers\Api\AdminPatientManagementController::class, 'index']);
        Route::put('/patients/{id}/toggle-block', [\App\Http\Controllers\Api\AdminPatientManagementController::class, 'toggleBlock']);
        Route::delete('/patients/{id}', [\App\Http\Controllers\Api\AdminPatientManagementController::class, 'destroy']);
        
        Route::get('/professionals', [\App\Http\Controllers\Api\AdminProfessionalManagementController::class, 'index']);
        Route::put('/professionals/{id}/toggle-block', [\App\Http\Controllers\Api\AdminProfessionalManagementController::class, 'toggleBlock']);
        Route::delete('/professionals/{id}', [\App\Http\Controllers\Api\AdminProfessionalManagementController::class, 'destroy']);
        
        // Validation des professionnels
        Route::get('/professionals/pending', [\App\Http\Controllers\Api\AdminProfessionalValidationController::class, 'getPending']);
        Route::post('/professionals/{id}/accept', [\App\Http\Controllers\Api\AdminProfessionalValidationController::class, 'accept']);
        Route::post('/professionals/{id}/reject', [\App\Http\Controllers\Api\AdminProfessionalValidationController::class, 'reject']);
        
        Route::get('/secretaries', [\App\Http\Controllers\Api\AdminSecretaryManagementController::class, 'index']);
        Route::put('/secretaries/{id}/toggle-block', [\App\Http\Controllers\Api\AdminSecretaryManagementController::class, 'toggleBlock']);
        Route::delete('/secretaries/{id}', [\App\Http\Controllers\Api\AdminSecretaryManagementController::class, 'destroy']);
        
        // Abonnements
        Route::apiResource('/subscriptions', \App\Http\Controllers\Api\AdminSubscriptionController::class);
        Route::put('/subscriptions/{id}/toggle-active', [\App\Http\Controllers\Api\AdminSubscriptionController::class, 'toggleActive']);
    });
});
