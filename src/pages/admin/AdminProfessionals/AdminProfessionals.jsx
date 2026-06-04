import { useState, useEffect } from 'react';
import { 
    Users, Stethoscope, Briefcase, Activity, 
    Menu, CircleDollarSign, Search, Trash2, ShieldBan, ShieldCheck, Mail, Phone, Calendar, Tag
, User } from 'lucide-react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar';
import AdminHeader from '../../../components/admin/AdminHeader';
import { useAlert } from '../../../context/AlertContext';
import './AdminProfessionals.css';

const AdminProfessionals = () => {
    const { showAlert } = useAlert();
    const [stats, setStats] = useState(null);
    const [professionals, setProfessionals] = useState([]);
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
                const [statsRes, prosûres] = await Promise.all([
                    api.get('/admin/stats/pros'),
                    api.get('/admin/professionals')
                ]);
                
                if (statsRes.data.success) {
                    setStats(statsRes.data.data);
                }
                
                if (prosûres.data.success) {
                    setProfessionals(prosûres.data.data);
                }
            } catch (err) {
                console.error('Error fetching pro stats or list', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleToggleBlock = async (id, isBlocked) => {
        try {
            const res = await api.put(`/admin/professionals/${id}/toggle-block`);
            if (res.data.success) {
                setProfessionals(professionals.map(p => p.id === id ? { ...p, is_blocked: !isBlocked } : p));
                showAlert({ 
                    title: isBlocked ? 'Compte débloqué' : 'Compte bloqué', 
                    message: `Le compte professionnel a été ${isBlocked ? 'débloqué' : 'bloqué'} avec succès.`, 
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
            message: 'Êtes-vous sûr de vouloir supprimer ce professionnel ? Cette action est irréversible.',
            type: 'error',
            showCancel: true,
            confirmText: 'supprimer définitivement',
            onConfirm: async () => {
                try {
                    const res = await api.delete(`/admin/professionals/${id}`);
                    if (res.data.success) {
                        setProfessionals(professionals.filter(p => p.id !== id));
                        showAlert({ title: 'Succès', message: 'Professionnel suppriméé.', type: 'success' });
                    }
                } catch (err) {
                    console.error('Error deleting professional', err);
                    showAlert({ title: 'Erreur', message: "Erreur lors de la suppression du professionnel.", type: 'error' });
                }
            }
        });
    };

    const filteredProfessionals = professionals.filter(p => {
        const term = searchQuery.toLowerCase();
        return (p.nom && p.nom.toLowerCase().includes(term)) || 
               (p.prenom && p.prenom.toLowerCase().includes(term)) || 
               (p.email && p.email.toLowerCase().includes(term));
    });

    if (loading) return <div className="admin-loading">Chargement...</div>;

    return (
        <div className="admin-layout">
            <Sidebar links={sidebarLinks} />
            
            <main className="admin-main">
                <AdminHeader 
                    title="Gestion des Professionnels" 
                    subtitle="Aperçu du réseau médical et des spécialités" 
                />

                <div className="admin-stats-grid">
                    <div className="admin-stat-card indigo">
                        <div className="admin-stat-icon"><Stethoscope size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>Professionnels Actifs</h3>
                            <p className="admin-stat-value">{professionals.filter(p => !p.is_blocked).length}</p>
                            <span className="admin-stat-tag">Informations et Activitéés</span>
                        </div>
                    </div>
                    <div className="admin-stat-card purple">
                        <div className="admin-stat-icon"><Briefcase size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>Spécialités</h3>
                            <p className="admin-stat-value">{stats?.specialty_count || 0}</p>
                            <span className="admin-stat-tag">Domaines médicaux couverts</span>
                        </div>
                    </div>
                    <div className="admin-stat-card primary">
                        <div className="admin-stat-icon"><Users size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>Total Praticiens</h3>
                            <p className="admin-stat-value">{professionals.length}</p>
                            <span className="admin-stat-tag">Base de données globale</span>
                        </div>
                    </div>
                    <div className="admin-stat-card warning">
                        <div className="admin-stat-icon"><ShieldBan size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>Comptes bloqués</h3>
                            <p className="admin-stat-value">{professionals.filter(p => p.is_blocked).length}</p>
                            <span className="admin-stat-tag">Nécessitant attention</span>
                        </div>
                    </div>
                </div>

                <div className="admin-section-info">
                    <div className="admin-chart-card">
                        <div className="admin-chart-header">
                            <h2>Expertise Médicale</h2>
                        </div>
                        <div className="admin-chart-body">
                            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                Le réseau Medico regroupe une variété de professionnels de santé. 
                                Cette section vous permet de monitorer la crééoissance de votre offre de soins 
                                et la diversité des spécialités disponibles, et de gérer individuellement leurs comptes ci-dessous.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>Liste des Professionnels</h2>
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
                            <div className="col-patient">PROFESSIONNEL</div>
                            <div className="col-contact">CONTACT & SPÉCIALITÉ</div>
                            <div className="col-statut">STATUT</div>
                            <div className="col-date">INSCRIPTION</div>
                            <div className="col-actions text-right">ACTIONS</div>
                        </div>
                        
                        <div className="photo-list-body">
                            {filteredProfessionals.map(pro => {
                                const initials = (pro.prenom && pro.nom) 
                                    ? `${pro.prenom[0]}${pro.nom[0]}`.toUpperCase()
                                    : 'PR';
                                
                                const proData = pro.professionnel || {};
                                const specialite = proData.specialite?.nom || 'Généraliste';
                                
                                return (
                                    <div key={pro.id} className={`photo-list-card ${pro.is_blocked ? 'blocked-card' : ''}`}>
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
                                                <div className="photo-user-id">{proData.code_professionnel || `PRO-${pro.id.toString().padStart(3, '0')}`}</div>
                                            </div>
                                        </div>
                                        <div className="col-contact">
                                            <div className="photo-info-line"><Briefcase size={14} style={{color:'#6366f1'}}/> {specialite}</div>
                                            <div className="photo-info-line"><Mail size={14} /> {pro.email}</div>
                                        </div>
                                        <div className="col-statut">
                                            <span className={`photo-status-badge ${pro.is_blocked ? 'status-blocked' : 'status-active'}`}>
                                                <span className="dot"></span> {pro.is_blocked ? 'bloqué' : 'Actif'}
                                            </span>
                                        </div>
                                        <div className="col-date">
                                            <div className="photo-info-line"><Calendar size={14} /> {new Date(pro.created_at).toLocaleDateString('fr-FR')}</div>
                                        </div>
                                        <div className="col-actions text-right">
                                            <div className="photo-actions-group">
                                                <button 
                                                    className={`photo-btn ${pro.is_blocked ? 'btn-unblock' : 'btn-block'}`}
                                                    onClick={() => handleToggleBlock(pro.id, pro.is_blocked)}
                                                    title={pro.is_blocked ? "Débloquéer le compte" : "bloquéer le compte"}
                                                >
                                                    {pro.is_blocked ? <ShieldCheck size={16} /> : <ShieldBan size={16} />}
                                                    <span>{pro.is_blocked ? 'Débloquéer' : 'bloquéer'}</span>
                                                </button>
                                                <button 
                                                    className="photo-btn btn-delete"
                                                    onClick={() => handleDelete(pro.id)}
                                                    title="supprimer le compte"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {filteredProfessionals.length === 0 && (
                                <div className="photo-empty-state">
                                    Aucun professionnel trouvé.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default AdminProfessionals;








