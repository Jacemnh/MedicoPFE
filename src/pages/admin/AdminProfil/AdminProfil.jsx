import { useState, useEffect, useRef } from 'react';
import { 
    User, Mail, Activity, Users, Stethoscope, ShieldCheck, Menu, CircleDollarSign, Tag,
    Camera, Save, Lock, Edit3, CheckCircle, X
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useAlert } from '../../../context/AlertContext';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar';
import AdminHeader from '../../../components/admin/AdminHeader';
import './AdminProfil.css';

const AdminProfil = () => {
    const { user, checkAuth } = useAuth();
    const { showAlert } = useAlert();
    const fileInputRef = useRef(null);
    
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('infos'); // 'infos' or 'security'
    
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
    });
    
    const [passwordData, setPasswordData] = useState({
        password: '',
        password_confirmation: ''
    });
    
    const [photoPreview, setPhotoPreview] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                nom: user.nom || '',
                prenom: user.prenom || '',
                email: user.email || '',
                telephone: user.telephone || '',
            });
            if (user.photo) {
                setPhotoPreview(user.photo.startsWith('http') ? user.photo : `http://localhost:8000${user.photo.startsWith('/') ? '' : (user.photo.startsWith('storage') ? '/' : '/storage/')}${user.photo}`);
            }
        }
    }, [user]);

    const sidebarLinks = [
        { path: '/admin/dashboard', label: 'Tableau de bord', icon: <Activity size={20} /> },
        { path: '/admin/patients', label: 'Gestion Patients', icon: <Users size={20} /> },
        { path: '/admin/professionals', label: 'Gestion Professionnels', icon: <Stethoscope size={20} /> },
        { path: '/admin/validation-professionnels', label: 'Acceptation Pros', icon: <ShieldCheck size={20} /> },
        { path: '/admin/secretaries', label: 'Gestion Secrétaires', icon: <Menu size={20} /> },
        { path: '/admin/finances', label: 'Finances', icon: <CircleDollarSign size={20} /> },
        { path: '/admin/subscriptions', label: 'Abonnements', icon: <Tag size={20} /> },
        { path: '/admin/profil', label: 'Mon Profil', icon: <User size={20} /> },
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (activeTab === 'infos') {
            setFormData(prev => ({ ...prev, [name]: value }));
        } else {
            setPasswordData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = activeTab === 'infos' ? { ...formData } : { ...passwordData };
            
            // Only attach photo if it was updated (base64)
            if (photoPreview && photoPreview.startsWith('data:image')) {
                payload.photo = photoPreview;
            }

            const res = await api.post('/profile', payload);
            
            if (res.data.success) {
                await checkAuth(); // Reload user data globally
                showAlert({
                    title: 'Succès',
                    message: 'Vos informations ont été mises à jour avec succès.',
                    type: 'success'
                });
                
                if (activeTab === 'security') {
                    setPasswordData({ password: '', password_confirmation: '' });
                }
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            showAlert({
                title: 'Erreur',
                message: err.response?.data?.message || 'Une erreur est survenue lors de la mise à jour.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-layout">
            <Sidebar links={sidebarLinks} />
            
            <main className="admin-main">
                <AdminHeader 
                    title="Mon Profil Administrateur" 
                    subtitle="Gérez vos informations personnelles et paramètres de sécurité" 
                />

                <div className="admin-profil-container">
                    {/* Left Column: Avatar & Summary */}
                    <div className="admin-profil-sidebar">
                        <div className="admin-profil-avatar-section">
                            <div className="avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Profil" className="avatar-image" />
                                ) : (
                                    <div className="avatar-placeholder">
                                        <User size={48} color="#94a3b8" />
                                    </div>
                                )}
                                <div className="avatar-overlay">
                                    <Camera size={24} color="#fff" />
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handlePhotoChange} 
                                    accept="image/*" 
                                    style={{ display: 'none' }} 
                                />
                            </div>
                            <h2 className="admin-profil-name">{user?.nom} {user?.prenom}</h2>
                            <span className="admin-profil-role">Administrateur</span>
                            
                            <div className="admin-profil-quick-info">
                                <div className="quick-info-item">
                                    <Mail size={16} />
                                    <span>{user?.email}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="admin-profil-nav">
                            <button 
                                className={`profil-nav-btn ${activeTab === 'infos' ? 'active' : ''}`}
                                onClick={() => setActiveTab('infos')}
                            >
                                <Edit3 size={18} /> Informations personnelles
                            </button>
                            <button 
                                className={`profil-nav-btn ${activeTab === 'security' ? 'active' : ''}`}
                                onClick={() => setActiveTab('security')}
                            >
                                <Lock size={18} /> Mot de passe
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Edit Forms */}
                    <div className="admin-profil-content">
                        <div className="admin-profil-card">
                            <div className="admin-profil-card-header">
                                <h2>{activeTab === 'infos' ? 'Informations Personnelles' : 'Sécurité & Mot de passe'}</h2>
                                <p>{activeTab === 'infos' 
                                    ? 'Mettez à jour vos coordonnées et détails personnels.' 
                                    : 'Assurez-vous d\'utiliser un mot de passe long et sécurisé.'}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="admin-profil-form">
                                {activeTab === 'infos' ? (
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Nom</label>
                                            <input 
                                                type="text" 
                                                name="nom" 
                                                value={formData.nom} 
                                                onChange={handleInputChange} 
                                                required 
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Prénom</label>
                                            <input 
                                                type="text" 
                                                name="prenom" 
                                                value={formData.prenom} 
                                                onChange={handleInputChange} 
                                                required 
                                            />
                                        </div>
                                        <div className="form-group full-width">
                                            <label>Adresse Email</label>
                                            <div className="input-with-icon">
                                                <Mail size={18} className="input-icon" />
                                                <input 
                                                    type="email" 
                                                    name="email" 
                                                    value={formData.email} 
                                                    onChange={handleInputChange} 
                                                    required 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="form-grid">
                                        <div className="form-group full-width">
                                            <label>Nouveau mot de passe</label>
                                            <div className="input-with-icon">
                                                <Lock size={18} className="input-icon" />
                                                <input 
                                                    type="password" 
                                                    name="password" 
                                                    value={passwordData.password} 
                                                    onChange={handleInputChange} 
                                                    placeholder="Au moins 8 caractères"
                                                    required 
                                                    minLength="8"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group full-width">
                                            <label>Confirmer le mot de passe</label>
                                            <div className="input-with-icon">
                                                <CheckCircle size={18} className="input-icon" />
                                                <input 
                                                    type="password" 
                                                    name="password_confirmation" 
                                                    value={passwordData.password_confirmation} 
                                                    onChange={handleInputChange} 
                                                    placeholder="Répétez le mot de passe"
                                                    required 
                                                    minLength="8"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="form-actions">
                                    <button type="submit" className="btn-save" disabled={loading}>
                                        {loading ? (
                                            <span className="loader-text">Enregistrement...</span>
                                        ) : (
                                            <>
                                                <Save size={18} /> Enregistrer les modifications
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminProfil;
