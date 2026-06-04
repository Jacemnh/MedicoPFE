import { useState, useEffect } from 'react';
import { 
    Users, UserPlus, PieChart as PieChartIcon,
    Bell, Moon, Search, Activity, Stethoscope, Menu, CircleDollarSign,
    Trash2, ShieldBan, ShieldCheck, Mail, Phone, Calendar, User, Tag
} from 'lucide-react';
import { 
    ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip 
} from 'recharts';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar';
import AdminHeader from '../../../components/admin/AdminHeader';
import { useAlert } from '../../../context/AlertContext';
import './AdminPatients.css';

const AdminPatients = () => {
    const { showAlert } = useAlert();
    const [stats, setStats] = useState(null);
    const [patients, setPatients] = useState([]);
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
                const [statsRes, patientsûres] = await Promise.all([
                    api.get('/admin/stats/patients'),
                    api.get('/admin/patients')
                ]);
                
                if (statsRes.data.success) {
                    setStats(statsRes.data.data);
                }
                
                if (patientsûres.data.success) {
                    setPatients(patientsûres.data.data);
                }
            } catch (err) {
                console.error('Error fetching data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleToggleBlock = async (id, isBlocked) => {
        try {
            const res = await api.put(`/admin/patients/${id}/toggle-block`);
            if (res.data.success) {
                setPatients(patients.map(p => p.id === id ? { ...p, is_blocked: !isBlocked } : p));
                showAlert({ 
                    title: isBlocked ? 'Compte débloqué' : 'Compte bloqué', 
                    message: `Le compte patient a été ${isBlocked ? 'débloqué' : 'bloqué'} avec succés.`, 
                    type: isBlocked ? 'success' : 'warning' 
                });
            }
        } catch (err) {
            console.error('Error toggling block status', err);
            showAlert({ title: 'Erreur', message: "Erreur lors de la mise é jour du statut.", type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        showAlert({
            title: 'Suppression définitive',
            message: 'éÊtes-vous sér de vouloir supprimer ce patient ? Cette action est irréversible.',
            type: 'error',
            showCancel: true,
            confirmText: 'supprimer définitivement',
            onConfirm: async () => {
                try {
                    const res = await api.delete(`/admin/patients/${id}`);
                    if (res.data.success) {
                        setPatients(patients.filter(p => p.id !== id));
                        showAlert({ title: 'Succés', message: 'Patient suppriméé de la base de données.', type: 'success' });
                    }
                } catch (err) {
                    console.error('Error deleting patient', err);
                    showAlert({ title: 'Erreur', message: "Erreur lors de la suppression du patient.", type: 'error' });
                }
            }
        });
    };

    const COLORS = ['#6366f1', '#ec4899', '#f59e0b'];

    const filteredPatients = patients.filter(p => {
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
                    title="Gestion des Patients" 
                    subtitle="Analyses démographiques et gestion des inscrits" 
                />

                <div className="admin-stats-grid">
                    <div className="admin-stat-card primary">
                        <div className="admin-stat-icon"><Activity size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>Patients Actifs</h3>
                            <p className="admin-stat-value">{patients.filter(p => !p.is_blocked).length}</p>
                            <span className="admin-stat-tag">Informations et Activitéés</span>
                        </div>
                    </div>
                    <div className="admin-stat-card success">
                        <div className="admin-stat-icon"><UserPlus size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>Nouveaux Inscrééits</h3>
                            <p className="admin-stat-value">{stats?.new_this_month || 0}</p>
                            <span className="admin-stat-tag">Inscriptions ce mois</span>
                        </div>
                    </div>
                    <div className="admin-stat-card indigo">
                        <div className="admin-stat-icon"><Users size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>Total Inscrééits</h3>
                            <p className="admin-stat-value">{patients.length}</p>
                            <span className="admin-stat-tag">Base de données globale</span>
                        </div>
                    </div>
                    <div className="admin-stat-card warning">
                        <div className="admin-stat-icon"><ShieldBan size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>Patients bloqués</h3>
                            <p className="admin-stat-value">{patients.filter(p => p.is_blocked).length}</p>
                            <span className="admin-stat-tag">Comptes suspendus</span>
                        </div>
                    </div>
                </div>

                <div className="admin-charts-grid" style={{ marginBottom: '2rem' }}>
                    <div className="admin-chart-card">
                        <div className="admin-chart-header">
                            <h2>Répartition par genre</h2>
                        </div>
                        <div className="admin-chart-body center">
                            {stats?.gender && stats.gender.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={stats.gender}
                                            innerRadius={70}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="count"
                                            nameKey="sexe"
                                        >
                                            {stats.gender.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p style={{ color: '#64748b' }}>Aucune donnée disponible</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="admin-chart-card">
                        <div className="admin-chart-header">
                            <h2>Note Informationnelle</h2>
                        </div>
                        <div className="admin-chart-body">
                            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                Cette section permet de suivre l'évolution de votre base patient. 
                                La liste ci-dessous vous permet de gérer individuellement chaque compte 
                                (blocage en cas d'abus, suppression si nécessaire).
                            </p>
                        </div>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>Liste des Patients</h2>
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
                            <div className="col-patient">PATIENT</div>
                            <div className="col-contact">CONTACT</div>
                            <div className="col-statut">STATUT</div>
                            <div className="col-date">INSCRIPTION</div>
                            <div className="col-actions text-right">ACTIONS</div>
                        </div>
                        
                        <div className="photo-list-body">
                            {filteredPatients.map(patient => {
                                const initials = (patient.prenom && patient.nom) 
                                    ? `${patient.prenom[0]}${patient.nom[0]}`.toUpperCase()
                                    : 'PA';
                                
                                return (
                                    <div key={patient.id} className={`photo-list-card ${patient.is_blocked ? 'blocked-card' : ''}`}>
                                        <div className="col-patient">
                                            <div className="photo-avatar">
                                                {patient.photo ? (
                                                    <img 
                                                        src={patient.photo.startsWith('http') ? patient.photo : `http://localhost:8000${patient.photo.startsWith('/') ? '' : (patient.photo.startsWith('storage') ? '/' : '/storage/')}${patient.photo}`} 
                                                        alt="avatar" 
                                                    />
                                                ) : (
                                                    <span>{initials}</span>
                                                )}
                                            </div>
                                            <div className="photo-user-info">
                                                <div className="photo-user-name">{patient.prenom} {patient.nom}</div>
                                                <div className="photo-user-id">PAT-{patient.id.toString().padStart(3, '0')}</div>
                                            </div>
                                        </div>
                                        <div className="col-contact">
                                            <div className="photo-info-line"><Mail size={14} /> {patient.email}</div>
                                            <div className="photo-info-line"><Phone size={14} /> {patient.telephone || 'Non renseignéé'}</div>
                                        </div>
                                        <div className="col-statut">
                                            <span className={`photo-status-badge ${patient.is_blocked ? 'status-blocked' : 'status-active'}`}>
                                                <span className="dot"></span> {patient.is_blocked ? 'bloqué' : 'Actif'}
                                            </span>
                                        </div>
                                        <div className="col-date">
                                            <div className="photo-info-line"><Calendar size={14} /> {new Date(patient.created_at).toLocaleDateString('fr-FR')}</div>
                                        </div>
                                        <div className="col-actions text-right">
                                            <div className="photo-actions-group">
                                                <button 
                                                    className={`photo-btn ${patient.is_blocked ? 'btn-unblock' : 'btn-block'}`}
                                                    onClick={() => handleToggleBlock(patient.id, patient.is_blocked)}
                                                    title={patient.is_blocked ? "Débloquéer le compte" : "bloquéer le compte"}
                                                >
                                                    {patient.is_blocked ? <ShieldCheck size={16} /> : <ShieldBan size={16} />}
                                                    <span>{patient.is_blocked ? 'Débloquéer' : 'bloquéer'}</span>
                                                </button>
                                                <button 
                                                    className="photo-btn btn-delete"
                                                    onClick={() => handleDelete(patient.id)}
                                                    title="supprimer le compte"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {filteredPatients.length === 0 && (
                                <div className="photo-empty-state">
                                    Aucun patient trouvé.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default AdminPatients;









