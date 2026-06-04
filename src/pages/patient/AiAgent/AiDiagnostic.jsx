import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Heart, Calendar, Plus, FileText, CreditCard, ShieldCheck, RotateCcw, Activity, Clock, Briefcase, Euro, Settings, Hospital, Cpu } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useAlert } from '../../../context/AlertContext';
import Sidebar from '../../../components/common/Sidebar';
import aiAgentService from '../../../services/aiAgentService';
import './AiDiagnostic.css';
import '../../professionnel/Professionnel.css';

const AiDiagnostic = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [engine, setEngine] = useState('gemini');
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const messagesEndRef = useRef(null);

  const sidebarLinks = [
    { path: '/patient/dashboard', label: "Vue d'ensemble", icon: <User size={20} /> },
    { path: '/patient/rendez-vous', label: 'Rendez-vous', icon: <Calendar size={20} /> },
    { path: '/patient/prendre-rendez-vous', label: 'Nouveau RDV', icon: <Plus size={20} /> },
    { path: '/patient/dossier-medical', label: 'Dossier médical', icon: <FileText size={20} /> },
    { path: '/patient/diagnostic-ia', label: 'Assistant Médical IA', icon: <Heart size={20} /> },
    { path: '/patient/paiement', label: 'Paiements', icon: <CreditCard size={20} /> },
    { path: '/patient/profil', label: 'Mon profil', icon: <User size={20} /> },
  ];

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      const data = await aiAgentService.getSession();
      setSession(data.session);
      setMessages(data.messages);
    } catch (error) {
      showAlert({ title: 'Erreur', message: 'Erreur lors du chargement de la session IA.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const data = await aiAgentService.sendMessage(userMessage.content);
      setSession(data.session);
      setMessages(data.messages);
      if (data.engine) setEngine(data.engine);
      
      if (data.latest_result && data.latest_result.status === 'success' && data.latest_result.appointment_id) {
          showAlert({ title: 'Succès', message: 'Rendez-vous réservé avec succès par l\'IA !', type: 'success' });
      }
    } catch (error) {
      let errorMsg = "Erreur de communication avec l'assistant. Veuillez vérifier votre connexion.";
      if (error.response && error.response.data && error.response.data.error_message) {
          errorMsg = error.response.data.error_message;
      } else {
          showAlert({ title: 'Erreur', message: 'Erreur de communication avec l\'IA.', type: 'error' });
      }
      setMessages(prev => [...prev, { role: 'model', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    showAlert({
      title: 'Nouvelle consultation',
      message: 'Voulez-vous terminer cette consultation et démarrer à nouveau ?',
      type: 'warning',
      showCancel: true,
      confirmText: 'Oui, recommencer',
      cancelText: 'Annuler',
      onConfirm: async () => {
        try {
          await aiAgentService.clearSession();
          await loadSession();
          showAlert({ title: 'Information', message: 'Session réinitialisée.', type: 'info' });
        } catch (error) {
          showAlert({ title: 'Erreur', message: 'Erreur lors de la réinitialisation.', type: 'error' });
        }
      }
    });
  };

  const formatText = (text) => {
    // Sépare le texte par lignes et traite le gras (**texte**)
    return text.split('\n').map((line, lineIndex) => {
      if (line.trim() === '') return <br key={`br-${lineIndex}`} />;
      
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={`line-${lineIndex}`} className="mb-1">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="text-blue-600 font-semibold">{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
      );
    });
  };

  const renderMessageContent = (msg) => {
    if (msg.role === 'user') return msg.content;

    if (msg.tool_calls) {
      try {
        const parts = JSON.parse(msg.tool_calls);
        if (Array.isArray(parts) && parts[0] && parts[0].name) {
             return (
                 <>
                    {msg.content && <div className="mb-2">{formatText(msg.content)}</div>}
                    {parts.map((t, idx) => (
                        <div key={idx} className="ai-tool-call">
                            <strong>Action de l'IA : </strong> 
                            {t.name === 'map_icd10' && "Analyse de vos symptômes en cours..."}
                            {t.name === 'calculate_risk' && "Évaluation de la situation..."}
                            {t.name === 'find_doctor' && "Recherche d'un professionnel de santé disponible..."}
                            {t.name === 'book_appointment' && "Réservation de votre rendez-vous..."}
                        </div>
                    ))}
                 </>
             );
        }

        return parts.map((p, idx) => {
          if (p.text) return <div key={idx} className="mb-2">{formatText(p.text)}</div>;
          if (p.thought) return <div key={idx} className="ai-thought italic text-gray-500 text-sm mb-2">{p.thought}</div>;
          if (p.functionCall) {
            const name = p.functionCall.name;
            return (
              <div key={idx} className="ai-tool-call">
                <strong>Action de l'IA : </strong>
                {name === 'map_icd10' && "Analyse de vos symptômes en cours..."}
                {name === 'calculate_risk' && "Évaluation de la situation..."}
                {name === 'find_doctor' && "Recherche d'un professionnel de santé disponible..."}
                {name === 'book_appointment' && "Réservation de votre rendez-vous..."}
                {name === 'diagnostic_complet' && "Analyse complète de la situation en cours..."}
              </div>
            );
          }
          return null;
        });
      } catch (e) {
        return msg.content || "Action complexe en cours...";
      }
    }

    return msg.content ? formatText(msg.content) : null;
  };

  return (
    <div className="pro-container">
      <Sidebar links={sidebarLinks} />

      <main className="pro-main-content ai-full-screen-main">
        <div className="ai-diagnostic-container">
          <div className="ai-diagnostic-header">
            <div className="ai-header-title">
              <ShieldCheck className="w-8 h-8 text-white" />
              <h2>Assistant Médical IA</h2>
              <div className="ai-pulse-dot" title="En ligne"></div>
              {engine === 'ollama_qwen' && (
                <div className="ai-engine-badge" title="Modèle local Qwen2.5 actif (fallback)">
                  <Cpu size={14} />
                  <span>Qwen Local</span>
                </div>
              )}
            </div>
            <button className="ai-clear-btn" onClick={handleClear} title="Nouvelle consultation">
              <RotateCcw className="w-5 h-5 inline-block mr-1" /> Recommencer
            </button>
          </div>

          <div className="ai-chat-messages">
            {messages.length === 0 && (
              <div className="ai-welcome-card">
                <div className="ai-avatar-large">
                  <User size={40} />
                </div>
                <h2>Bonjour {user?.prenom}</h2>
                <p>Je suis votre assistant médical intelligent. Comment puis-je vous aider aujourd'hui ?</p>
                <div className="ai-suggestions">
                  <button onClick={() => setInputValue("J'ai mal à la tête depuis ce matin")}>J'ai mal à la tête...</button>
                  <button onClick={() => setInputValue("J'ai de la fièvre et je tousse")}>Fièvre et toux...</button>
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index} className={`ai-message ${msg.role}`}>
                <div className="ai-message-content">
                  {renderMessageContent(msg)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="ai-typing-indicator">
                <div className="ai-typing-dot"></div>
                <div className="ai-typing-dot"></div>
                <div className="ai-typing-dot"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="ai-chat-input-area" onSubmit={handleSend}>
            <input
              type="text"
              className="ai-chat-input"
              placeholder="Décrivez vos symptômes (ex: douleur à la poitrine depuis ce matin...)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className="ai-send-btn" disabled={!inputValue.trim() || isLoading}>
              <Send className="w-6 h-6" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AiDiagnostic;
