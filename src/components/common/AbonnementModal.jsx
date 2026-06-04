import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, CheckCircle2, ChevronRight, ShieldAlert, Sparkles, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import './AbonnementModal.css';

const AbonnementModal = () => {
    const { user } = useAuth();
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(null);

    const pro = user?.professionnel;
    
    // Determine the status
    const now = new Date();
    const hadNoTrial = !pro?.trial_ends_at;
    let isTrialExpired = false;
    let isSubExpired = false;
    
    if (pro?.trial_ends_at) {
        isTrialExpired = new Date(pro.trial_ends_at) <= now;
    }
    
    if (pro?.subscription_ends_at) {
        isSubExpired = new Date(pro.subscription_ends_at) <= now;
    }

    let alertTitle = "Accès au tableau de bord restreint";
    let alertDesc = "Un abonnement actif est requis pour accéder à vos fonctionnalités.";

    if (isSubExpired) {
        alertTitle = "Abonnement expiré";
        alertDesc = "Votre abonnement a expiré. Veuillez le renouveler pour débloquer l'ensemble des fonctionnalités de votre espace professionnel.";
    } else if (hadNoTrial) {
        alertTitle = "Bienvenue sur la plateforme !";
        alertDesc = "Pour activer complètement votre compte et commencer à gérer vos consultations, la souscription à un abonnement est requise.";
    } else if (isTrialExpired) {
        alertTitle = "Période d'essai terminée";
        alertDesc = "Votre période d'essai gratuite est arrivée à son terme. Pour continuer à utiliser nos services, un abonnement actif est requis.";
    }

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const handleSubscribe = async (id) => {
        setSubscribing(id);
        try {
            const res = await api.post('/pro/subscribe', { subscription_id: id });
            if (res.data.success && res.data.url) {
                window.location.href = res.data.url;
            }
        } catch (err) {
            console.error('Erreur Stripe:', err);
            alert('Impossible d\'initier la souscription.');
            setSubscribing(null);
        }
    };

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/subscriptions'); 
            if (res.data && Array.isArray(res.data)) {
                setSubscriptions(res.data.filter(sub => sub.is_active));
            } else if (res.data.data) {
                setSubscriptions(res.data.data.filter(sub => sub.is_active));
            }
        } catch (err) {
            console.error('Error fetching subscriptions', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="abonnement-modal-overlay">
            <div className="abonnement-modal-container">
                {/* Background Decoration */}
                <div className="abonnement-modal-decor-1"></div>
                <div className="abonnement-modal-decor-2"></div>

                <div className="abonnement-modal-content">
                    {/* Access Restricted Banner */}
                    <div className="abonnement-modal-banner">
                        <div className="abonnement-modal-icon-wrap">
                            <ShieldAlert size={32} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="abonnement-modal-title">{alertTitle}</h1>
                            <p className="abonnement-modal-desc">{alertDesc}</p>
                        </div>
                    </div>

                    <div className="abonnement-modal-header">
                        <h2>Choisissez le plan qui vous correspond</h2>
                        <p>Reprenez le contrôle de votre activité avec nos offres claires, sans engagement caché.</p>
                    </div>

                    {loading ? (
                        <div className="abonnement-modal-loading">
                            <div className="auth-spinner" style={{ width: '40px', height: '40px', borderColor: '#e2e8f0', borderTopColor: '#6366f1' }}></div>
                        </div>
                    ) : (
                        <div className="abonnement-modal-grid">
                            {subscriptions.length > 0 && subscriptions.map((sub, index) => {
                                const isHighlighted = index === 1 || (subscriptions.length === 1);
                                
                                return (
                                <div key={sub.id} className={`abonnement-modal-card ${isHighlighted ? 'highlighted' : ''}`}>
                                    {isHighlighted && (
                                        <div className="abonnement-modal-badge">
                                            <Sparkles size={14} /> Recommandé
                                        </div>
                                    )}
                                    <h3>{sub.name}</h3>
                                    <p className="abonnement-modal-card-desc">{sub.description}</p>
                                    
                                    <div className="abonnement-modal-price-wrap">
                                        <span className="abonnement-modal-price">{sub.price}€</span>
                                        <span className="abonnement-modal-period">/ {sub.type || 'mois'}</span>
                                    </div>
                                    
                                    <div className="abonnement-modal-features">
                                        <div className="abonnement-modal-feature-item">
                                            <CheckCircle2 size={16} color="#10B981" /> <span>Gestion des rendez-vous</span>
                                        </div>
                                        <div className="abonnement-modal-feature-item">
                                            <CheckCircle2 size={16} color="#10B981" /> <span>Dossiers médicaux patients</span>
                                        </div>
                                        <div className="abonnement-modal-feature-item">
                                            <CheckCircle2 size={16} color="#10B981" /> <span>Gestion des secrétaires</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        className={`abonnement-modal-btn ${subscribing === sub.id ? 'loading' : ''}`}
                                        onClick={() => handleSubscribe(sub.id)}
                                        disabled={subscribing !== null}
                                    >
                                        {subscribing === sub.id ? (
                                            <div className="auth-spinner" style={{ width: '16px', height: '16px', borderTopColor: '#fff' }}></div>
                                        ) : (
                                            <>Souscrire <ChevronRight size={16} /></>
                                        )}
                                    </button>
                                </div>
                            )})}
                        </div>
                    )}
                    
                    {!loading && subscriptions.length === 0 && (
                        <div className="abonnement-modal-empty">
                            <Lock size={40} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                            <h3>Aucun abonnement disponible</h3>
                            <p>Veuillez contacter l'administration de la plateforme.</p>
                        </div>
                    )}

                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                        <Link to="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#0f172a'} onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}>
                            <ArrowLeft size={16} />
                            Retourner à l'accueil
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AbonnementModal;
