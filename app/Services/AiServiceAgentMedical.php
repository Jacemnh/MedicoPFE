<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\AiSession;
use App\Models\AiMessage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiServiceAgentMedical
{
    private $apiKey;
    private $model;
    private $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';

    private $ollamaUrl;
    private $ollamaModel;

    private $diagnosticService;
    private $rendezVousService;

    /**
     * Indicateur du moteur utilisé pour la dernière réponse.
     * 'gemini' ou 'ollama_qwen'
     */
    public $lastUsedEngine = 'gemini';

    public function __construct(AiDiagnosticService $diagnosticService, AiServiceRendezVous $rendezVousService)
    {
        $this->apiKey = env('GEMINI_API_KEY');
        $this->model = 'gemini-3-flash-preview';
        $this->diagnosticService = $diagnosticService;
        $this->rendezVousService = $rendezVousService;

        // Configuration Ollama (modèle local de fallback)
        $this->ollamaUrl = env('OLLAMA_URL', 'http://127.0.0.1:11434');
        $this->ollamaModel = env('OLLAMA_MODEL', 'qwen2.5:3b');
    }

    public function processMessage(AiSession $session, string $messageText)
    {
        $session->messages()->create([
            'role' => 'user',
            'content' => $messageText
        ]);

        // ── Tentative 1 : Gemini API ──
        try {
            $history = $this->buildHistory($session);
            $response = $this->callGemini($history);
            $this->lastUsedEngine = 'gemini';
            return $this->handleGeminiResponse($session, $response);
        } catch (\Exception $geminiException) {
            Log::warning('Gemini API indisponible, basculement vers Ollama/Qwen.', [
                'error' => $geminiException->getMessage()
            ]);
        }

        // ── Tentative 2 : Fallback Ollama / Qwen2.5:3B ──
        try {
            $this->lastUsedEngine = 'ollama_qwen';
            return $this->processWithOllama($session, $messageText);
        } catch (\Exception $ollamaException) {
            Log::error('Ollama fallback a aussi échoué.', [
                'error' => $ollamaException->getMessage()
            ]);
            throw new \Exception("BOTH_ENGINES_FAILED");
        }
    }

    // ================================================================
    //  GEMINI — Méthodes existantes
    // ================================================================

    private function buildHistory(AiSession $session)
    {
        $patient = $session->patient;
        $dossier = $patient->dossierMedical;

        $specialtiesList = \App\Models\Specialite::pluck('nom')->toArray();

        $systemInstructions = "Tu es un agent médical IA expert. Ton rôle est d'analyser les symptômes du patient, de déterminer le niveau de gravité (de 1 à 12 en interne, urgence absolue si > 10), et si nécessaire de trouver un médecin et de prendre rendez-vous.\n";
        $systemInstructions .= "La date et l'heure actuelles de la consultation sont : " . now()->format('Y-m-d H:i:s') . ". Ne propose jamais de créneaux ou de dates dans le passé.\n";
        $systemInstructions .= "Les spécialités médicales disponibles dans notre base de données et que tu dois recommander pour orienter les patients sont : " . implode(', ', $specialtiesList) . ".\n";
        $systemInstructions .= "Tu as accès à des outils (tools) pour accomplir ces tâches. Utilise-les quand c'est pertinent.\n\n";

        $systemInstructions .= "--- DOSSIER MEDICAL DU PATIENT ---\n";
        if ($dossier) {
            $systemInstructions .= "Allergies : " . ($dossier->allergies ? implode(', ', $dossier->allergies) : 'Aucune') . "\n";
            $systemInstructions .= "Maladies chroniques : " . ($dossier->maladies_chroniques ?? 'Aucune') . "\n";
            $systemInstructions .= "Groupe sanguin : " . ($dossier->groupe_sanguin ?? 'Inconnu') . "\n";
        } else {
            $systemInstructions .= "Nouveau patient, aucun antécédent connu.\n";
        }
        $systemInstructions .= "---------------------------------\n";
        $systemInstructions .= "IMPORTANT: Dans notre système, la spécialité pour un médecin généraliste s'appelle 'Médecine générale'. Ne cherche jamais 'Généraliste' mais 'générale'.\n";
        $systemInstructions .= "RÈGLES D'ORIENTATION CLINIQUE (À RESPECTER ABSOLUMENT) :\n";
        $systemInstructions .= "- Si les symptômes concernent les dents, les gencives, la bouche, ou la mastication (ex: douleur dentaire, sensibilité au chaud/froid sur une dent, abcès dentaire, douleur lors de la mastication), tu DOIS recommander la spécialité 'Dentiste'.\n";
        $systemInstructions .= "- Si les symptômes concernent la peau, des éruptions cutanées, des rougeurs, de l'acné, ou des grains de beauté, tu DOIS recommander la spécialité 'Dermatologie'.\n";
        $systemInstructions .= "- Si les symptômes concernent le cœur, la poitrine, des palpitations, ou des douleurs thoraciques, tu DOIS recommander la spécialité 'Cardiologie'.\n";
        $systemInstructions .= "- Si les symptômes concernent les yeux ou la vision, tu DOIS recommander la spécialité 'Ophtalmologie'.\n";
        $systemInstructions .= "- Si les symptômes concernent les oreilles, le nez ou la gorge, tu DOIS recommander la spécialité 'ORL'.\n";
        $systemInstructions .= "- Pour les autres cas généraux (fièvre, toux, fatigue générale, maux de ventre légers), recommande 'Médecine générale'.\n";
        $systemInstructions .= "CONSIGNES DE COMMUNICATION AVEC LE PATIENT :\n";
        $systemInstructions .= "1. Adopte un ton humain, professionnel, rassurant, empathique et très clair.\n";
        $systemInstructions .= "2. RÈGLE CRITIQUE DE SÉCURITÉ : Tu ne dois JAMAIS réserver un rendez-vous (appeler l'outil `book_appointment`) de ta propre initiative. Tu dois d'abord présenter la liste des médecins et créneaux disponibles, puis demander poliment au patient de confirmer le créneau souhaité. N'appelle l'outil `book_appointment` que si le patient a explicitement confirmé son accord pour réserver un créneau précis.\n";
        $systemInstructions .= "3. NE MENTIONNE JAMAIS les scores de gravité chiffrés (ex: 3/12) ni les codes médicaux techniques (comme l'ICD-10) dans tes réponses au patient.\n";
        $systemInstructions .= "4. Exprime le niveau de gravité en mots simples (ex: Léger, Modéré, Élevé, Urgence).\n";
        $systemInstructions .= "5. Structure ta réponse en utilisant CE FORMAT EXACT avec du gras (**texte**) pour les titres :\n\n";
        $systemInstructions .= "**Diagnostic estimé :**\n";
        $systemInstructions .= "[Ton explication simple et rassurante]\n\n";
        $systemInstructions .= "**Niveau de gravité :** [Léger/Modéré/Élevé/Urgence]\n\n";
        $systemInstructions .= "**Recommandations :**\n";
        $systemInstructions .= "- [Conseil 1]\n";
        $systemInstructions .= "- [Conseil 2]\n\n";
        $systemInstructions .= "**Médecins disponibles :**\n";
        $systemInstructions .= "[Liste si trouvés, sinon indique qu'il n'y en a pas]\n\n";
        $systemInstructions .= "5. Pour prendre rendez-vous, tu DOIS utiliser l'outil `book_appointment` avec le nom exact du médecin et la date/heure exacte du créneau que tu auras trouvé via l'outil `find_doctor`.\n";
        $systemInstructions .= "6. NE JAMAIS inventer de créneaux horaires. Tu ne peux proposer que les créneaux exacts (date et heure) retournés par la recherche de médecins.\n";
        $systemInstructions .= "7. NE PARLE JAMAIS d'outils, de fonctions informatiques ou d'actions techniques internes dans tes réponses au patient (par exemple, n'écris jamais 'Je vais maintenant utiliser l'outil book_appointment pour réserver ce créneau' ou 'Je vais appeler find_doctor'). Reste entièrement invisible techniquement et communique de façon naturelle et fluide avec le patient.\n";
        $systemInstructions .= "8. RÈGLES DE MISE EN FORME ET D'AFFICHAGE DU TEXTE :\n";
        $systemInstructions .= "   - Affiche TOUJOURS les titres de section en gras et sur une nouvelle ligne (ex: **Diagnostic estimé :**, **Niveau de gravité :**, **Recommandations :**, **Médecins disponibles :**).\n";
        $systemInstructions .= "   - Pour lister les médecins et leurs créneaux, utilise TOUROLE/TOUJOURS exactement ce format avec des retours à la ligne :\n";
        $systemInstructions .= "     - Dr. [Prénom Nom] ([Spécialité]) :\n";
        $systemInstructions .= "       * [Date au format AAAA-MM-JJ] à [Heure]\n";
        $systemInstructions .= "       * [Date au format AAAA-MM-JJ] à [Heure]\n";
        $systemInstructions .= "   - Pour confirmer un rendez-vous (après le retour de book_appointment) :\n";
        $systemInstructions .= "     **Rendez-vous réservé :**\n";
        $systemInstructions .= "     Votre demande de rendez-vous a bien été envoyée avec le Dr. [Nom] pour le [Date] à [Heure]. Elle est en attente de validation.\n";
        $systemInstructions .= "   - INTERDICTION d'écrire des listes de paramètres bruts comme '- Nom du médecin:' ou '- Date et heure:'. Rédige des phrases simples.\n";
        $systemInstructions .= "Ne modifie pas le dossier médical de force, contente-toi de le lire pour le contexte.";

        $dbMessages = $session->messages()->orderBy('created_at', 'asc')->get();
        $formattedContents = [];

        foreach ($dbMessages as $msg) {
            if ($msg->role === 'user') {
                $formattedContents[] = ['role' => 'user', 'parts' => [['text' => $msg->content]]];
            } else if ($msg->role === 'model') {
                // tool_calls peut être un array (cast Eloquent) ou un string JSON
                $toolCallsData = $msg->tool_calls;
                if (is_string($toolCallsData)) {
                    $toolCallsData = json_decode($toolCallsData, true);
                }

                if (is_array($toolCallsData) && !empty($toolCallsData) && isset($toolCallsData[0])) {
                    // Vérifier si c'est un tableau de parts complet (avec text/functionCall)
                    $firstItem = $toolCallsData[0];
                    if (isset($firstItem['text']) || isset($firstItem['functionCall']) || isset($firstItem['thought'])) {
                        $parts = $toolCallsData;
                    } else {
                        // C'est un tableau de function calls bruts
                        $parts = [];
                        if ($msg->content)
                            $parts[] = ['text' => $msg->content];
                        foreach ($toolCallsData as $call)
                            $parts[] = ['functionCall' => $call];
                    }
                } else {
                    $parts = [];
                    if ($msg->content)
                        $parts[] = ['text' => $msg->content];
                }
                $formattedContents[] = ['role' => 'model', 'parts' => $parts];
            } else if ($msg->role === 'function') {
                $toolCallsData = $msg->tool_calls;
                if (is_string($toolCallsData)) {
                    $toolCallsData = json_decode($toolCallsData, true);
                }
                $formattedContents[] = [
                    'role' => 'function',
                    'parts' => [
                        [
                            'functionResponse' => [
                                'name' => $msg->content,
                                'response' => $toolCallsData
                            ]
                        ]
                    ]
                ];
            }
        }

        return [
            'system_instruction' => [
                'parts' => [['text' => $systemInstructions]]
            ],
            'contents' => $formattedContents,
            'tools' => [
                ['function_declarations' => $this->getTools()]
            ]
        ];
    }

    private function getTools()
    {
        return [
            [
                'name' => 'map_icd10',
                'description' => "Trouve les codes ICD-10 correspondant aux symptômes décrits.",
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'symptom_term' => ['type' => 'STRING', 'description' => 'Terme de recherche (ex: fièvre, toux)']
                    ],
                    'required' => ['symptom_term']
                ]
            ],
            [
                'name' => 'calculate_risk',
                'description' => "Calcule le score de risque (1-12) en fonction des symptômes.",
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'risk_score' => ['type' => 'INTEGER', 'description' => 'Score de 1 à 12'],
                        'recommended_specialty' => ['type' => 'STRING', 'description' => 'Spécialité recommandée']
                    ],
                    'required' => ['risk_score', 'recommended_specialty']
                ]
            ],
            [
                'name' => 'find_doctor',
                'description' => "Recherche un médecin disponible selon une spécialité et optionnellement une date.",
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'specialty' => ['type' => 'STRING', 'description' => 'Spécialité'],
                        'date' => ['type' => 'STRING', 'description' => 'Date optionnelle (YYYY-MM-DD)']
                    ],
                    'required' => ['specialty']
                ]
            ],
            [
                'name' => 'book_appointment',
                'description' => "Réserve un créneau avec un médecin.",
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'nom_medecin' => ['type' => 'STRING', 'description' => 'Nom du médecin (ex: Dr. amen tahebt)'],
                        'datetime' => ['type' => 'STRING', 'description' => 'Date et heure exacte du créneau (ex: 2026-06-03 08:45:00)']
                    ],
                    'required' => ['nom_medecin', 'datetime']
                ]
            ],
            [
                'name' => 'diagnostic_complet',
                'description' => "Effectue un diagnostic complet en une seule étape: trouve les codes ICD-10, calcule le score de risque (1-12) et cherche des médecins disponibles.",
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'symptom_term' => ['type' => 'STRING', 'description' => 'Symptômes pour la recherche ICD-10'],
                        'risk_score' => ['type' => 'INTEGER', 'description' => 'Score calculé de 1 à 12'],
                        'recommended_specialty' => ['type' => 'STRING', 'description' => 'Spécialité recommandée'],
                        'date' => ['type' => 'STRING', 'description' => 'Date souhaitée (YYYY-MM-DD) optionnelle']
                    ],
                    'required' => ['symptom_term', 'risk_score', 'recommended_specialty']
                ]
            ]
        ];
    }

    private function callGemini($payload)
    {
        $url = $this->baseUrl . $this->model . ':generateContent?key=' . $this->apiKey;
        $response = Http::withHeaders(['Content-Type' => 'application/json'])->post($url, $payload);

        if ($response->failed()) {
            $status = $response->status();
            $body = $response->body();
            Log::error('Gemini API Error', ['status' => $status, 'response' => $body]);
            
            if ($status == 429) {
                throw new \Exception("QUOTA_EXCEEDED");
            } elseif ($status == 503) {
                throw new \Exception("SERVER_OVERLOADED");
            } elseif ($status == 401 || $status == 403) {
                throw new \Exception("TOKEN_EXPIRED");
            }
            throw new \Exception("API_ERROR_" . $status);
        }

        return $response->json();
    }

    private function handleGeminiResponse(AiSession $session, $response)
    {
        $candidate = $response['candidates'][0]['content'] ?? null;
        if (!$candidate)
            return ['error' => 'Pas de réponse'];

        $parts = $candidate['parts'] ?? [];
        $textContent = "";
        $functionCalls = [];

        foreach ($parts as $part) {
            if (isset($part['text']))
                $textContent .= $part['text'];
            if (isset($part['functionCall']))
                $functionCalls[] = $part['functionCall'];
        }

        $cleanedText = $this->cleanModelResponse($textContent);

        if (count($functionCalls) > 0) {
            $session->messages()->create([
                'role' => 'model',
                'content' => $cleanedText ?: null,
                'tool_calls' => json_encode($parts)
            ]);

            foreach ($functionCalls as $call) {
                $name = $call['name'];
                $args = $call['args'];
                $result = $this->executeTool($session, $name, $args);

                $session->messages()->create([
                    'role' => 'function',
                    'content' => $name,
                    'tool_calls' => json_encode($result)
                ]);
            }

            $newHistory = $this->buildHistory($session);
            $newResponse = $this->callGemini($newHistory);
            return $this->handleGeminiResponse($session, $newResponse);
        } else {
            // Guardrail: Vérifier si le modèle confirme un rendez-vous sans avoir appelé l'outil
            $hasBookingWords = (stripos($cleanedText, 'rendez-vous') !== false) && 
                                (stripos($cleanedText, 'confirmé') !== false || 
                                 stripos($cleanedText, 'réservé') !== false || 
                                 stripos($cleanedText, 'bien été envoyée') !== false ||
                                 stripos($cleanedText, 'a bien été enregistré') !== false);

            $lastUserMsg = $session->messages()->where('role', 'user')->orderBy('id', 'desc')->first();
            if ($lastUserMsg) {
                $bookingExecutedInThisTurn = $session->messages()
                    ->where('id', '>', $lastUserMsg->id)
                    ->where('role', 'function')
                    ->where('content', 'book_appointment')
                    ->exists();

                if ($hasBookingWords && !$bookingExecutedInThisTurn) {
                    $session->messages()->create([
                        'role' => 'model',
                        'content' => $cleanedText,
                        'tool_calls' => json_encode($parts)
                    ]);

                    $session->messages()->create([
                        'role' => 'user',
                        'content' => "Système : Tu as indiqué que le rendez-vous était réservé ou confirmé, mais tu n'as pas exécuté l'outil 'book_appointment'. Tu DOIS impérativement appeler l'outil 'book_appointment' avec le 'nom_medecin' et la date/heure 'datetime' pour que le rendez-vous soit enregistré en base de données. N'affiche pas de texte de confirmation avant d'avoir reçu le succès de l'outil."
                    ]);

                    $newHistory = $this->buildHistory($session);
                    $newResponse = $this->callGemini($newHistory);
                    return $this->handleGeminiResponse($session, $newResponse);
                }
            }

            $msg = $session->messages()->create([
                'role' => 'model',
                'content' => $cleanedText,
                'tool_calls' => json_encode($parts)
            ]);
            return ['session' => $session, 'message' => $msg];
        }
    }

    private function executeTool(AiSession $session, $name, $args)
    {
        // Résolution de spécialité de secours en PHP si l'IA omet l'argument ou donne un défaut générique
        $symptomTerm = $args['symptom_term'] ?? $args['symptom'] ?? '';
        if (empty($args['recommended_specialty']) || $args['recommended_specialty'] === 'Généraliste' || $args['recommended_specialty'] === 'Médecine générale') {
            if (!empty($symptomTerm)) {
                $resolved = $this->resolveSpecialtyFromSymptom($symptomTerm);
                $args['recommended_specialty'] = $resolved;
            }
        }

        switch ($name) {
            case 'map_icd10':
                return $this->diagnosticService->mapIcd10($args);
            case 'calculate_risk':
                return $this->diagnosticService->calculateRisk($args);
            case 'find_doctor':
                return $this->rendezVousService->trouverMedecin($args);
            case 'book_appointment':
                return $this->rendezVousService->reserverRendezVous($args, $session->patient_id);
            case 'diagnostic_complet':
                $icd10 = $this->diagnosticService->mapIcd10($args);
                $risk = $this->diagnosticService->calculateRisk($args);
                $doctors = $this->rendezVousService->trouverMedecin([
                    'specialty' => $args['recommended_specialty'] ?? 'Médecine générale',
                    'date' => $args['date'] ?? null
                ]);
                return [
                    'icd10_results' => $icd10,
                    'risk_assessment' => $risk,
                    'doctors_found' => $doctors
                ];
            default:
                return ['error' => "Outil inconnu"];
        }
    }

    // ================================================================
    //  OLLAMA / QWEN 2.5:3B — Fallback local (avec Function Calling)
    // ================================================================

    /**
     * Traitement via Ollama (Qwen2.5:3B) en cas d'échec Gemini.
     * Supporte les function calls (tools) au format OpenAI.
     */
    private function processWithOllama(AiSession $session, string $messageText)
    {
        $ollamaMessages = $this->buildOllamaMessages($session);
        $tools = $this->getOllamaTools();

        return $this->ollamaConversationLoop($session, $ollamaMessages, $tools, 0);
    }

    /**
     * Boucle de conversation Ollama avec gestion des tool calls.
     * Limite à 5 itérations pour éviter les boucles infinies.
     */
    private function ollamaConversationLoop(AiSession $session, array $messages, array $tools, int $iteration)
    {
        if ($iteration >= 5) {
            $msg = $session->messages()->create([
                'role' => 'model',
                'content' => "J'ai analysé votre situation. Pour plus de détails, n'hésitez pas à reformuler votre question.",
                'tool_calls' => null
            ]);
            return ['session' => $session, 'message' => $msg];
        }

        $response = $this->callOllama($messages, $tools);
        $messageData = $response['message'] ?? [];

        // ── Cas 1 : Le modèle veut appeler des outils ──
        if (!empty($messageData['tool_calls'])) {
            // Sauvegarder la réponse du modèle avec les tool calls
            $toolCallsParts = [];
            foreach ($messageData['tool_calls'] as $tc) {
                $args = $tc['function']['arguments'] ?? [];
                if (is_string($args)) {
                    $args = json_decode($args, true) ?? [];
                }
                
                $toolCallsParts[] = [
                    'functionCall' => [
                        'name' => $tc['function']['name'],
                        'args' => $args
                    ]
                ];
            }

            $cleanedContent = $this->cleanModelResponse($messageData['content'] ?? null);

            $session->messages()->create([
                'role' => 'model',
                'content' => $cleanedContent ?: null,
                'tool_calls' => json_encode($toolCallsParts)
            ]);

            // Ajouter le message assistant (avec tool_calls et contenu nettoyé) à l'historique Ollama
            $messageDataCleaned = $messageData;
            $messageDataCleaned['content'] = $cleanedContent;
            $messages[] = $messageDataCleaned;

            // Exécuter chaque outil et ajouter les résultats
            foreach ($messageData['tool_calls'] as $toolCall) {
                $name = $toolCall['function']['name'];
                $args = $toolCall['function']['arguments'] ?? [];
                if (is_string($args)) {
                    $args = json_decode($args, true) ?? [];
                }
                
                $result = $this->executeTool($session, $name, $args);

                // Sauvegarder le résultat en base
                $session->messages()->create([
                    'role' => 'function',
                    'content' => $name,
                    'tool_calls' => json_encode($result)
                ]);

                // Ajouter le résultat au contexte Ollama
                $messages[] = [
                    'role' => 'tool',
                    'content' => json_encode($result, JSON_UNESCAPED_UNICODE)
                ];
            }

            // Relancer le modèle avec les résultats des outils
            return $this->ollamaConversationLoop($session, $messages, $tools, $iteration + 1);
        }

        // ── Cas 2 : Réponse textuelle finale ──
        $textContent = $messageData['content'] ?? "Je suis désolé, je n'ai pas pu générer une réponse.";
        $cleanedText = $this->cleanModelResponse($textContent);

        // Guardrail: Vérifier si le modèle confirme un rendez-vous sans avoir appelé l'outil
        $hasBookingWords = (stripos($cleanedText, 'rendez-vous') !== false) && 
                            (stripos($cleanedText, 'confirmé') !== false || 
                             stripos($cleanedText, 'réservé') !== false || 
                             stripos($cleanedText, 'bien été envoyée') !== false ||
                             stripos($cleanedText, 'a bien été enregistré') !== false);

        $lastUserMsg = $session->messages()->where('role', 'user')->orderBy('id', 'desc')->first();
        if ($lastUserMsg) {
            $bookingExecutedInThisTurn = $session->messages()
                ->where('id', '>', $lastUserMsg->id)
                ->where('role', 'function')
                ->where('content', 'book_appointment')
                ->exists();

            if ($hasBookingWords && !$bookingExecutedInThisTurn) {
                // On ajoute la réponse incomplète du modèle à l'historique
                $messages[] = $messageData;
                // On ajoute l'instruction corrective
                $messages[] = [
                    'role' => 'user',
                    'content' => "Système : Tu as indiqué que le rendez-vous était réservé ou confirmé, mais tu n'as pas exécuté l'outil 'book_appointment'. Tu DOIS impérativement appeler l'outil 'book_appointment' avec le 'nom_medecin' et la date/heure 'datetime' pour que le rendez-vous soit enregistré en base de données. N'affiche pas de texte de confirmation avant d'avoir reçu le succès de l'outil."
                ];
                // Relancer la boucle avec l'instruction corrective
                return $this->ollamaConversationLoop($session, $messages, $tools, $iteration + 1);
            }
        }

        $msg = $session->messages()->create([
            'role' => 'model',
            'content' => $cleanedText,
            'tool_calls' => null
        ]);

        return ['session' => $session, 'message' => $msg];
    }

    /**
     * Construit le tableau de messages au format Ollama/OpenAI.
     */
    private function buildOllamaMessages(AiSession $session): array
    {
        $patient = $session->patient;
        $dossier = $patient->dossierMedical;

        $specialtiesList = \App\Models\Specialite::pluck('nom')->toArray();

        $system = "Tu es un agent médical IA expert. Ton rôle est d'analyser les symptômes du patient, de déterminer le niveau de gravité, et si nécessaire de trouver un médecin et de prendre rendez-vous.\n";
        $system .= "La date et l'heure actuelles de la consultation sont : " . now()->format('Y-m-d H:i:s') . ". Ne propose jamais de créneaux ou de dates dans le passé.\n";
        $system .= "Les spécialités médicales disponibles dans notre base de données et que tu dois recommander pour orienter les patients sont : " . implode(', ', $specialtiesList) . ".\n";
        $system .= "Tu as accès à des outils (tools) pour accomplir ces tâches. Utilise-les quand c'est pertinent.\n\n";

        $system .= "--- DOSSIER MEDICAL DU PATIENT ---\n";
        if ($dossier) {
            $system .= "Allergies : " . ($dossier->allergies ? implode(', ', $dossier->allergies) : 'Aucune') . "\n";
            $system .= "Maladies chroniques : " . ($dossier->maladies_chroniques ?? 'Aucune') . "\n";
            $system .= "Groupe sanguin : " . ($dossier->groupe_sanguin ?? 'Inconnu') . "\n";
        } else {
            $system .= "Nouveau patient, aucun antécédent connu.\n";
        }
        $system .= "---------------------------------\n\n";

        $system .= "IMPORTANT: Dans notre système, la spécialité pour un médecin généraliste s'appelle 'Médecine générale'. Ne cherche jamais 'Généraliste' mais 'générale'.\n";
        $system .= "RÈGLES D'ORIENTATION CLINIQUE (À RESPECTER ABSOLUMENT) :\n";
        $system .= "- Si les symptômes concernent les dents, les gencives, la bouche, ou la mastication (ex: douleur dentaire, sensibilité au chaud/froid sur une dent, abcès dentaire, douleur lors de la mastication), tu DOIS recommander la spécialité 'Dentiste'.\n";
        $system .= "- Si les symptômes concernent la peau, des éruptions cutanées, des rougeurs, de l'acné, ou des grains de beauté, tu DOIS recommander la spécialité 'Dermatologie'.\n";
        $system .= "- Si les symptômes concernent le cœur, la poitrine, des palpitations, ou des douleurs thoraciques, tu DOIS recommander la spécialité 'Cardiologie'.\n";
        $system .= "- Si les symptômes concernent les yeux ou la vision, tu DOIS recommander la spécialité 'Ophtalmologie'.\n";
        $system .= "- Si les symptômes concernent les oreilles, le nez ou la gorge, tu DOIS recommander la spécialité 'ORL'.\n";
        $system .= "- Pour les autres cas généraux (fièvre, toux, fatigue générale, maux de ventre légers), recommande 'Médecine générale'.\n";
        $system .= "CONSIGNES DE COMMUNICATION AVEC LE PATIENT :\n";
        $system .= "1. Adopte un ton humain, professionnel, rassurant, empathique et très clair.\n";
        $system .= "2. RÈGLE CRITIQUE DE SÉCURITÉ : Tu ne dois JAMAIS réserver un rendez-vous (appeler l'outil `book_appointment`) de ta propre initiative. Tu dois d'abord présenter la liste des médecins et créneaux disponibles, puis demander poliment au patient de confirmer le créneau souhaité. N'appelle l'outil `book_appointment` que si le patient a explicitement confirmé son accord pour réserver un créneau précis.\n";
        $system .= "3. NE MENTIONNE JAMAIS les scores de gravité chiffrés (ex: 3/12) ni les codes médicaux techniques (comme l'ICD-10) dans tes réponses au patient.\n";
        $system .= "4. Exprime le niveau de gravité en mots simples (ex: Léger, Modéré, Élevé, Urgence).\n";
        $system .= "5. Structure ta réponse en utilisant CE FORMAT EXACT avec du gras (**texte**) pour les titres :\n\n";
        $system .= "**Diagnostic estimé :**\n[Ton explication simple et rassurante]\n\n";
        $system .= "**Niveau de gravité :** [Léger/Modéré/Élevé/Urgence]\n\n";
        $system .= "**Recommandations :**\n- [Conseil 1]\n- [Conseil 2]\n\n";
        $system .= "**Médecins disponibles :**\n[Liste si trouvés, sinon indique qu'il n'y en a pas]\n\n";
        $system .= "5. Pour prendre rendez-vous, tu DOIS utiliser l'outil `book_appointment` avec le nom exact du médecin et la date/heure exacte du créneau que tu auras trouvé via l'outil `find_doctor`.\n";
        $system .= "6. INTERDICTION ABSOLUE de confirmer un rendez-vous si tu n'as pas exécuté l'outil `book_appointment` et reçu une réponse de succès.\n";
        $system .= "7. NE JAMAIS inventer de créneaux horaires. Tu ne peux proposer que les créneaux exacts (date et heure) retournés par la recherche de médecins.\n";
        $system .= "8. NE PARLE JAMAIS d'outils, de fonctions informatiques ou d'actions techniques internes dans tes réponses au patient (par exemple, n'écris jamais 'Je vais maintenant utiliser l'outil book_appointment pour réserver ce créneau' ou 'Je vais appeler find_doctor'). Reste entièrement invisible techniquement et communique de façon naturelle et fluide avec le patient.\n";
        $system .= "9. RÈGLES DE MISE EN FORME ET D'AFFICHAGE DU TEXTE :\n";
        $system .= "   - Affiche TOUJOURS les titres de section en gras et sur une nouvelle ligne (ex: **Diagnostic estimé :**, **Niveau de gravité :**, **Recommandations :**, **Médecins disponibles :**).\n";
        $system .= "   - Pour lister les médecins et leurs créneaux, utilise TOUJOURS exactement ce format avec des retours à la ligne :\n";
        $system .= "     - Dr. [Prénom Nom] ([Spécialité]) :\n";
        $system .= "       * [Date au format AAAA-MM-JJ] à [Heure]\n";
        $system .= "       * [Date au format AAAA-MM-JJ] à [Heure]\n";
        $system .= "   - Pour confirmer un rendez-vous (après le retour de book_appointment) :\n";
        $system .= "     **Rendez-vous réservé :**\n";
        $system .= "     Votre demande de rendez-vous a bien été envoyée avec le Dr. [Nom] pour le [Date] à [Heure]. Elle est en attente de validation.\n";
        $system .= "   - INTERDICTION d'écrire des listes de paramètres bruts comme '- Nom du médecin:' ou '- Date et heure:'. Rédige des phrases simples.\n";
        $system .= "Ne modifie pas le dossier médical de force, contente-toi de le lire pour le contexte.";

        $messages = [
            ['role' => 'system', 'content' => $system]
        ];

        // ── Historique de la conversation ──
        $dbMessages = $session->messages()
            ->whereIn('role', ['user', 'model'])
            ->whereNotNull('content')
            ->orderBy('created_at', 'asc')
            ->get();

        foreach ($dbMessages as $msg) {
            $messages[] = [
                'role' => $msg->role === 'user' ? 'user' : 'assistant',
                'content' => $msg->content
            ];
        }

        return $messages;
    }

    /**
     * Définition des outils au format OpenAI (compatible Ollama).
     */
    private function getOllamaTools(): array
    {
        return [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'map_icd10',
                    'description' => "Trouve les codes ICD-10 correspondant aux symptômes décrits.",
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'symptom_term' => ['type' => 'string', 'description' => 'Terme de recherche (ex: fièvre, toux)']
                        ],
                        'required' => ['symptom_term']
                    ]
                ]
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'calculate_risk',
                    'description' => "Calcule le score de risque (1-12) en fonction des symptômes.",
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'risk_score' => ['type' => 'integer', 'description' => 'Score de 1 à 12'],
                            'recommended_specialty' => ['type' => 'string', 'description' => 'Spécialité recommandée']
                        ],
                        'required' => ['risk_score', 'recommended_specialty']
                    ]
                ]
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'find_doctor',
                    'description' => "Recherche un médecin disponible selon une spécialité et optionnellement une date.",
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'specialty' => ['type' => 'string', 'description' => 'Spécialité'],
                            'date' => ['type' => 'string', 'description' => 'Date optionnelle (YYYY-MM-DD)']
                        ],
                        'required' => ['specialty']
                    ]
                ]
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'book_appointment',
                    'description' => "Réserve un créneau avec un médecin.",
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'nom_medecin' => ['type' => 'string', 'description' => 'Nom du médecin (ex: Dr. amen tahebt)'],
                            'datetime' => ['type' => 'string', 'description' => 'Date et heure exacte du créneau (ex: 2026-06-03 08:45:00)']
                        ],
                        'required' => ['nom_medecin', 'datetime']
                    ]
                ]
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'diagnostic_complet',
                    'description' => "Effectue un diagnostic complet en une seule étape: trouve les codes ICD-10, calcule le score de risque (1-12) et cherche des médecins disponibles.",
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'symptom_term' => ['type' => 'string', 'description' => 'Symptômes pour la recherche ICD-10'],
                            'risk_score' => ['type' => 'integer', 'description' => 'Score calculé de 1 à 12'],
                            'recommended_specialty' => ['type' => 'string', 'description' => 'Spécialité recommandée'],
                            'date' => ['type' => 'string', 'description' => 'Date souhaitée (YYYY-MM-DD) optionnelle']
                        ],
                        'required' => ['symptom_term', 'risk_score', 'recommended_specialty']
                    ]
                ]
            ]
        ];
    }

    /**
     * Appel à l'API Ollama locale (/api/chat) avec support des tools.
     */
    private function callOllama(array $messages, array $tools = []): array
    {
        $url = rtrim($this->ollamaUrl, '/') . '/api/chat';

        $payload = [
            'model' => $this->ollamaModel,
            'messages' => $messages,
            'stream' => false,
            'options' => [
                'temperature' => 0.7,
                'num_predict' => 1024,
            ]
        ];

        if (!empty($tools)) {
            $payload['tools'] = $tools;
        }

        try {
            $response = Http::timeout(120)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post($url, $payload);

            if ($response->failed()) {
                Log::error('Ollama API Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('OLLAMA_ERROR_' . $response->status());
            }

            return $response->json();

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Ollama connexion impossible', ['error' => $e->getMessage()]);
            throw new \Exception('OLLAMA_CONNECTION_FAILED');
        }
    }

    /**
     * Nettoie les phrases techniques ou mentions d'outils internes de la réponse finale affichée au patient.
     */
    private function cleanModelResponse(?string $text): ?string
    {
        if (empty($text)) {
            return $text;
        }

        // Remplacer les tirets doubles par un retour à la ligne + puce indentée
        $text = str_replace(' - -', "\n  - ", $text);
        $text = str_replace('- -', "\n  - ", $text);

        // Nettoyer les parenthèses de description technique de paramètre
        $text = preg_replace('/\(date et heure exacte du créneau\)/i', '', $text);
        
        // Nettoyer "Créneau disponible à "
        $text = preg_replace('/Créneau disponible à /i', '', $text);

        // Nettoyer les restes de paramètres collés
        $text = preg_replace('/- Nom du médecin:\s*Dr\.\s*Rendez-vous pris avec\s*:/i', "\n**Rendez-vous réservé :**", $text);
        $text = preg_replace('/Rendez-vous pris avec\s*:/i', "\n**Rendez-vous réservé :**", $text);

        $lines = explode("\n", $text);
        $cleanedLines = [];

        foreach ($lines as $line) {
            $trimmed = trim($line);
            
            // Si la ligne est technique ou vide
            if (
                $trimmed === '- Nom du médecin: Dr.' ||
                $trimmed === 'Réservez votre rendez-vous :' ||
                $trimmed === '- Nom du médecin:' ||
                stripos($trimmed, 'find_doctor') !== false ||
                stripos($trimmed, 'book_appointment') !== false ||
                stripos($trimmed, 'map_icd10') !== false ||
                stripos($trimmed, 'calculate_risk') !== false ||
                stripos($trimmed, 'diagnostic_complet') !== false ||
                stripos($trimmed, 'l\'outil') !== false ||
                stripos($trimmed, 'l’outil') !== false ||
                stripos($trimmed, 'appel de fonction') !== false ||
                stripos($trimmed, 'tool_call') !== false
            ) {
                continue;
            }

            // Remplacer les formats clés-valeurs techniques par des présentations plus humaines
            $line = preg_replace('/Nom du médecin\s*:\s*/i', 'Médecin : ', $line);
            $line = preg_replace('/Date et heure\s*:\s*/i', 'Date/Heure : ', $line);

            // Rendre le titre des blocs gras s'ils ne le sont pas
            $line = preg_replace('/^Diagnostic estimé\s*:/i', '**Diagnostic estimé :**', $line);
            $line = preg_replace('/^Niveau de gravité\s*:/i', '**Niveau de gravité :**', $line);
            $line = preg_replace('/^Recommandations\s*:/i', '**Recommandations :**', $line);
            $line = preg_replace('/^Médecins disponibles\s*:/i', '**Médecins disponibles :**', $line);

            $cleanedLines[] = $line;
        }

        $text = implode("\n", $cleanedLines);

        // Supprimer les espaces et retours à la ligne consécutifs superflus
        $text = preg_replace("/\n{3,}/", "\n\n", $text);

        return trim($text);
    }

    /**
     * Résout la spécialité médicale appropriée à partir du terme de recherche de symptômes.
     */
    private function resolveSpecialtyFromSymptom(string $symptom): string
    {
        $symptom = mb_strtolower($symptom);

        if (
            preg_match('/dent|gencive|mastic|carie|abcès dent|rage de dent|plombage|couronne dent/ui', $symptom)
        ) {
            return 'Dentiste';
        }
        if (
            preg_match('/peau|bouton|acné|cutan|rougeur|éruption|eczéma|psoriasis|grain de beauté/ui', $symptom)
        ) {
            return 'Dermatologie';
        }
        if (
            preg_match('/cœur|coeur|palpitation|poitrine|thorac|cardiaq|tension/ui', $symptom)
        ) {
            return 'Cardiologie';
        }
        if (
            preg_match('/yeux|vision|oeil|œil|ophtalmo/ui', $symptom)
        ) {
            return 'Ophtalmologie';
        }
        if (
            preg_match('/oreill|nez|gorge|sinus|otite|angine|rhino|laryng/ui', $symptom)
        ) {
            return 'ORL';
        }
        if (
            preg_match('/enfant|bébé|nourrisson|pédiat/ui', $symptom)
        ) {
            return 'Pédiatrie';
        }

        return 'Médecine générale';
    }
}

