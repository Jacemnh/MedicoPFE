import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Camera, Save, Lock, Calendar, Heart } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar';
import { useAlert } from '../../../context/AlertContext';
import { FileText, CreditCard, Plus } from 'lucide-react';
import NotificationsMenu from '../../../components/common/NotificationsMenu';
import '../Patient.css';
import './PatientProfil.css';

const PatientProfil = () => {
    const { user, checkAuth } = useAuth();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        date_naissance: '',
        photo: '',
        password: '',
        password_confirmation: '',
    });

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
        const fetchProfile = async () => {
            try {
                const res = await api.get('/profile');
                const u = res.data.data;
                setFormData(prev => ({
                    ...prev,
                    nom: u.nom || '',
                    prenom: u.prenom || '',
                    email: u.email || '',
                    telephone: u.telephone || '',
                    date_naissance: u.date_naissance
                        ? new Date(u.date_naissance).toISOString().split('T')[0]
                        : '',
                    photo: u.photo || '',
                }));
            } catch (err) {
                console.error('Erreur chargement profil', err);
            }
        };
        if (user) fetchProfile();
    }, [user]);

    const handleChange = e => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePhotoChange = e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFormData(prev => ({ ...prev, photo: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const payload = {
                nom: formData.nom,
                prenom: formData.prenom,
                email: formData.email,
                telephone: formData.telephone || null,
                date_naissance: formData.date_naissance || null,
            };

            if (formData.photo && formData.photo.startsWith('data:image')) {
                payload.photo = formData.photo;
            }
            if (formData.password) {
                payload.password = formData.password;
                payload.password_confirmation = formData.password_confirmation;
            }

            const res = await api.post('/profile', payload);
            if (res.data.success) {
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

    const getInitials = name => (name ? name[0].toUpperCase() : 'P');

    return (
        <div className="pp-layout">
            <Sidebar links={sidebarLinks} />
            
            <main className="pp-main">
                <div className="pp-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span className="pp-header-tag">Paramètres</span>
                        <h1 className="pp-header-title">Mon Profil</h1>
                        <p className="pp-header-sub">Gérez vos informations personnelles et vos préférences</p>
                    </div>

                    {/* Action Icons & Profile */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Link to="/patient/prendre-rendez-vous" title="Prendre RDV" className="notif-trigger-btn" style={{ textDecoration: 'none' }}>
                            <Plus size={22} />
                        </Link>

                        <Link to="/patient/dossier-medical" title="Mon dossier" className="notif-trigger-btn" style={{ textDecoration: 'none' }}>
                            <FileText size={22} />
                        </Link>

                        <NotificationsMenu />

                        <div style={{ width: '1px', height: '30px', background: '#cbd5e1', margin: '0 5px' }}></div>

                        <Link to="/patient/profil" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 9px', border: '1px solid #e2e8f0', borderRadius: '50px', textDecoration: 'none', cursor: 'pointer', background: '#ffffff', transition: 'all 0.2s' }}>
                            <User size={18} color="#334155" />
                            <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#0369a1' }}>
                                {user?.prenom} {user?.nom}
                            </span>
                        </Link>
                    </div>
                </div>

                <div className="pp-grid">
                    <div className="pp-card">
                        <h2 className="pp-card-title">
                            <User size={24} color="#8B5CF6" />
                            Informations personnelles
                        </h2>

                        <form onSubmit={handleSubmit} className="pp-form-grid">
                            <div className="pp-form-group full">
                                <div className="pp-avatar-wrapper">
                                    <div className="pp-avatar-box">
                                        {formData.photo && !formData.photo.startsWith('data:') ? (
                                            <img src={`http://localhost:8000${formData.photo}`} alt="Profile" />
                                        ) : formData.photo ? (
                                            <img src={formData.photo} alt="Profile" />
                                        ) : (
                                            <span>{getInitials(formData.prenom)}</span>
                                        )}
                                        <label htmlFor="photo-upload" className="pp-edit-photo-btn">
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
                                    <div className="pp-avatar-info">
                                        <h3>{formData.prenom || 'Nom'} {formData.nom || 'Prénom'}</h3>
                                        <p>Patient</p>
                                        <div className="pp-badge">
                                            <Heart size={16} />
                                            Dossier Actif
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pp-form-group">
                                <label className="pp-label"><User size={16} /> Nom</label>
                                <input className="pp-input" name="nom" value={formData.nom} onChange={handleChange} required />
                            </div>

                            <div className="pp-form-group">
                                <label className="pp-label"><User size={16} /> Prénom</label>
                                <input className="pp-input" name="prenom" value={formData.prenom} onChange={handleChange} required />
                            </div>

                            <div className="pp-form-group">
                                <label className="pp-label"><Mail size={16} /> Email</label>
                                <input className="pp-input" name="email" type="email" value={formData.email} onChange={handleChange} required />
                            </div>

                            <div className="pp-form-group">
                                <label className="pp-label"><Phone size={16} /> Téléphone</label>
                                <input className="pp-input" name="telephone" value={formData.telephone} onChange={handleChange} />
                            </div>

                            <div className="pp-form-group full">
                                <label className="pp-label"><Calendar size={16} /> Date de naissance</label>
                                <input className="pp-input" name="date_naissance" type="date" value={formData.date_naissance} onChange={handleChange} />
                            </div>

                            <div className="pp-divider">Sécurité</div>

                            <div className="pp-form-group">
                                <label className="pp-label"><Lock size={16} /> Nouveau mot de passe</label>
                                <input className="pp-input" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Optionnel" />
                            </div>

                            <div className="pp-form-group">
                                <label className="pp-label"><Lock size={16} /> Confirmer le mot de passe</label>
                                <input className="pp-input" name="password_confirmation" type="password" value={formData.password_confirmation} onChange={handleChange} placeholder="Optionnel" />
                            </div>

                            <button type="submit" className="pp-submit-btn" disabled={loading}>
                                <Save size={20} />
                                {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                        </form>
                    </div>

                    <div className="pp-card">
                        <h2 className="pp-card-title">Récapitulatif</h2>
                        <div className="pp-summary-list">
                            <div className="pp-summary-item">
                                <div className="pp-summary-icon">
                                    <User size={20} />
                                </div>
                                <div className="pp-summary-content">
                                    <span className="pp-summary-label">Nom complet</span>
                                    <span className="pp-summary-value">{formData.prenom} {formData.nom}</span>
                                </div>
                            </div>
                            
                            <div className="pp-summary-item">
                                <div className="pp-summary-icon">
                                    <Mail size={20} />
                                </div>
                                <div className="pp-summary-content">
                                    <span className="pp-summary-label">Email de contact</span>
                                    <span className="pp-summary-value">{formData.email}</span>
                                </div>
                            </div>

                            {formData.telephone && (
                                <div className="pp-summary-item">
                                    <div className="pp-summary-icon">
                                        <Phone size={20} />
                                    </div>
                                    <div className="pp-summary-content">
                                        <span className="pp-summary-label">Téléphone</span>
                                        <span className="pp-summary-value">{formData.telephone}</span>
                                    </div>
                                </div>
                            )}

                            {formData.date_naissance && (
                                <div className="pp-summary-item">
                                    <div className="pp-summary-icon">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="pp-summary-content">
                                        <span className="pp-summary-label">Date de naissance</span>
                                        <span className="pp-summary-value">{new Date(formData.date_naissance).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PatientProfil;
