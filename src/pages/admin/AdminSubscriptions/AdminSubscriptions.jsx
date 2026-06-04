import React, { useState, useEffect } from 'react';
import { 
    CreditCard, Activity, Users, Stethoscope, Menu, CircleDollarSign,
    Plus, Edit, Trash2, X, Tag, ShieldCheck
, User } from 'lucide-react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar';
import { useAlert } from '../../../context/AlertContext';
import './AdminSubscriptions.css';

const AdminSubscriptions = () => {
    const { showAlert } = useAlert();
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        price: '',
        description: '',
        is_active: true
    });

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
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            const res = await api.get('/admin/subscriptions');
            if (res.data.success) {
                setSubscriptions(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching subscriptions', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (subscription = null) => {
        if (subscription) {
            setCurrentSubscription(subscription);
            setFormData({
                name: subscription.name,
                type: subscription.type,
                price: subscription.price,
                description: subscription.description || '',
                is_active: subscription.is_active
            });
        } else {
            setCurrentSubscription(null);
            setFormData({
                name: '',
                type: '',
                price: '',
                description: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentSubscription(null);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentSubscription) {
                await api.put(`/admin/subscriptions/${currentSubscription.id}`, formData);
            } else {
                await api.post('/admin/subscriptions', formData);
            }
            fetchSubscriptions();
            handleCloseModal();
            showAlert({ title: 'Succès', message: 'Abonnement enregistré avec succès.', type: 'success' });
        } catch (err) {
            console.error('Error saving subscription', err);
            showAlert({ title: 'Erreur', message: "Erreur lors de l'enregistrement de l'abonnement.", type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        showAlert({
            title: 'Suppression',
            message: 'Êtes-vous sûr de vouloir supprimer cet abonnement ?',
            type: 'question',
            showCancel: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/subscriptions/${id}`);
                    fetchSubscriptions();
                    showAlert({ title: 'Succès', message: 'Abonnement suppriméé.', type: 'success' });
                } catch (err) {
                    console.error('Error deleting subscription', err);
                    showAlert({ title: 'Erreur', message: "Erreur lors de la suppression de l'abonnement.", type: 'error' });
                }
            }
        });
    };

    const handleToggleActive = async (id) => {
        try {
            await api.put(`/admin/subscriptions/${id}/toggle-active`);
            fetchSubscriptions();
        } catch (err) {
            console.error('Error toggling subscription status', err);
            showAlert({ title: 'Erreur', message: "Erreur lors de la modification du statut.", type: 'error' });
        }
    };

    if (loading) return <div className="admin-loading">Chargement...</div>;

    return (
        <div className="admin-subscriptions-layout">
            <Sidebar links={sidebarLinks} />
            
            <main className="admin-subscriptions-main">
                <header className="admin-subscriptions-header">
                    <div>
                        <h1>Gestion des Abonnements</h1>
                        <p>Configurez les plans tarifaires pour les professionnels de santé</p>
                    </div>
                    <button className="btn-add-subscription" onClick={() => handleOpenModal()}>
                        <Plus size={20} />
                        créer un abonnement
                    </button>
                </header>

                {subscriptions.length > 0 ? (
                    <div className="subscriptions-grid">
                        {subscriptions.map(sub => (
                            <div key={sub.id} className={`subscription-card ${!sub.is_active ? 'inactive' : ''}`}>
                                <div className="subscription-card-header">
                                    <span className={`subscription-badge ${sub.is_active ? 'active' : 'inactive'}`}>
                                        {sub.is_active ? 'Actif' : 'Inactif'}
                                    </span>
                                    <div className="subscription-type">{sub.type}</div>
                                </div>
                                
                                <h3 className="subscription-title">{sub.name}</h3>
                                
                                <div className="subscription-price">
                                    {sub.price}<span>€</span>
                                </div>
                                
                                <p className="subscription-desc">
                                    {sub.description || "Aucune description fournie pour ce plan d'abonnement."}
                                </p>
                                
                                <div className="subscription-actions">
                                    <button 
                                        className="btn-edit"
                                        onClick={() => handleOpenModal(sub)}
                                    >
                                        <Edit size={16} /> Modifier
                                    </button>
                                    <button 
                                        className={`btn-toggle ${sub.is_active ? 'active' : 'inactive'}`}
                                        onClick={() => handleToggleActive(sub.id)}
                                    >
                                        {sub.is_active ? 'Désactiver' : 'Activer'}
                                    </button>
                                    <button 
                                        className="btn-delete"
                                        onClick={() => handleDelete(sub.id)}
                                        title="supprimer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <h3>Aucun abonnement trouvé</h3>
                        <p>Commencez par créer votre premier plan tarifaire.</p>
                        <button className="btn-add-subscription" onClick={() => handleOpenModal()} style={{ margin: '0 auto' }}>
                            <Plus size={20} />
                            créer un abonnement
                        </button>
                    </div>
                )}
            </main>

            {isModalOpen && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{currentSubscription ? 'Modifier l\'abonnement' : 'créer un abonnement'}</h2>
                            <button className="btn-close-modal" onClick={handleCloseModal}>
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="name">Nom de l'abonnement</label>
                                <input 
                                    type="text" 
                                    id="name" 
                                    name="name" 
                                    className="form-control"
                                    value={formData.name} 
                                    onChange={handleChange} 
                                    placeholder="ex: Abonnement Premium"
                                    required 
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="type">Type (champ libre)</label>
                                <input 
                                    type="text" 
                                    id="type" 
                                    name="type" 
                                    className="form-control"
                                    value={formData.type} 
                                    onChange={handleChange} 
                                    placeholder="ex: mensuel, trimestriel, annuel..."
                                    list="type-suggestions"
                                    required 
                                />
                                <datalist id="type-suggestions">
                                    <option value="mensuel" />
                                    <option value="trimestriel" />
                                    <option value="semestriel" />
                                    <option value="annuel" />
                                </datalist>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="price">Prix (€)</label>
                                <input 
                                    type="number" 
                                    id="price" 
                                    name="price" 
                                    className="form-control"
                                    value={formData.price} 
                                    onChange={handleChange} 
                                    step="0.01" 
                                    min="0"
                                    placeholder="ex: 29.99"
                                    required 
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="description">Description (Avantages, détails...)</label>
                                <textarea 
                                    id="description" 
                                    name="description" 
                                    className="form-control"
                                    value={formData.description} 
                                    onChange={handleChange} 
                                    placeholder="Décrivez les fonctionnalités incluses dans cet abonnement..."
                                />
                            </div>
                            
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                                <input 
                                    type="checkbox" 
                                    id="is_active" 
                                    name="is_active" 
                                    checked={formData.is_active} 
                                    onChange={handleChange} 
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <label htmlFor="is_active" style={{ margin: 0, cursor: 'pointer' }}>Activer cet abonnement immédiatement</label>
                            </div>
                            
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                                    annuler
                                </button>
                                <button type="submit" className="btn-save">
                                    {currentSubscription ? 'Mettre à jour' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSubscriptions;








