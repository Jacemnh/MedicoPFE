import React, { useState, useEffect } from 'react';
import {
    User, Mail, Phone, Camera, Save, Lock, MapPin,
    Building, Award, Hash, Bell, Moon, Activity,
    FileText, Users, Clock, Settings, Briefcase, Globe,
    Send, X, CheckCircle, Euro, CreditCard, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar';
import NotificationsMenu from '../../../components/common/NotificationsMenu';
import { useAlert } from '../../../context/AlertContext';
import '../Professionnel.css';

const ProfilSettings = () => {
    const { user, checkAuth } = useAuth();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [secretaryEmail, setSecretaryEmail] = useState('');
    const [isSendingCode, setIsSendingCode] = useState(false);

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        photo: '',
        password: '',
        password_confirmation: '',
        code_professionnel: '',
        specialite: '',
        cabinet: {
            nom: '',
            adresse: '',
            ville: '',
            pays: '',
            telephone: '',
            email: ''
        }
    });

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
        const fetchProfile = async () => {
            try {
                const res = await api.get('/pro/profile');
                const u = res.data.data;

                setFormData(prev => ({
                    ...prev,
                    nom: u.nom || '',
                    prenom: u.prenom || '',
                    email: u.email || '',
                    telephone: u.telephone || '',
                    photo: u.photo || '',
                    code_professionnel: u.professionnel?.code_professionnel || '',
                    specialite: u.professionnel?.specialite?.nom || '',
                    cabinet: {
                        nom: u.professionnel?.cabinet?.nom || '',
                        adresse: u.professionnel?.cabinet?.adresse || '',
                        ville: u.professionnel?.cabinet?.ville || '',
                        pays: u.professionnel?.cabinet?.pays || '',
                        telephone: u.professionnel?.cabinet?.telephone || '',
                        email: u.professionnel?.cabinet?.email || '',
                    }
                }));
            } catch (err) {
                console.error('Erreur chargement profil', err);
            }
        };
        if (user) fetchProfile();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('cabinet.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                cabinet: { ...prev.cabinet, [field]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFormData(prev => ({ ...prev, photo: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const getPhotoUrl = (photo) => {
        if (!photo) return null;
        if (photo.startsWith('data:')) return photo;
        if (photo.startsWith('http')) return photo;
        return `http://localhost:8000${photo}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                nom: formData.nom,
                prenom: formData.prenom,
                email: formData.email,
                telephone: formData.telephone || null,
                cabinet: {
                    nom: formData.cabinet.nom || undefined,
                    adresse: formData.cabinet.adresse || undefined,
                    ville: formData.cabinet.ville || undefined,
                    pays: formData.cabinet.pays || undefined,
                    telephone: formData.cabinet.telephone || undefined,
                    email: formData.cabinet.email || undefined,
                },
            };

            if (formData.photo && formData.photo.startsWith('data:image')) {
                payload.photo = formData.photo;
            }
            if (formData.password) {
                payload.password = formData.password;
                payload.password_confirmation = formData.password_confirmation;
            }

            const response = await api.post('/pro/profile', payload);
            if (response.data.success) {
                showAlert({ title: 'Succès', message: 'Profil mis à jour avec succès !', type: 'success' });
                if (typeof checkAuth === 'function') await checkAuth();
            }
        } catch (err) {
            if (err.response?.status === 422) {
                const errors = err.response.data.errors;
                const firstError = Object.values(errors)[0]?.[0] || 'Erreur de validation';
                showAlert({ title: 'Erreur', message: firstError, type: 'error' });
            } else {
                showAlert({ title: 'Erreur', message: err.response?.data?.message || 'Une erreur est survenue', type: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    const getInitials = () => {
        if (formData.prenom && formData.nom) {
            return (formData.prenom[0] + formData.nom[0]).toUpperCase();
        }
        return 'DR';
    };

    const handleSendCode = async (e) => {
        e.preventDefault();
        if (!secretaryEmail) return;
        
        setIsSendingCode(true);
        try {
            const response = await api.post('/pro/profile/send-code', { email: secretaryEmail });
            if (response.data.success) {
                showAlert({ title: 'Code envoyé !', message: response.data.message, type: 'success' });
            }
        } catch (err) {
            showAlert({ title: 'Erreur', message: err.response?.data?.message || 'Erreur lors de l\'envoi de l\'email', type: 'error' });
        } finally {
            setIsSendingCode(false);
            setShowCodeModal(false);
            setSecretaryEmail('');
        }
    };

    return (
        <div className="pro-container">
            <Sidebar links={sidebarLinks} />
            <main className="pro-main-content">

                {/* ── Header ──────────────────────────────── */}
                <div className="pro-top-header">
                    <div>
                        <h1>Mon Profil</h1>
                        <p className="pro-subtitle-text">Gérez vos informations professionnelles et personnelles</p>
                    </div>
                    <div className="pro-header-actions" style={{ gap: '5px', display: 'flex', alignItems: 'center' }}>
                        <Link to="/professionnel/creneaux" className="notif-trigger-btn" title="Agenda" style={{ textDecoration: 'none' }}>
                            <Calendar size={22} />
                        </Link>

                        <NotificationsMenu />
                        
                        <div style={{ width: '1px', height: '30px', background: '#cbd5e1', margin: '0 5px' }}></div>
                        
                        <Link to="/professionnel/profil" className="pro-user-info" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 9px', border: '1px solid #ffffffff', borderRadius: '50px', textDecoration: 'none', cursor: 'pointer', background: '#ffffff', transition: 'all 0.2s' }}>
                            <User size={18} color="#050505ff" />
                            <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#030303ff' }}>
                                Dr. {user?.nom}
                            </span>
                        </Link>
                    </div>
                </div>

                <div className="pro-main-grid">

                    {/* Left Column — Forms */}
                    <div className="pro-left-col">
                        <div className="pro-box">
                            <div className="pro-profile-header">
                                <div className="pro-avatar-wrapper">
                                    {formData.photo ? (
                                        <img src={getPhotoUrl(formData.photo)} alt="Profile" className="pro-avatar-main" />
                                    ) : (
                                        <div className="pro-avatar-main">{getInitials()}</div>
                                    )}
                                    <label htmlFor="photo-upload" className="pro-avatar-edit">
                                        <Camera size={18} />
                                        <input
                                            id="photo-upload"
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={handlePhotoChange}
                                        />
                                    </label>
                                </div>
                                <div className="pro-profile-info-basic">
                                    <h2>Dr. {formData.prenom} {formData.nom}</h2>
                                    <p><Award size={16} /> {formData.specialite || 'Spécialité non renseignée'}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Hash size={16} /> Code : {formData.code_professionnel || '—'}
                                        </p>
                                        {formData.code_professionnel && (
                                            <button 
                                                type="button"
                                                onClick={() => setShowCodeModal(true)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    background: '#eef2ff', color: '#4f46e5',
                                                    border: 'none', borderRadius: '6px',
                                                    padding: '4px 10px', fontSize: '0.8rem',
                                                    fontWeight: '600', cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseOver={e => e.currentTarget.style.background = '#e0e7ff'}
                                                onMouseOut={e => e.currentTarget.style.background = '#eef2ff'}
                                            >
                                                <span>Envoyer code</span>
                                                <Send size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="pro-form-grid">
                                <div className="pro-divider">Informations Personnelles</div>

                                <div className="pro-input-group">
                                    <label><User size={16} /> Nom</label>
                                    <input name="nom" value={formData.nom} onChange={handleChange} required />
                                </div>
                                <div className="pro-input-group">
                                    <label><User size={16} /> Prénom</label>
                                    <input name="prenom" value={formData.prenom} onChange={handleChange} required />
                                </div>
                                <div className="pro-input-group">
                                    <label><Mail size={16} /> Email</label>
                                    <input name="email" type="email" value={formData.email} onChange={handleChange} required />
                                </div>
                                <div className="pro-input-group">
                                    <label><Phone size={16} /> Téléphone</label>
                                    <input name="telephone" value={formData.telephone} onChange={handleChange} />
                                </div>

                                <div className="pro-divider">Informations du Cabinet</div>

                                <div className="pro-input-group pro-full-width">
                                    <label><Building size={16} /> Nom du cabinet</label>
                                    <input name="cabinet.nom" value={formData.cabinet.nom} onChange={handleChange} />
                                </div>
                                <div className="pro-input-group pro-full-width">
                                    <label><MapPin size={16} /> Adresse</label>
                                    <input name="cabinet.adresse" value={formData.cabinet.adresse} onChange={handleChange} />
                                </div>
                                <div className="pro-input-group">
                                    <label><MapPin size={16} /> Ville</label>
                                    <input name="cabinet.ville" value={formData.cabinet.ville} onChange={handleChange} />
                                </div>
                                <div className="pro-input-group">
                                    <label><Globe size={16} /> Pays</label>
                                    <input name="cabinet.pays" value={formData.cabinet.pays} onChange={handleChange} />
                                </div>
                                <div className="pro-input-group">
                                    <label><Phone size={16} /> Téléphone Cabinet</label>
                                    <input name="cabinet.telephone" value={formData.cabinet.telephone} onChange={handleChange} />
                                </div>
                                <div className="pro-input-group">
                                    <label><Mail size={16} /> Email Cabinet</label>
                                    <input name="cabinet.email" type="email" value={formData.cabinet.email} onChange={handleChange} />
                                </div>

                                <div className="pro-divider">Sécurité</div>

                                <div className="pro-input-group">
                                    <label><Lock size={16} /> Nouveau mot de passe</label>
                                    <input
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Laisser vide pour ne pas changer"
                                    />
                                </div>
                                <div className="pro-input-group">
                                    <label><Lock size={16} /> Confirmer le mot de passe</label>
                                    <input
                                        name="password_confirmation"
                                        type="password"
                                        value={formData.password_confirmation}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="pro-full-width" style={{ marginTop: '15px' }}>
                                    <button type="submit" className="pro-btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                                        <Save size={18} />
                                        {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Column — Info Cards */}
                    <div className="pro-right-col">
                        <div className="pro-box">
                            <div className="pro-section-header">
                                <h2>Récapitulatif Cabinet</h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div className="pro-info-row">
                                    <Building size={20} />
                                    <div className="pro-info-content">
                                        <h4>{formData.cabinet.nom || 'Cabinet non renseigné'}</h4>
                                        <p>{formData.cabinet.adresse || '—'}</p>
                                        <p>{formData.cabinet.ville || '—'}{formData.cabinet.pays ? `, ${formData.cabinet.pays}` : ''}</p>
                                    </div>
                                </div>

                                <div className="pro-info-row">
                                    <Phone size={20} />
                                    <div className="pro-info-content">
                                        <h4>Contact</h4>
                                        <p>{formData.cabinet.telephone || '—'}</p>
                                        <p>{formData.cabinet.email || '—'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pro-box">
                            <div className="pro-section-header">
                                <h2>Paramètres rapides</h2>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', lineHeight: '1.5' }}>
                                Votre code professionnel est requis pour que votre secrétaire puisse créer son compte et se lier à votre cabinet.
                                Ne partagez ce code qu'avec votre personnel de confiance.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal d'envoi de code */}
            {showCodeModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem'
                }}>
                    <div style={{
                        background: 'white', width: '100%', maxWidth: '400px', borderRadius: '16px',
                        padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', position: 'relative'
                    }}>
                        <button 
                            onClick={() => setShowCodeModal(false)}
                            style={{
                                position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none',
                                color: '#9ca3af', cursor: 'pointer', padding: '0.25rem'
                            }}
                        >
                            <X size={20} />
                        </button>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
                            Envoyer votre code
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            Saisissez l'adresse email de votre secrétaire. Un email pré-rempli s'ouvrira avec votre code <strong>{formData.code_professionnel}</strong>.
                        </p>
                        
                        <form onSubmit={handleSendCode}>
                            <div className="pro-input-group" style={{ marginBottom: '1.5rem' }}>
                                <label><Mail size={16} /> Email de la secrétaire</label>
                                <input 
                                    type="email" 
                                    value={secretaryEmail} 
                                    onChange={(e) => setSecretaryEmail(e.target.value)} 
                                    placeholder="secretaire@exemple.com"
                                    required 
                                    autoFocus
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    type="button" 
                                    className="pro-btn-secondary" 
                                    style={{ flex: 1, padding: '0.75rem', border: '1px solid #e5e7eb', background: '#f9fafb', borderRadius: '8px', cursor: 'pointer', color: '#374151', fontWeight: '600' }}
                                    onClick={() => setShowCodeModal(false)}
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSendingCode}
                                    style={{ flex: 1, padding: '0.75rem', border: 'none', background: isSendingCode ? '#9ca3af' : '#4f46e5', color: 'white', borderRadius: '8px', cursor: isSendingCode ? 'not-allowed' : 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}
                                >
                                    {isSendingCode ? <Activity size={16} className="pro-spinner" /> : <Send size={16} />} 
                                    {isSendingCode ? 'Envoi...' : 'Envoyer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            
        </div>
    );
};

export default ProfilSettings;
