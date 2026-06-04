import { useState, useEffect } from 'react';
import { 
    Users, Stethoscope, Briefcase, Activity, 
    Menu, CircleDollarSign, UserCheck, Check, X, Mail, Phone, Calendar, Tag, Eye, MapPin, Building2, Clock, CheckCircle
, User } from 'lucide-react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar';
import AdminHeader from '../../../components/admin/AdminHeader';
import { useAlert } from '../../../context/AlertContext';
import './ValidationProfessionnels.css';

const ValidationProfessionnels = () => {
    const { showAlert } = useAlert();
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPro, setSelectedPro] = useState(null);
    const [showTrialModal, setShowTrialModal] = useState(false);
    const [proToAccept, setProToAccept] = useState(null);
    const [trialDays, setTrialDays] = useState(7);

    const sidebarLinks = [
        { path: '/admin/dashboard', label: 'Tableau de bord', icon: <Activity size={20} /> },
        { path: '/admin/patients', label: 'Gestion Patients', icon: <Users size={20} /> },
        { path: '/admin/professionals', label: 'Gestion Professionnels', icon: <Stethoscope size={20} /> },
        { path: '/admin/validation-professionnels', label: 'Acceptation Pros', icon: <UserCheck size={20} /> },
        { path: '/admin/secretaries', label: 'Gestion Secrétaires', icon: <Menu size={20} /> },
        { path: '/admin/finances', label: 'Finances', icon: <CircleDollarSign size={20} /> },
        { path: '/admin/subscriptions', label: 'Abonnements', icon: <Tag size={20} /> },
        { path: '/admin/profil', label: 'Mon Profil', icon: <User size={20} /> },
    ];

    useEffect(() => {
        fetchPendingProfessionals();
    }, []);

    const fetchPendingProfessionals = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/professionals/pending');
            if (res.data.success) {
                setProfessionals(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching pending professionals', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptClick = (pro) => {
        setProToAccept(pro);
        setTrialDays(7); // Default to 7 days
        setShowTrialModal(true);
    };

    const confirmAccept = async () => {
        if (!proToAccept) return;
        
        try {
            const res = await api.post(`/admin/professionals/${proToAccept.id}/accept`, { trial_days: trialDays === 'none' ? 0 : trialDays });
            if (res.data.success) {
                setProfessionals(professionals.filter(p => p.id !== proToAccept.id));
                showAlert({ title: 'Succès', message: 'Professionnel accepté avec succès.', type: 'success' });
                setShowTrialModal(false);
                setProToAccept(null);
                setSelectedPro(null); // Also close the details modal if it was open
            }
        } catch (err) {
            console.error('Error accepting professional', err);
            showAlert({ title: 'Erreur', message: "Erreur lors de l'acceptation.", type: 'error' });
        }
    };

    const handleReject = async (id) => {
        showAlert({
            title: 'Confirmation',
            message: 'Êtes-vous sûr de vouloir refuser ce professionnel ?',
            type: 'question',
            showCancel: true,
            onConfirm: async () => {
                try {
                    const res = await api.post(`/admin/professionals/${id}/reject`);
                    if (res.data.success) {
                        setProfessionals(professionals.filter(p => p.id !== id));
                        showAlert({ title: 'Refusé', message: 'Professionnel refusé.', type: 'warning' });
                    }
                } catch (err) {
                    console.error('Error rejecting professional', err);
                    showAlert({ title: 'Erreur', message: "Erreur lors du refus.", type: 'error' });
                }
            }
        });
    };

    if (loading) return <div className="admin-loading">Chargement...</div>;

    return (
        <div className="admin-layout">
            <Sidebar links={sidebarLinks} />
            
            <main className="admin-main">
                <AdminHeader 
                    title="Acceptation des Professionnels" 
                    subtitle="Validez ou refusez les nouvelles inscriptions de professionnels de santé" 
                />

                <div className="admin-card">
                    <div className="admin-card-header">
                        <h2>Professionnels en attente de validation</h2>
                    </div>
                    
                    <div className="photo-list-container">
                        <div className="photo-list-header">
                            <div className="col-patient">PROFESSIONNEL</div>
                            <div className="col-contact">CONTACT & SPÉCIALITÉ</div>
                            <div className="col-statut">CABINET</div>
                            <div className="col-date">INSCRIPTION</div>
                            <div className="col-actions text-right">ACTIONS</div>
                        </div>
                        
                        <div className="photo-list-body">
                            {professionals.map(pro => {
                                const initials = (pro.prenom && pro.nom) 
                                    ? `${pro.prenom[0]}${pro.nom[0]}`.toUpperCase()
                                    : 'PR';
                                
                                const proData = pro.professionnel || {};
                                const specialite = proData.specialite?.nom || 'Généraliste';
                                const cabinet = proData.cabinet?.nom || 'Non renseignéé';
                                
                                return (
                                    <div key={pro.id} className="photo-list-card">
                                        <div className="col-patient">
                                            <div className="photo-avatar">
                                                {pro.photo ? (
                                                    <img 
                                                        src={pro.photo.startsWith('http') ? pro.photo : `http://localhost:8000${pro.photo.startsWith('/') ? '' : (pro.photo.startsWith('storage') ? '/' : '/storage/')}${pro.photo}`} 
                                                        alt="avatar" 
                                                    />
                                                ) : (
                                                    <span>{initials}</span>
                                                )}
                                            </div>
                                            <div className="photo-user-info">
                                                <div className="photo-user-name">Dr. {pro.prenom} {pro.nom}</div>
                                                <div className="photo-user-id">{proData.code_professionnel || `PRO-${pro.id}`}</div>
                                            </div>
                                        </div>
                                        <div className="col-contact">
                                            <div className="photo-info-line"><Briefcase size={14} style={{color:'#6366f1'}}/> {specialite}</div>
                                            <div className="photo-info-line"><Mail size={14} /> {pro.email}</div>
                                        </div>
                                        <div className="col-statut">
                                            <div className="photo-info-line">{cabinet}</div>
                                        </div>
                                        <div className="col-date">
                                            <div className="photo-info-line"><Calendar size={14} /> {new Date(pro.created_at).toLocaleDateString('fr-FR')}</div>
                                        </div>
                                        <div className="col-actions text-right">
                                            <div className="photo-actions-group">
                                                <button 
                                                    className="photo-btn"
                                                    style={{ color: '#3B82F6', background: '#EFF6FF', borderColor: '#3B82F6' }}
                                                    onClick={() => setSelectedPro(pro)}
                                                    title="Voir détails"
                                                >
                                                    <Eye size={16} /> Détails
                                                </button>
                                                <button 
                                                    className="photo-btn"
                                                    style={{ color: '#10B981', background: '#ECFDF5', borderColor: '#10B981' }}
                                                    onClick={() => handleAcceptClick(pro)}
                                                    title="Accepter"
                                                >
                                                    <Check size={16} /> Accepter
                                                </button>
                                                <button 
                                                    className="photo-btn"
                                                    style={{ color: '#EF4444', background: '#FEF2F2', borderColor: '#EF4444' }}
                                                    onClick={() => handleReject(pro.id)}
                                                    title="Refuser"
                                                >
                                                    <X size={16} /> Refuser
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {professionals.length === 0 && (
                                <div className="photo-empty-state">
                                    Aucun professionnel en attente de validation.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal de détails */}
            {selectedPro && (
                <div className="pro-modal-overlay">
                    <div className="pro-modal-card">
                        <button 
                            onClick={() => setSelectedPro(null)}
                            style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                        >
                            <X size={24} />
                        </button>
                        
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                            Détails du professionnel
                        </h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Informations Personnelles</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><Users size={18} color="#6366f1" /> <span style={{fontSize: '0.95rem', color: '#374151'}}><strong>Nom:</strong> Dr. {selectedPro.prenom} {selectedPro.nom}</span></div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><Mail size={18} color="#6366f1" /> <span style={{fontSize: '0.95rem', color: '#374151'}}><strong>Email:</strong> {selectedPro.email}</span></div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><Calendar size={18} color="#6366f1" /> <span style={{fontSize: '0.95rem', color: '#374151'}}><strong>Date de naissance:</strong> {new Date(selectedPro.date_naissance).toLocaleDateString('fr-FR')}</span></div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><Stethoscope size={18} color="#6366f1" /> <span style={{fontSize: '0.95rem', color: '#374151'}}><strong>Spécialité:</strong> {selectedPro.professionnel?.specialite?.nom || 'Non spécifiée'}</span></div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Informations du Cabinet</h3>
                                {selectedPro.professionnel?.cabinet ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><Building2 size={18} color="#10b981" /> <span style={{fontSize: '0.95rem', color: '#374151'}}><strong>Nom:</strong> {selectedPro.professionnel.cabinet.nom}</span></div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><MapPin size={18} color="#10b981" /> <span style={{fontSize: '0.95rem', color: '#374151'}}><strong>Adresse:</strong> {selectedPro.professionnel.cabinet.adresse}<br/>{selectedPro.professionnel.cabinet.ville}</span></div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><Phone size={18} color="#10b981" /> <span style={{fontSize: '0.95rem', color: '#374151'}}><strong>Téléphone:</strong> {selectedPro.professionnel.cabinet.telephone || 'Non renseignéé'}</span></div>
                                        {selectedPro.professionnel.cabinet.email && (
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><Mail size={18} color="#10b981" /> <span style={{fontSize: '0.95rem', color: '#374151'}}><strong>Email pro:</strong> {selectedPro.professionnel.cabinet.email}</span></div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.95rem', color: '#6b7280', fontStyle: 'italic' }}>
                                        Aucun cabinet renseignéé (ex: Infirmier).
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section Diplôme */}
                        {selectedPro.professionnel?.diplome_path && (
                            <div style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Diplôme téléversé</h3>
                                {(() => {
                                    // Remplacer les antislash (Windows) par des slash normaux pour l'URL
                                    const path = selectedPro.professionnel.diplome_path.replace(/\\/g, '/');
                                    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
                                    const url = path.startsWith('http') ? path : `http://localhost:8000/${cleanPath.startsWith('storage') ? '' : 'storage/'}${cleanPath}`;
                                    
                                    return path.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', maxHeight: '300px' }}>
                                            <img 
                                                src={url}
                                                alt="Diplôme"
                                                style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain', maxHeight: '300px' }}
                                                onError={(e) => console.error("Erreur de chargement d'image:", url)}
                                            />
                                            <div style={{ fontSize: '10px', color: 'red', padding: '5px' }}>Debug URL: {url}</div>
                                        </div>
                                    ) : (
                                        <a 
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                                padding: '10px 20px', borderRadius: '10px',
                                                background: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE',
                                                textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
                                                transition: 'all 0.2s', cursor: 'pointer'
                                            }}
                                        >
                                            <Eye size={18} /> Ouvrir le diplôme (PDF/Autre)
                                        </a>
                                    );
                                })()}
                            </div>
                        )}

                        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button 
                                onClick={() => { handleReject(selectedPro.id); setSelectedPro(null); }}
                                style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}
                            >
                                <X size={16} /> Refuser
                            </button>
                            <button 
                                onClick={() => handleAcceptClick(selectedPro)}
                                style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#10B981', border: '1px solid #6EE7B7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}
                            >
                                <Check size={16} /> Accepter
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Trial Duration Modal */}
            {showTrialModal && proToAccept && (
                <div className="pro-modal-overlay" style={{ zIndex: 1100, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="pro-modal-card" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '20px', padding: '0', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        
                        <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', padding: '24px 30px', position: 'relative', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
                            <button 
                                onClick={() => { setShowTrialModal(false); setProToAccept(null); }}
                                style={{ position: 'absolute', top: '20px', right: '20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' }}
                                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#64748b'; }}
                            >
                                <X size={18} />


                                
                            </button>
                            
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <Clock size={24} />
                            </div>
                            
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
                                Paramétrer l'accès
                            </h2>
                            <p style={{ color: '#475569', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                                Définissez la période d'essai accordée au <strong>Dr. {proToAccept.nom}</strong>. Au-delà de ce délai, un abonnement sera exigé pour accéder à la plateforme.
                            </p>
                        </div>
                        
                        <div style={{ padding: '24px 30px', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { value: 1, label: '24 heures', desc: 'Essai très court pour découverte rapide' },
                                    { value: 3, label: '3 jours', desc: 'Durée standard pour tester les fonctionnalités' },
                                    { value: 7, label: '7 jours (Recommandé)', desc: 'Le temps idéal pour une immersion complète' },
                                    { value: 'none', label: 'Aucun essai', desc: 'Accès bloqué immédiatement (abonnement requis)' }
                                ].map((option) => (
                                    <label key={option.value} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '16px', 
                                        padding: '16px', 
                                        border: '2px solid',
                                        borderColor: trialDays === option.value ? '#6366f1' : '#e2e8f0', 
                                        borderRadius: '12px', 
                                        cursor: 'pointer', 
                                        background: trialDays === option.value ? '#eff6ff' : '#fff',
                                        transition: 'all 0.2s'
                                    }}>
                                        <input 
                                            type="radio" 
                                            name="trial_days" 
                                            value={option.value} 
                                            checked={trialDays === option.value} 
                                            onChange={() => setTrialDays(option.value)} 
                                            style={{ display: 'none' }} 
                                        />
                                        <div style={{ 
                                            width: '22px', height: '22px', borderRadius: '50%', border: '2px solid',
                                            borderColor: trialDays === option.value ? '#6366f1' : '#cbd5e1',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: trialDays === option.value ? '#6366f1' : 'transparent',
                                            transition: 'all 0.2s'
                                        }}>
                                            {trialDays === option.value && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: trialDays === option.value ? '#1e3a8a' : '#334155', fontSize: '1rem', marginBottom: '2px' }}>{option.label}</div>
                                            <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{option.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                                <button 
                                    onClick={() => { setShowTrialModal(false); setProToAccept(null); }}
                                    style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', transition: 'background 0.2s' }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                >
                                    annuler
                                </button>
                                <button 
                                    onClick={confirmAccept}
                                    style={{ flex: 2, padding: '12px', borderRadius: '10px', backgroundColor: '#10B981', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(16, 185, 129, 0.3)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.2)'; }}
                                >
                                    <CheckCircle size={20} /> Valider l'inscription
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ValidationProfessionnels;








