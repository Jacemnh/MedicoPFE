<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AiSession;
use App\Services\AiServiceAgentMedical;

class AiAgentController extends Controller
{
    private $aiService;
    
    public function __construct(AiServiceAgentMedical $aiService)
    {
        $this->aiService = $aiService;
    }

    public function getSession(Request $request)
    {
        $patient = $request->user()->patient;
        if (!$patient) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        // Trouver la session active ou en créer une nouvelle
        $session = AiSession::where('patient_id', $patient->id)
            ->where('status', 'active')
            ->first();

        if (!$session) {
            $session = AiSession::create([
                'patient_id' => $patient->id,
                'status' => 'active'
            ]);
            
            // On peut optionnellement initier avec un message d'accueil
            $session->messages()->create([
                'role' => 'model',
                'content' => "Bonjour ! Je suis votre assistant médical IA. Comment puis-je vous aider aujourd'hui ? Pouvez-vous me décrire vos symptômes ?"
            ]);
        }

        // Charger les messages, exclure les appels de fonctions internes si on veut simplifier l'UI
        $messages = $session->messages()
            ->whereIn('role', ['user', 'model'])
            ->whereNotNull('content')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'session' => $session,
            'messages' => $messages
        ]);
    }

    public function sendMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string'
        ]);

        $patient = $request->user()->patient;
        if (!$patient) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $session = AiSession::where('patient_id', $patient->id)
            ->where('status', 'active')
            ->first();

        if (!$session) {
             return response()->json(['message' => 'Session expirée ou invalide.'], 400);
        }

        try {
            $result = $this->aiService->processMessage($session, $request->message);
            
            // Retourner les nouveaux messages pour mettre à jour l'UI
            $messages = $session->messages()
                ->whereIn('role', ['user', 'model'])
                ->whereNotNull('content')
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json([
                'session' => $session->refresh(),
                'messages' => $messages,
                'latest_result' => $result,
                'engine' => $this->aiService->lastUsedEngine
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('AiAgentController Exception: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            $msg = $e->getMessage();
            $friendlyMessage = "Une erreur de communication avec l'assistant est survenue. Veuillez réessayer plus tard.";
            
            if ($msg === 'BOTH_ENGINES_FAILED') {
                $friendlyMessage = "Le service IA principal (Gemini) et le modèle de secours (Qwen) sont tous deux indisponibles en ce moment. Veuillez réessayer dans quelques minutes ou contacter directement un médecin.";
            } elseif ($msg === 'QUOTA_EXCEEDED') {
                $friendlyMessage = "Mon système a atteint sa limite d'utilisation quotidienne. Je ne peux plus répondre pour aujourd'hui. Veuillez m'excuser et contacter un vrai médecin si besoin.";
            } elseif ($msg === 'SERVER_OVERLOADED') {
                $friendlyMessage = "Je suis actuellement victime de mon succès et mes serveurs sont surchargés ! Merci de patienter quelques minutes avant de me reparler.";
            }

            return response()->json([
                'status' => 'error',
                'error_message' => $friendlyMessage
            ], 503);
        }
    }

    public function clearSession(Request $request)
    {
        $patient = $request->user()->patient;
        if (!$patient) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        AiSession::where('patient_id', $patient->id)
            ->where('status', 'active')
            ->update(['status' => 'completed']);
            
        return response()->json(['message' => 'Session terminée.']);
    }
}
