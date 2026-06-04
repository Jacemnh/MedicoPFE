import { useState, useEffect } from 'react';
import Sidebar from '../../../components/common/Sidebar';
import axios from '../../../api/axios';
import { 
  Building, 
  Globe, 
  MapPin,
  Hospital, 
  Phone, 
  Mail, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Activity,
  Calendar,
  Users,
  User,
  Settings
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import NotificationsMenu from '../../../components/common/NotificationsMenu';
import { Link } from 'react-router-dom';
import { useAlert } from '../../../context/AlertContext';
import './GestionCabinet.css';

const GestionCabinet = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [cabinet, setCabinet] = useState({
    nom: '',
    adresse: '',
    ville: '',
    pays: '',
    telephone: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sidebarLinks = [
    { path: '/secretaire/dashboard', label: 'Tableau de bord', icon: <Activity size={20} /> },
    { path: '/secretaire/rendez-vous', label: 'Gestion RDV', icon: <Calendar size={20} /> },
    { path: '/secretaire/patients', label: 'Gestion Patients', icon: <Users size={20} /> },
    { path: '/secretaire/cabinet', label: 'Mon Cabinet', icon: <Hospital size={20} /> },
    { path: '/secretaire/profil', label: 'Mon profil', icon: <User size={20} /> },
  ];

  useEffect(() => {
    fetchCabinet();
  }, []);

  const fetchCabinet = async () => {
    try {
      const res = await axios.get('/secretaire/cabinet');
      if (res.data.success) {
        setCabinet(res.data.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du cabinet:', err);
      showAlert({ title: 'Erreur', message: 'Impossible de charger les informations du cabinet.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put('/secretaire/cabinet', cabinet);
      if (res.data.success) {
        showAlert({ title: 'Succès', message: 'Informations mises à jour avec succès !', type: 'success' });
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      showAlert({ title: 'Erreur', message: err.response?.data?.message || 'Une erreur est survenue.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return (
      <div className="sec-layout">
        <Sidebar links={sidebarLinks} />
        <main className="sec-main">
          <div className="lp-loading">Chargement des données du cabinet...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="sec-layout">
      <Sidebar links={sidebarLinks} />
      
      <main className="sec-main">
        <div className="sec-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Mon Cabinet</h1>
            <p className="sec-subtitle">Gérez les informations de contact et la localisation du centre</p>
          </div>
          <div className="pro-header-actions" style={{ gap: '5px', display: 'flex', alignItems: 'center' }}>
            <Link to="/secretaire/rendez-vous" className="notif-trigger-btn" title="Agenda" style={{ textDecoration: 'none' }}>
              <Calendar size={22} />
            </Link>
            <Link to="/secretaire/profil" className="notif-trigger-btn" title="Paramètres" style={{ textDecoration: 'none' }}>
              <Settings size={22} />
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





        <div className="cabinet-card">
          <form onSubmit={handleUpdate}>
            <div className="cabinet-grid">
              
              <div className="form-group full-width">
                <label className="form-label">Nom du Cabinet</label>
                <div className="form-input-wrapper">
                  <Building className="form-input-icon" size={18} />
                  <input 
                    type="text" 
                    className="form-input"
                    value={cabinet.nom}
                    onChange={(e) => setCabinet({...cabinet, nom: e.target.value})}
                    placeholder="Ex: Cabinet Médical Saint-Luc"
                    required
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Adresse complète</label>
                <div className="form-input-wrapper">
                  <MapPin className="form-input-icon" size={18} />
                  <input 
                    type="text" 
                    className="form-input"
                    value={cabinet.adresse}
                    onChange={(e) => setCabinet({...cabinet, adresse: e.target.value})}
                    placeholder="Ex: 12 Rue de la Santé"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ville</label>
                <div className="form-input-wrapper">
                  <Building className="form-input-icon" size={18} />
                  <input 
                    type="text" 
                    className="form-input"
                    value={cabinet.ville}
                    onChange={(e) => setCabinet({...cabinet, ville: e.target.value})}
                    placeholder="Ex: Paris"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pays</label>
                <div className="form-input-wrapper">
                  <Globe className="form-input-icon" size={18} />
                  <input 
                    type="text" 
                    className="form-input"
                    value={cabinet.pays}
                    onChange={(e) => setCabinet({...cabinet, pays: e.target.value})}
                    placeholder="Ex: France"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Numéro de Téléphone</label>
                <div className="form-input-wrapper">
                  <Phone className="form-input-icon" size={18} />
                  <input 
                    type="tel" 
                    className="form-input"
                    value={cabinet.telephone}
                    onChange={(e) => setCabinet({...cabinet, telephone: e.target.value})}
                    placeholder="Ex: +33 1 23 45 67 89"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Adresse Email</label>
                <div className="form-input-wrapper">
                  <Mail className="form-input-icon" size={18} />
                  <input 
                    type="email" 
                    className="form-input"
                    value={cabinet.email}
                    onChange={(e) => setCabinet({...cabinet, email: e.target.value})}
                    placeholder="Ex: contact@cabinet.com"
                    required
                  />
                </div>
              </div>

            </div>

            <div className="cabinet-actions">
              <button 
                type="submit" 
                className="btn-save"
                disabled={saving}
              >
                {saving ? (
                  <>Mise à jour...</>
                ) : (
                  <>
                    <Save size={18} />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default GestionCabinet;
