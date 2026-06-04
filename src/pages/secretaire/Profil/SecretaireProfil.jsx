import { useState, useEffect } from 'react';
import {
    User, Mail, Phone, Camera, Save, Lock,
    Calendar, ClipboardList, KeyRound, MapPin,
    Activity, Users, Bell, Moon, Hospital, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar';
import NotificationsMenu from '../../../components/common/NotificationsMenu';
import { useAlert } from '../../../context/AlertContext';
import { Link } from 'react-router-dom';
import '../Secretaire.css';

const SecretaireProfil = () => {
    const { user, checkAuth } = useAuth();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [linkCode, setLinkCode] = useState('');
    const [linking, setLinking] = useState(false);
    const [verifiedProName, setVerifiedProName] = useState(null);
    const [verifyingCode, setVerifyingCode] = useState(false);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        photo: '',
        password: '',
        password_confirmation: '',
    });

    const sidebarLinks = [
        { path: '/secretaire/dashboard', label: 'Tableau de bord', icon: <Activity size={20} /> },
        { path: '/secretaire/rendez-vous', label: 'Gestion RDV', icon: <Calendar size={20} />, badge: '3', badgeVariant: 'warning' },
        { path: '/secretaire/patients', label: 'Gestion Patients', icon: <Users size={20} /> },
        { path: '/secretaire/cabinet', label: 'Mon Cabinet', icon: <Hospital size={20} /> },
        { path: '/secretaire/profil', label: 'Mon profil', icon: <User size={20} /> },
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
                    photo: u.photo || '',
                }));
            } catch (err) {
                console.error('Erreur chargement profil', err);
            }
        };
        if (user) fetchProfile();
    }, [user]);

    useEffect(() => {
        const verifyCode = async () => {
            if (linkCode.length < 5) {
                setVerifiedProName(null);
                return;
            }
            
            setVerifyingCode(true);
            try {
                // The endpoint is public but can also be used while authenticated
                const res = await api.post('/verify-professional-code', { code_professionnel: linkCode });
                if (res.data.valid) {
                    setVerifiedProName(res.data.professionnel_name);
                } else {
                    setVerifiedProName(null);
                }
            } catch (err) {
                setVerifiedProName(null);
            } finally {
                setVerifyingCode(false);
            }
        };

        const timeoutId = setTimeout(() => {
            verifyCode();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [linkCode]);

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

        try {
            const payload = {
                nom: formData.nom,
                prenom: formData.prenom,
                email: formData.email,
                telephone: formData.telephone || null,
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

    const handleLinkProfessional = async (e) => {
        e.preventDefault();
        if (!linkCode.trim()) return;
        setLinking(true);
        try {
            const res = await api.post('/profile/link-professional', { code_professionnel: linkCode });
            if (res.data.success) {
                showAlert({ title: 'Succès', message: res.data.message, type: 'success' });
                if (typeof checkAuth === 'function') await checkAuth();
                setLinkCode('');
            }
        } catch (err) {
            showAlert({ title: 'Erreur', message: err.response?.data?.message || 'Erreur de liaison', type: 'error' });
        } finally {
            setLinking(false);
        }
    };

    const getInitials = name => (name ? name[0].toUpperCase() : 'S');

    return (
        <div className="sec-layout">
            <Sidebar links={sidebarLinks} />
            <main className="sec-main">

                {/* ── Header ──────────────────────────────── */}
                <div className="sec-header">
                    <div>
                        <h1>Mon Profil</h1>
                        <p className="sec-subtitle">Gérez vos informations et votre sécurité</p>
                    </div>
                    <div className="pro-header-actions" style={{ gap: '5px', display: 'flex', alignItems: 'center' }}>
                        <Link to="/secretaire/rendez-vous" className="notif-trigger-btn" title="Agenda" style={{ textDecoration: 'none' }}>
                            <Calendar size={22} />
                        </Link>
                        <NotificationsMenu />
                        
                        <div style={{ width: '1px', height: '30px', background: '#cbd5e1', margin: '0 5px' }}></div>
                        
                        <Link to="/secretaire/profil" className="pro-user-info" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 9px', border: '1px solid #ffffffff', borderRadius: '50px', textDecoration: 'none', cursor: 'pointer', background: '#ffffff', transition: 'all 0.2s' }}>
                            <User size={18} color="#050505ff" />
                            <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#030303ff' }}>
                                {user?.nom}
                            </span>
                        </Link>
                    </div>
                </div>

                <div className="sec-content-grid">

                    {/* Left Column — Form */}
                    <div className="sec-left">
                        <div className="sec-section">
                            <div className="sec-profile-header">
                                <div className="sec-avatar-wrapper">
                                    {formData.photo && !formData.photo.startsWith('data:') ? (
                                        <img src={`http://localhost:8000${formData.photo}`} alt="Profile" className="sec-avatar-main" />
                                    ) : formData.photo ? (
                                        <img src={formData.photo} alt="Profile" className="sec-avatar-main" />
                                    ) : (
                                        <div className="sec-avatar-main">
                                            {getInitials(formData.prenom)}
                                        </div>
                                    )}
                                    <label htmlFor="photo-upload" className="sec-avatar-edit">
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
                                <div className="sec-profile-info-basic">
                                    <h2>{formData.prenom} {formData.nom}</h2>
                                    <p>Secrétaire médical(e)</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="sec-form-grid">
                                <div className="sec-input-group">
                                    <label><User size={16} /> Nom</label>
                                    <input name="nom" value={formData.nom} onChange={handleChange} required />
                                </div>
                                <div className="sec-input-group">
                                    <label><User size={16} /> Prénom</label>
                                    <input name="prenom" value={formData.prenom} onChange={handleChange} required />
                                </div>
                                <div className="sec-input-group">
                                    <label><Mail size={16} /> Email</label>
                                    <input name="email" type="email" value={formData.email} onChange={handleChange} required />
                                </div>
                                <div className="sec-input-group">
                                    <label><Phone size={16} /> Téléphone</label>
                                    <input name="telephone" value={formData.telephone} onChange={handleChange} />
                                </div>

                                <div className="sec-divider">Sécurité</div>

                                <div className="sec-input-group">
                                    <label><Lock size={16} /> Nouveau mot de passe</label>
                                    <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Laisser vide pour ne pas changer" />
                                </div>
                                <div className="sec-input-group">
                                    <label><Lock size={16} /> Confirmer le mot de passe</label>
                                    <input name="password_confirmation" type="password" value={formData.password_confirmation} onChange={handleChange} />
                                </div>

                                <div className="sec-full-width" style={{ marginTop: '10px' }}>
                                    <button type="submit" className="sec-btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                                        <Save size={18} />
                                        {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Column — Info Recaps */}
                    <div className="sec-right">
                        <div className="sec-section">
                            <div className="sec-section-header">
                                <h2>Informations Professionnelles</h2>
                            </div>

                            {user?.secretaire?.professionnel ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div className="sec-info-row">
                                        <Users size={20} />
                                        <div className="sec-info-content">
                                            <h4>Médecin rattaché</h4>
                                            <p>Dr. {user.secretaire.professionnel.user?.nom} {user.secretaire.professionnel.user?.prenom}</p>
                                        </div>
                                    </div>

                                    <div className="sec-info-row">
                                        <MapPin size={20} />
                                        <div className="sec-info-content">
                                            <h4>Cabinet Médical</h4>
                                            <p><strong>{user.secretaire.professionnel.cabinet?.nom}</strong></p>
                                            <p>{user.secretaire.professionnel.cabinet?.adresse}</p>
                                            <p>{user.secretaire.professionnel.cabinet?.ville}, France</p>
                                        </div>
                                    </div>

                                    <div className="sec-info-row">
                                        <Phone size={20} />
                                        <div className="sec-info-content">
                                            <h4>Contact Cabinet</h4>
                                            <p>{user.secretaire.professionnel.cabinet?.telephone || '—'}</p>
                                            <p>{user.secretaire.professionnel.cabinet?.email || '—'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="sec-divider" style={{ margin: '10px 0' }}></div>
                                </div>
                            ) : null}

                            {!user?.secretaire?.professionnel && (
                                <div className="sec-link-section" style={{ marginTop: '0' }}>
                                    <div className="sec-section-header" style={{ marginBottom: '1.5rem' }}>
                                        <h2 style={{ fontSize: '1.2rem' }}>Lier un professionnel</h2>
                                    </div>
                                    <form onSubmit={handleLinkProfessional} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div className="sec-input-group">
                                            <label><KeyRound size={16} /> Code de liaison</label>
                                            <input 
                                                type="text" 
                                                placeholder="Ex: MED-147Y" 
                                                value={linkCode}
                                                onChange={(e) => setLinkCode(e.target.value)}
                                                style={{ borderColor: verifiedProName ? '#10B981' : '' }}
                                                required
                                            />
                                        </div>
                                        {verifyingCode && <span style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '-5px' }}>Vérification...</span>}
                                        {verifiedProName && !verifyingCode && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontSize: '0.9rem', marginTop: '-10px', fontWeight: '600' }}>
                                                <CheckCircle size={16} />
                                                <span>Dr. {verifiedProName}</span>
                                            </div>
                                        )}
                                        <button 
                                            type="submit" 
                                            className="sec-btn-primary"
                                            disabled={linking || !linkCode.trim()}
                                            style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            <Hospital size={18} />
                                            {linking ? 'Liaison en cours...' : 'Activer la connexion'}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>

                        <div className="sec-section">
                            <div className="sec-section-header">
                                <h2>Aide & Support</h2>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', lineHeight: '1.5' }}>
                                Si vous rencontrez des difficultés pour modifier vos informations, veuillez contacter l'administrateur ou votre professionnel de santé.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SecretaireProfil;
