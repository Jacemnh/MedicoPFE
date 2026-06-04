import { useState, useEffect } from 'react';
import Sidebar from '../../../components/common/Sidebar';
import { Users, Trash2, Search, Plus, Activity, FileText, Clock, Briefcase, Settings, Euro, CreditCard } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import { useAlert } from '../../../context/AlertContext';
import './SecretairesList.css';

const SecretairesList = () => {
    const { user } = useAuth();
    const { showAlert } = useAlert();
    const [secretaires, setSecretaires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchSecretaires();
    }, []);

    const fetchSecretaires = async () => {
        try {
            setLoading(true);
            const res = await api.get('/pro/secretaires');
            if (res.data.success) {
                setSecretaires(res.data.data);
            }
        } catch (err) {
            console.error('Erreur récupération secrétaires:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (id, nom) => {
        showAlert({
            title: 'Retirer une secrétaire',
            message: `Êtes-vous sûr de vouloir retirer ${nom} de votre cabinet ?`,
            type: 'warning',
            showCancel: true,
            onConfirm: async () => {
                try {
                    const res = await api.delete(`/pro/secretaires/${id}`);
                    if (res.data.success) {
                        setSecretaires(prev => prev.filter(s => s.id !== id));
                        showAlert({ title: 'Succès', message: 'Secrétaire retirée avec succès.', type: 'success' });
                    }
                } catch (err) {
                    console.error('Erreur suppression:', err);
                    showAlert({ title: 'Erreur', message: 'Erreur lors de la suppression.', type: 'error' });
                }
            }
        });
    };

    const filteredSecretaires = secretaires.filter(s =>
        `${s.nom} ${s.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    return (
        <div className="pro-container">
            <Sidebar links={sidebarLinks} />

            <main className="pro-main-content">
                <div className="pro-top-header">
                    <div>
                        <h1>Mes secrétaires</h1>
                        <p className="pro-subtitle-text">Gérez les accès de vos secrétaires</p>
                    </div>
                    <div className="pro-header-actions">
                        <button className="pro-btn-primary" onClick={() => showAlert({
                            title: 'Code de rattachement',
                            message: `Votre code est : ${user?.professionnel?.code_professionnel || 'Non défini'}\n\nCommuniquez ce code à votre secrétaire pour qu'elle puisse s'inscrire et se lier à votre cabinet.`,
                            type: 'info'
                        })}>
                            <Plus size={20} style={{ marginRight: '8px' }} />
                            Ajouter une secrétaire
                        </button>
                    </div>
                </div>

                <div className="pro-box pro-box-large">
                    <div className="pro-box-header">
                        <div className="pro-search-container">
                            <Search className="pro-search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Rechercher une secrétaire..."
                                className="pro-search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                    </div>

                    <div className="pro-table-wrapper">
                        <table className="pro-table">
                            <thead>
                                <tr>
                                    <th>Nom & Prénom</th>
                                    <th>Contact</th>
                                    <th>Date d'ajout</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Chargement...</td>
                                    </tr>
                                ) : filteredSecretaires.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                                            Aucune secrétaire trouvée. {searchTerm && 'Essayez de modifier votre recherche.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSecretaires.map((sec) => (
                                        <tr key={sec.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {sec.photo ? (
                                                        <img
                                                            src={sec.photo.startsWith('http') || sec.photo.startsWith('data:') ? sec.photo : `http://localhost:8000${sec.photo}`}
                                                            alt={`${sec.prenom} ${sec.nom}`}
                                                            className="pro-avatar-small"
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div className="pro-avatar-small">
                                                            {sec.nom.charAt(0)}{sec.prenom.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <strong>{sec.nom} {sec.prenom}</strong>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '14px' }}>{sec.email}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>{sec.telephone || '-'}</div>
                                            </td>
                                            <td>{sec.date_inscription}</td>
                                            <td>
                                                <button
                                                    className="pro-btn-delete-sm"
                                                    onClick={() => handleRemove(sec.id, `${sec.prenom} ${sec.nom}`)}
                                                >
                                                    <Trash2 size={16} /> Retirer
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SecretairesList;
