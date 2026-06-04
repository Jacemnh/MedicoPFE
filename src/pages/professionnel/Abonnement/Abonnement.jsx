import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Lock, CreditCard, CheckCircle2, ChevronRight, Calendar, Users, Settings, Home, ShieldAlert, Sparkles, CheckCircle, FileText, ArrowUp, RefreshCw, X, ArrowDown, Clock, AlertTriangle, Activity, Briefcase, Euro, Download } from 'lucide-react';
import Sidebar from '../../../components/common/Sidebar';
import api from '../../../api/axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './Abonnement.css';

const Abonnement = () => {
    const { user, checkAuth } = useAuth();
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [statusData, setStatusData] = useState(null);
    const [history, setHistory] = useState([]);
    
    const location = useLocation();
    const navigate = useNavigate();

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
        alertTitle = "Bienvenue sur la plateforme";
        alertDesc = "Pour activer complètement votre compte et commencer à gérer vos consultations, la souscription à un abonnement est requise.";
    } else if (isTrialExpired) {
        alertTitle = "Période d'essai terminée";
        alertDesc = "Votre période d'essai gratuite est arrivée à son terme. Pour continuer à utiliser nos services, un abonnement actif est requis.";
    }

    const sidebarLinks = [
        { path: '/professionnel/dashboard', label: 'Tableau de bord', icon: <Activity size={20} /> },
        { path: '/professionnel/consultations', label: 'Mes rendez-vous', icon: <FileText size={20} /> },
        { path: '/professionnel/patients', label: 'Mes patients', icon: <Users size={20} /> },
        { path: '/professionnel/creneaux', label: 'Mes créneaux', icon: <Clock size={20} /> },
        { path: '/professionnel/services', label: 'Mes services', icon: <Briefcase size={20} /> },
        { path: '/professionnel/secretaires', label: 'Mes secrétaires', icon: <Users size={20} /> },
        { path: '/professionnel/finances', label: 'Revenus & Paiements', icon: <Euro size={20} /> },
        { path: '/professionnel/abonnement', label: 'Abonnement', icon: <CreditCard size={20} /> },
        { path: '/professionnel/profil', label: 'Mon profil', icon: <Settings size={20} /> },
    ];

    useEffect(() => {
        fetchSubscriptions();
        fetchStatus();
        handlePaymentReturn();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/pro/subscription/status');
            if (res.data.success) {
                setStatusData(res.data);
                setHistory(res.data.history || []);
            }
        } catch (err) {
            console.error('Erreur status abonnement:', err);
        }
    };

    const handlePaymentReturn = async () => {
        const params = new URLSearchParams(location.search);
        const success = params.get('success');
        const subId = params.get('subscription_id');

        if (success === 'true' && subId) {
            try {
                const res = await api.post('/pro/subscribe/verify', { subscription_id: subId });
                if (res.data.success) {
                    setShowSuccessModal(true);
                    await checkAuth(); // Refresh user data to update UI
                    navigate('/professionnel/abonnement', { replace: true });
                }
            } catch (err) {
                console.error('Erreur lors de la vérification de l\'abonnement:', err);
            }
        }
    };

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

    const handleDownloadInvoice = async (id) => {
        try {
            const response = await api.get(`/pro/subscription/invoice/${id}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `facture-medico-${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Erreur téléchargement facture:', err);
        }
    };

    const handleDownloadAll = () => {
        if (history.length === 0) {
            alert('Aucune facture disponible.');
            return;
        }
        history.forEach((pay, index) => {
            setTimeout(() => {
                handleDownloadInvoice(pay.id);
            }, index * 500);
        });
    };

    const getStatusLabel = (status) => {
        switch(status) {
            case 'actif': return { label: 'Actif', color: '#10B981', bg: '#D1FAE5' };
            case 'essai': return { label: 'Période d\'essai', color: '#6366F1', bg: '#E0E7FF' };
            case 'expire': return { label: 'Expiré', color: '#EF4444', bg: '#FEE2E2' };
            case 'essai_termine': return { label: 'Essai terminé', color: '#F59E0B', bg: '#FEF3C7' };
            default: return { label: 'Aucun', color: '#64748B', bg: '#F1F5F9' };
        }
    };

    return (
        <div className="dashboard-layout abonnement-page-container">
            <Sidebar links={sidebarLinks} />
            
            <main className="dashboard-main abonnement-main-content">
                {/* Background Decoration */}
                <div className="abonnement-bg-decor-1"></div>
                <div className="abonnement-bg-decor-2"></div>

                <div className="abonnement-content-wrapper">
                    
                    <div className="abonnement-header" style={{ marginBottom: '45px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                        <div style={{ textAlign: 'left' }}>
                            <span className="pro-tag-primary" style={{ display: 'inline-block', padding: '5px 14px', background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>TABLEAU DE BORD ABONNEMENT</span>
                            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>Gérer mon abonnement</h1>
                            <p style={{ color: '#475569', fontSize: '0.95rem', margin: '0' }}>Supervisez votre plan actuel, vos factures et les options de renouvellement.</p>
                        </div>
                        <button onClick={handleDownloadAll} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(139, 92, 246, 0.2)', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(139, 92, 246, 0.3)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(139, 92, 246, 0.2)'; }}>
                            <Download size={18} /> Télécharger toutes les factures
                        </button>
                    </div>

                    {statusData && (
                        <div className="abonnement-stats-grid">
                            <div className="abonnement-stat-card">
                                <div className="abonnement-sc-top">
                                    <div className="abonnement-sc-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                                        <Activity size={22} />
                                    </div>
                                </div>
                                <div className="abonnement-sc-body">
                                    <span>Statut Actuel</span>
                                    <h3>{getStatusLabel(statusData.status).label}</h3>
                                </div>
                            </div>
                            
                            <div className="abonnement-stat-card">
                                <div className="abonnement-sc-top">
                                    <div className="abonnement-sc-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                                        <Clock size={22} />
                                    </div>
                                </div>
                                <div className="abonnement-sc-body">
                                    <span>Temps restant</span>
                                    <h3>{statusData.status === 'actif' || statusData.status === 'essai' ? `${Math.ceil(statusData.days_remaining)} Jours` : '-'}</h3>
                                </div>
                            </div>

                            <div className="abonnement-stat-card">
                                <div className="abonnement-sc-top">
                                    <div className="abonnement-sc-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
                                        <Sparkles size={22} />
                                    </div>
                                </div>
                                <div className="abonnement-sc-body">
                                    <span>Plan Actuel</span>
                                    <h3>{statusData.current_subscription?.name || 'Aucun'}</h3>
                                </div>
                            </div>

                            <div className="abonnement-stat-card">
                                <div className="abonnement-sc-top">
                                    <div className="abonnement-sc-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                                        <FileText size={22} />
                                    </div>
                                </div>
                                <div className="abonnement-sc-body">
                                    <span>Dernière Facture</span>
                                    <h3>{history.length > 0 ? `${history[0].montant}€` : '0€'}</h3>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Section Status Actuel ──────────────── */}
                    {statusData && (
                        <div className="abonnement-status-section">
                            <div className="abonnement-status-card photo-style">
                                <div className="photo-status-header">
                                    <div className="photo-status-left">
                                        <div className="photo-badge" style={{ color: getStatusLabel(statusData.status).color, backgroundColor: getStatusLabel(statusData.status).bg }}>
                                            <span className="photo-dot" style={{ backgroundColor: getStatusLabel(statusData.status).color }}></span>
                                            {getStatusLabel(statusData.status).label}
                                        </div>
                                        <h2 className="photo-title">{statusData.current_subscription?.name || "Pas d'abonnement actif"}</h2>
                                        <p className="photo-subtitle">
                                            {statusData.status === 'actif' && statusData.subscription_ends_at ? `Renouvellement le ${new Date(statusData.subscription_ends_at).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'})} à ${new Date(statusData.subscription_ends_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}` : 
                                             statusData.status === 'essai' && statusData.trial_ends_at ? `Votre période d'essai se termine le ${new Date(statusData.trial_ends_at).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'})} à ${new Date(statusData.trial_ends_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}` : 
                                             "Abonnement requis pour accéder aux fonctionnalités complètes."}
                                        </p>
                                    </div>
                                    <div className="photo-days-box">
                                        <span className="photo-days-number">{Math.ceil(statusData.days_remaining)}</span>
                                        <span className="photo-days-text">Jours restants</span>
                                    </div>
                                </div>
                                
                                <div className="photo-progress-section">
                                    <div className="photo-progress-labels">
                                        <span className="photo-prog-date">Début — {
                                            (statusData.subscription_ends_at || statusData.trial_ends_at) 
                                                ? new Date(new Date(statusData.subscription_ends_at || statusData.trial_ends_at).getTime() - 30*24*60*60*1000).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long'})
                                                : 'N/A'
                                        }</span>
                                        <span className="photo-prog-date">Fin — {
                                            (statusData.subscription_ends_at || statusData.trial_ends_at)
                                                ? new Date(statusData.subscription_ends_at || statusData.trial_ends_at).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long'})
                                                : 'N/A'
                                        }</span>
                                    </div>
                                    <div className="photo-progress-bar">
                                        <div 
                                            className="photo-progress-fill" 
                                            style={{ 
                                                width: `${Math.max(5, Math.min(100, ((30 - statusData.days_remaining) / 30) * 100))}%`,
                                                backgroundColor: '#6366f1' 
                                            }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="photo-actions">
                                    <button className="photo-btn" onClick={() => document.getElementById('plans-section').scrollIntoView({ behavior: 'smooth' })}>
                                        <ArrowUp size={18} strokeWidth={2.5} /> Mettre à niveau
                                    </button>
                                    <button className="photo-btn" onClick={() => {
                                        const sec = document.querySelector('.abonnement-billing-section');
                                        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                                    }}>
                                        <FileText size={18} strokeWidth={2.5} /> Factures
                                    </button>
                                </div>

                                {statusData.status === 'essai' && (
                                    <div className="photo-trial-banner">
                                        <div className="photo-trial-icon"><Clock size={28} /></div>
                                        <div className="photo-trial-content">
                                            <h4>Votre essai gratuit se termine dans {Math.ceil(statusData.days_remaining)} jours</h4>
                                            <p>Passez au plan Pro maintenant pour ne pas perdre vos données.</p>
                                        </div>
                                        <button className="photo-trial-btn" onClick={() => document.getElementById('plans-section').scrollIntoView({ behavior: 'smooth' })}>
                                            Passer au Pro
                                        </button>
                                    </div>
                                )}

                                {(statusData.status === 'expire' || statusData.status === 'essai_termine') && (
                                    <div className="photo-trial-banner" style={{ background: '#ef4444' }}>
                                        <div className="photo-trial-icon"><AlertTriangle size={28} /></div>
                                        <div className="photo-trial-content">
                                            <h4>Accès restreint</h4>
                                            <p>Votre abonnement/essai a expiré. Veuillez choisir une offre.</p>
                                        </div>
                                        <button className="photo-trial-btn" onClick={() => document.getElementById('plans-section').scrollIntoView({ behavior: 'smooth' })}>
                                            S'abonner
                                        </button>
                                    </div>
                                )}

                                <div className="photo-arrow-down" onClick={() => document.getElementById('plans-section').scrollIntoView({ behavior: 'smooth' })}>
                                    <ArrowDown size={20} strokeWidth={3} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Section Offres ────────────────────── */}
                    <div id="plans-section" className="abonnement-header" style={{ marginTop: '60px' }}>
                        <h2>Choisissez le plan qui vous correspond</h2>
                        <p>Des offres transparentes adaptées à la taille de votre cabinet.</p>
                    </div>

                    {loading ? (
                        <div className="abonnement-loading-wrap">
                            <div className="auth-spinner" style={{ width: '40px', height: '40px', borderColor: '#e2e8f0', borderTopColor: '#6366f1' }}></div>
                        </div>
                    ) : (
                        <div className="abonnement-grid">
                            {subscriptions.length > 0 && subscriptions.map((sub, index) => {
                                const isHighlighted = sub.name.toLowerCase().includes('pro') || sub.name.toLowerCase().includes('premium');
                                const isCurrent = statusData?.current_subscription?.id === sub.id && statusData?.status === 'actif';

                                return (
                                <div key={sub.id} className={`abonnement-card ${isHighlighted ? 'highlighted' : ''} ${isCurrent ? 'current' : ''}`}>
                                    {isHighlighted && (
                                        <div className="abonnement-badge">
                                            <Sparkles size={14} /> Recommandé
                                        </div>
                                    )}
                                    {isCurrent && (
                                        <div className="abonnement-current-badge">
                                            <CheckCircle2 size={14} /> Votre plan actuel
                                        </div>
                                    )}
                                    <h3>{sub.name}</h3>
                                    <p className="abonnement-card-desc">{sub.description}</p>
                                    
                                    <div className="abonnement-price-wrap">
                                        <span className="abonnement-price">{sub.price}€</span>
                                        <span className="abonnement-period">/ {sub.type || 'mois'}</span>
                                    </div>
                                    
                                    <div className="abonnement-features">
                                        <div className="abonnement-feature-item">
                                            <CheckCircle2 size={18} color="#10B981" /> <span>Gestion des rendez-vous</span>
                                        </div>
                                        <div className="abonnement-feature-item">
                                            <CheckCircle2 size={18} color="#10B981" /> <span>Dossiers médicaux patients</span>
                                        </div>
                                        <div className="abonnement-feature-item">
                                            <CheckCircle2 size={18} color="#10B981" /> <span>Gestion des secrétaires</span>
                                        </div>
                                        <div className="abonnement-feature-item">
                                            <CheckCircle2 size={18} color="#10B981" /> <span>Support technique prioritaire</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        className={`abonnement-btn ${subscribing === sub.id ? 'loading' : ''} ${isCurrent ? 'disabled' : ''}`}
                                        onClick={() => !isCurrent && handleSubscribe(sub.id)}
                                        disabled={subscribing !== null || isCurrent}
                                    >
                                        {subscribing === sub.id ? (
                                            <div className="auth-spinner" style={{ width: '18px', height: '18px', borderTopColor: '#fff' }}></div>
                                        ) : isCurrent ? (
                                            "Plan actuel"
                                        ) : (
                                            <>Choisir cette offre <ChevronRight size={18} /></>
                                        )}
                                    </button>
                                </div>
                            )})}
                        </div>
                    )}

                    {/* ── Section Facturation ────────────────── */}
                    {history.length > 0 && (
                        <div className="abonnement-billing-section" style={{ marginTop: '80px' }}>
                            <div className="section-title-wrap">
                                <h3>Historique de facturation</h3>
                                <p>Consultez et téléchargez vos factures passées.</p>
                            </div>
                            <div className="billing-table-container">
                                <table className="billing-table">
                                    <thead>
                                        <tr>
                                            <th>Facture</th>
                                            <th>Date</th>
                                            <th>Montant</th>
                                            <th>Statut</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map(pay => (
                                            <tr key={pay.id}>
                                                <td>
                                                    <div className="billing-inv-info">
                                                        <FileText size={16} />
                                                        <span>FACT-{pay.id.toString().padStart(5, '0')}</span>
                                                    </div>
                                                </td>
                                                <td>{new Date(pay.date_paiement || pay.created_at).toLocaleDateString('fr-FR')}</td>
                                                <td className="billing-amount">{pay.montant}€</td>
                                                <td>
                                                    <span className={`billing-status-badge ${pay.statut}`}>
                                                        {pay.statut === 'paye' ? 'Payée' : pay.statut}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className="billing-download-btn" onClick={() => handleDownloadInvoice(pay.id)}>
                                                        <Download size={16} /> PDF
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* ── Success Modal ──────────────────────── */}
            {showSuccessModal && (
                <div className="pay-modal-overlay">
                    <div className="pay-modal">
                        <div className="pay-modal-icon">
                            <CheckCircle size={56} />
                        </div>
                        <h2>Abonnement activé !</h2>
                        <p>Votre souscription a été traitée avec succès. Vous avez désormais accès à l'ensemble des fonctionnalités de votre espace professionnel.</p>
                        <button className="pay-modal-btn" onClick={() => setShowSuccessModal(false)}>
                            Accéder à mon tableau de bord
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Abonnement;
