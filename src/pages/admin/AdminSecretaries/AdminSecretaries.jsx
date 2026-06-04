import { useState, useEffect } from 'react';
import { 
    Users, Menu, Activity, Stethoscope, 
    CircleDollarSign, User, Search, Trash2, ShieldBan, ShieldCheck, Mail, Phone, Calendar, Hospital, Tag
} from 'lucide-react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar';
import AdminHeader from '../../../components/admin/AdminHeader';
import { useAlert } from '../../../context/AlertContext';
import './AdminSecretaries.css';

const AdminSecretaries = () => {
    const { showAlert } = useAlert();
    const [stats, setStats] = useState(null);
    const [secretaries, setSecretaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, secsRes] = await Promise.all([
                    api.get('/admin/stats/secretaries'),
                    api.get('/admin/secretaries')
                ]);
                
                if (statsRes.data.success) {
                    setStats(statsRes.data.data);
                }
                
                if (secsRes.data.success) {
                    setSecretaries(secsRes.data.data);
                }
            } catch (err) {
                console.error('Error fetching secrééetary stats or list', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleToggleBlock = async (id, isBlocked) => {
        try {
            const res = await api.put(`/admin/secretaries/${id}/toggle-block`);
            if (res.data.success) {
                setSecretaries(secretaries.map(s => s.id === id ? { ...s, is_blocked: !isBlocked } : s));
                showAlert({ 
                    title: isBlocked ? 'Compte débloqué' : 'Compte bloqué', 
                    message: `Le compte a été ${isBlocked ? 'débloqué' : 'bloqué'} avec succès.`, 
                    type: isBlocked ? 'success' : 'warning' 
                });
            }
        } catch (err) {
            console.error('Error toggling block status', err);
            showAlert({ title: 'Erreur', message: "Erreur lors de la mise à jour du statut.", type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        showAlert({
            title: 'Suppression définitive',
            message: "Êtes-vous sûr de vouloir supprimer cette secrééétaire ? Cette action est irréversible.",
            type: 'error',
            showCancel: true,
            confirmText: 'supprimer définitivement',
            onConfirm: async () => {
                try {
                    const res = await api.delete(`/admin/secretaries/${id}`);
                    if (res.data.success) {
                        setSecretaries(secretaries.filter(s => s.id !== id));
                        showAlert({ title: 'Succès', message: "La secrééétaire a été supprimée.", type: 'success' });
                    }
                } catch (err) {
                    console.error('Error deleting secrééetary', err);
                    showAlert({ title: 'Erreur', message: "Erreur lors de la suppression du compte.", type: 'error' });
                }
            }
        });
    };

    const filteredSecretaries = secretaries.filter(s => {
        const term = searchQuery.toLowerCase();
        return (s.nom && s.nom.toLowerCase().includes(term)) || 
               (s.prenom && s.prenom.toLowerCase().includes(term)) || 
               (s.email && s.email.toLowerCase().includes(term));
    });

    if (loading) return <div className="admin-loading">Chargement...</div>;

    return (
        <div className="admin-layout">
            <Sidebar links={sidebarLinks} />
            
            <main className="admin-main">
                <AdminHeader 
                    title="Gestion des Secrétaires" 
                    subtitle="Suivi de l'équipe administrative et support" 
                />

                <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="admin-stat-card primary">
                        <div className="admin-stat-icon"><User size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>Profils Enregistrés</h3>
                            <p className="admin-stat-value">{secretaries.length}</p>
                            <span className="admin-stat-tag">Informations personnelles</span>
                        </div>
                    </div>
                    <div className="admin-stat-card success">
                        <div className="admin-stat-icon"><Activity size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>Secrétaires Actives</h3>
                            <p className="admin-stat-value">{secretaries.filter(s => !s.is_blocked).length}</p>
                            <span className="admin-stat-tag">Activitéés régulières</span>
                        </div>
                    </div>
                    <div className="admin-stat-card purple">
                        <div className="admin-stat-icon"><Hospital size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>Rattachement Médical</h3>
                            <p className="admin-stat-value">{secretaries.filter(s => s.secretaire?.professionnel).length}</p>
                            <span className="admin-stat-tag">Suivi administratif</span>
                        </div>
                    </div>
                </div>

                <div className="admin-section-info">
                    <div className="admin-chart-card">
                        <div className="admin-chart-header">
                            <h2>Support Administratif</h2>
                        </div>
                        <div className="admin-chart-body">
                            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                Les secrétaires jouent un rôle clé dans la gestion des cabinets et la coordination 
                                avec les patients. Gérez les accès et les statuts des comptes administratifs 
                                via la liste ci-dessous.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>Liste des Secrétaires</h2>
                        <div className="admin-search-box">
                            <Search size={18} className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Rechercher par nom, email..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="photo-list-container">
                        <div className="photo-list-header">
                            <div className="col-patient">SEcrééÉTAIRE</div>
                            <div className="col-contact">CONTACT & RATTACHEMENT</div>
                            <div className="col-statut">STATUT</div>
                            <div className="col-date">INSCRIPTION</div>
                            <div className="col-actions text-right">ACTIONS</div>
                        </div>
                        
                        <div className="photo-list-body">
                            {filteredSecretaries.map(sec => {
                                const initials = (sec.prenom && sec.nom) 
                                    ? `${sec.prenom[0]}${sec.nom[0]}`.toUpperCase()
                                    : 'SC';
                                
                                const pro = sec.secretaire?.professionnel?.user;
                                const doctorName = pro ? `Dr. ${pro.nom} ${pro.prenom}` : 'Aucun médecin';

                                return (
                                    <div key={sec.id} className={`photo-list-card ${sec.is_blocked ? 'blocked-card' : ''}`}>
                                        <div className="col-patient">
                                            <div className="photo-avatar">
                                                {sec.photo ? (
                                                    <img 
                                                        src={sec.photo.startsWith('http') ? sec.photo : `http://localhost:8000${sec.photo.startsWith('/') ? '' : (sec.photo.startsWith('storage') ? '/' : '/storage/')}${sec.photo}`} 
                                                        alt="avatar" 
                                                    />
                                                ) : (
                                                    <span>{initials}</span>
                                                )}
                                            </div>
                                            <div className="photo-user-info">
                                                <div className="photo-user-name">{sec.prenom} {sec.nom}</div>
                                                <div className="photo-user-id">SEC-{sec.id.toString().padStart(3, '0')}</div>
                                            </div>
                                        </div>
                                        <div className="col-contact">
                                            <div className="photo-info-line"><Hospital size={14} style={{color:'#10b981'}}/> {doctorName}</div>
                                            <div className="photo-info-line"><Mail size={14} /> {sec.email}</div>
                                        </div>
                                        <div className="col-statut">
                                            <span className={`photo-status-badge ${sec.is_blocked ? 'status-blocked' : 'status-active'}`}>
                                                <span className="dot"></span> {sec.is_blocked ? 'bloqué' : 'Actif'}
                                            </span>
                                        </div>
                                        <div className="col-date">
                                            <div className="photo-info-line"><Calendar size={14} /> {new Date(sec.created_at).toLocaleDateString('fr-FR')}</div>
                                        </div>
                                        <div className="col-actions text-right">
                                            <div className="photo-actions-group">
                                                <button 
                                                    className={`photo-btn ${sec.is_blocked ? 'btn-unblock' : 'btn-block'}`}
                                                    onClick={() => handleToggleBlock(sec.id, sec.is_blocked)}
                                                    title={sec.is_blocked ? "Débloquéer le compte" : "bloquéer le compte"}
                                                >
                                                    {sec.is_blocked ? <ShieldCheck size={16} /> : <ShieldBan size={16} />}
                                                    <span>{sec.is_blocked ? 'Débloquéer' : 'bloquéer'}</span>
                                                </button>
                                                <button 
                                                    className="photo-btn btn-delete"
                                                    onClick={() => handleDelete(sec.id)}
                                                    title="supprimer le compte"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {filteredSecretaries.length === 0 && (
                                <div className="photo-empty-state">
                                    Aucune secrééétaire trouvée.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default AdminSecretaries;








