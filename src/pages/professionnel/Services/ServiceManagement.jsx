import React, { useState, useEffect } from 'react';
import { Activity, FileText, Users, Clock, Settings, Briefcase, Plus, Edit, Trash2, Save, X, ToggleLeft, ToggleRight, Euro, ChevronRight, CreditCard } from 'lucide-react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar';
import { useAlert } from '../../../context/AlertContext';
import './ServiceManagement.css';

const ServiceManagement = () => {
    const { showAlert } = useAlert();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentService, setCurrentService] = useState({ nom: '', description: '', prix: '', est_actif: true, specialite_id: '' });
    const [editingId, setEditingId] = useState(null);

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

    const fetchServices = async () => {
        try {
            const response = await api.get('/pro/services');
            setServices(response.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleToggleStatus = async (service) => {
        try {
            await api.put(`/pro/services/${service.id}`, { est_actif: !service.est_actif });
            fetchServices();
            showAlert({ 
                title: 'Statut mis à jour', 
                message: `Le service "${service.nom}" a été ${!service.est_actif ? 'activé' : 'désactivé'} avec succès.`, 
                type: 'success' 
            });
        } catch (err) {
            console.error(err);
            showAlert({ title: 'Erreur', message: 'Erreur lors de la mise à jour du statut.', type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        showAlert({
            title: 'Supprimer ce service ?',
            message: 'Êtes-vous sûr de vouloir supprimer définitivement ce service ?',
            type: 'warning',
            showCancel: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/pro/services/${id}`);
                    showAlert({ title: 'Succès', message: 'Service supprimé avec succès.', type: 'success' });
                    fetchServices();
                } catch (err) {
                    console.error(err);
                    showAlert({ title: 'Erreur', message: 'Erreur lors de la suppression.', type: 'error' });
                }
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/pro/services/${editingId}`, currentService);
                showAlert({ title: 'Service modifié', message: 'Le service a été modifié avec succès.', type: 'success' });
            } else {
                // In real app, specialite_id should come from professional context
                await api.post('/pro/services', { ...currentService, specialite_id: 1 });
                showAlert({ title: 'Service ajouté', message: 'Le nouveau service a été ajouté avec succès.', type: 'success' });
            }
            setShowModal(false);
            fetchServices();
        } catch (err) {
            console.error(err);
            showAlert({ title: 'Erreur', message: "Erreur lors de l'enregistrement du service.", type: 'error' });
        }
    };

    const activeCount = services.filter(s => s.est_actif).length;
    const inactiveCount = services.filter(s => !s.est_actif).length;
    const avgPrice = services.length
        ? (services.reduce((sum, s) => sum + Number(s.prix), 0) / services.length).toFixed(2)
        : '0.00';

    return (
        <div className="sm-layout">
            <Sidebar links={sidebarLinks} activePath="/professionnel/services" />
            <main className="sm-main">
                {/* Header */}
                <div className="sm-header">
                    <div className="sm-header-left">
                        <div className="sm-header-badge">
                            <Briefcase size={14} />
                            <span>Mes Services</span>
                        </div>
                        <h1 className="sm-title">Actes et Tarifs</h1>
                        <p className="sm-subtitle">Gérez vos types de consultations et vos honoraires</p>
                    </div>
                    <button
                        className="sm-new-btn"
                        onClick={() => {
                            setEditingId(null);
                            setCurrentService({ nom: '', description: '', prix: '', est_actif: true });
                            setShowModal(true);
                        }}
                    >
                        <Plus size={18} />
                        <span>Nouveau service</span>
                    </button>
                </div>

                {/* Stats Strip */}
                <div className="sm-stats-grid">
                    <div className="sm-stat-card">
                        <div className="sm-stat-icon grey">
                            <Briefcase size={20} />
                        </div>
                        <div className="sm-stat-info">
                            <span className="sm-stat-label">Total services</span>
                            <span className="sm-stat-value">{services.length}</span>
                        </div>
                    </div>
                    <div className="sm-stat-card">
                        <div className="sm-stat-icon emerald">
                            <Activity size={20} />
                        </div>
                        <div className="sm-stat-info">
                            <span className="sm-stat-label">Services actifs</span>
                            <span className="sm-stat-value">{activeCount}</span>
                        </div>
                    </div>
                    <div className="sm-stat-card">
                        <div className="sm-stat-icon purple">
                            <Euro size={20} />
                        </div>
                        <div className="sm-stat-info">
                            <span className="sm-stat-label">Tarif moyen</span>
                            <span className="sm-stat-value">{avgPrice}€</span>
                        </div>
                    </div>
                </div>

                {/* Main Section */}
                <div className="sm-section">
                    <div className="sm-section-header">
                        <h2>Liste des actes médicaux</h2>
                        <div className="sm-section-sub">
                            {services.length} service{services.length !== 1 ? 's' : ''} enregistré{services.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    <div className="sm-services-list">
                        {loading ? (
                            <div className="sm-loading">
                                <span className="sm-loader"></span>
                                <p>Chargement des services...</p>
                            </div>
                        ) : services.length === 0 ? (
                            <div className="sm-empty">
                                <div className="sm-empty-icon">
                                    <Briefcase size={32} />
                                </div>
                                <h3>Aucun service configuré</h3>
                                <p>Ajoutez vos actes pour qu'ils soient visibles par les patients.</p>
                                <button
                                    className="sm-new-btn"
                                    onClick={() => { setEditingId(null); setCurrentService({ nom: '', description: '', prix: '', est_actif: true }); setShowModal(true); }}
                                >
                                    <Plus size={16} /> Créer un premier service
                                </button>
                            </div>
                        ) : (
                            <div className="sm-table-wrapper">
                                <table className="sm-table">
                                    <thead>
                                        <tr>
                                            <th>Service / Acte</th>
                                            <th>Statut</th>
                                            <th>Honoraires</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {services.map(service => (
                                            <tr key={service.id} className={!service.est_actif ? 'is-inactive' : ''}>
                                                <td>
                                                    <div className="sm-td-name">{service.nom}</div>
                                                    <div className="sm-td-desc">{service.description || '—'}</div>
                                                </td>
                                                <td>
                                                    <div className={`sm-status-badge ${service.est_actif ? 'active' : 'inactive'}`}>
                                                        {service.est_actif ? 'Actif' : 'Inactif'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="sm-td-price">{Number(service.prix).toFixed(2)}€</div>
                                                </td>
                                                <td>
                                                    <div className="sm-td-actions">
                                                        <button
                                                            onClick={() => handleToggleStatus(service)}
                                                            className="sm-action-btn toggle"
                                                            title={service.est_actif ? 'Désactiver' : 'Activer'}
                                                        >
                                                            {service.est_actif ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingId(service.id); setCurrentService(service); setShowModal(true); }}
                                                            className="sm-action-btn edit"
                                                            title="Modifier"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(service.id)}
                                                            className="sm-action-btn delete"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="sm-modal-overlay">
                    <div className="sm-modal">
                        <div className="sm-modal-header">
                            <div className="sm-modal-title">
                                <div className="sm-modal-icon">
                                    <Edit size={18} />
                                </div>
                                <h3>{editingId ? 'Modifier le service' : 'Ajouter un service'}</h3>
                            </div>
                            <button className="sm-modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>

                        <form className="sm-modal-body" onSubmit={handleSubmit}>
                            <div className="sm-form-group">
                                <label>Nom de l'acte</label>
                                <input
                                    value={currentService.nom || ''}
                                    onChange={e => setCurrentService({ ...currentService, nom: e.target.value })}
                                    required
                                    placeholder="Ex : Consultation générale"
                                />
                            </div>
                            <div className="sm-form-group">
                                <label>Description détaillée</label>
                                <textarea
                                    value={currentService.description || ''}
                                    onChange={e => setCurrentService({ ...currentService, description: e.target.value })}
                                    placeholder="Précisez le déroulement ou les conditions..."
                                    rows={4}
                                />
                            </div>
                            <div className="sm-form-group">
                                <label>Honoraires (Euros)</label>
                                <div className="sm-price-input-wrapper">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={currentService.prix || ''}
                                        onChange={e => setCurrentService({ ...currentService, prix: e.target.value })}
                                        required
                                        placeholder="0.00"
                                    />
                                    < Euro size={16} className="sm-euro-icon" />
                                </div>
                            </div>

                            <div className="sm-modal-footer">
                                <button type="button" className="sm-cancel-btn" onClick={() => setShowModal(false)}>
                                    Annuler
                                </button>
                                <button type="submit" className="sm-save-btn">
                                    <Save size={18} />
                                    <span>Enregistrer l'acte</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceManagement;
