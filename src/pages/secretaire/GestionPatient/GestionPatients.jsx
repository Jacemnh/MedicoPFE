// ============================================================
//  GESTION PATIENTS (SECRETARY) - SYNCED WITH LISTEPATIENTS.JSX
// ============================================================
import { useState, useEffect } from 'react';
import Sidebar from '../../../components/common/Sidebar';
import axios from '../../../api/axios';
import {
  Calendar, Users, FileText, Clock,
  TrendingUp, Search, Eye, Plus,
  Phone, Mail, Droplets, AlertTriangle,
  X, CalendarCheck,
  Hospital, Activity, Briefcase, Settings, User
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import NotificationsMenu from '../../../components/common/NotificationsMenu';
import { Link } from 'react-router-dom';
import './GestionPatients.css';

const GestionPatients = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [filter, setFilter] = useState('tous');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/secretaire/patients');
      if (response.data.success) {
        setPatients(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const sidebarLinks = [
    { path: '/secretaire/dashboard', label: 'Tableau de bord', icon: <Activity size={20} /> },
    { path: '/secretaire/rendez-vous', label: 'Gestion RDV', icon: <Calendar size={20} /> },
    { path: '/secretaire/patients', label: 'Gestion Patients', icon: <Users size={20} /> },
    { path: '/secretaire/cabinet', label: 'Mon Cabinet', icon: <Hospital size={20} /> },
    { path: '/secretaire/profil', label: 'Mon profil', icon: <User size={20} /> },
  ];

  const filtered = patients.filter(p => {
    const matchSearch = p.user?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.user?.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.user?.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const getInitials = (user) => {
    if (!user) return '??';
    return (user.nom[0] + user.prenom[0]).toUpperCase();
  };

  const calculateAge = (dateNaissance) => {
    if (!dateNaissance) return '—';
    const birthDate = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const filters = [
    { id: 'tous', label: 'Tous', count: patients.length },
  ];

  return (
    <div className="patients-container">
      <Sidebar links={sidebarLinks} />

      <main className="patients-main">

        {/* Header */}
        <div className="patients-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="lp-title">Gestion des patients</h1>
            <p className="lp-subtitle">Gérez la patientèle du cabinet</p>
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

        {/* Stats */}
        <div className="lp-stats">
          <div className="lp-stat-card" style={{ '--c': '#8B5CF6' }}>
            <div className="lp-sc-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}>
              <Users size={22} />
            </div>
            <div className="lp-sc-body">
              <span className="lp-sc-value">{patients.length}</span>
              <span className="lp-sc-label">Patients actifs</span>
            </div>
          </div>
          <div className="lp-stat-card" style={{ '--c': '#10B981' }}>
            <div className="lp-sc-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
              <Activity size={22} />
            </div>
            <div className="lp-sc-body">
              <span className="lp-sc-value">{patients.reduce((s, p) => s + (p.rendez_vous_count || 0), 0)}</span>
              <span className="lp-sc-label">Total consultations</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="lp-toolbar">
          <div className="lp-filters">
            {filters.map(f => (
              <button
                key={f.id}
                className={`lp-filter-btn ${filter === f.id ? 'active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                <span className={`lp-fc ${filter === f.id ? 'active' : ''}`}>{f.count}</span>
              </button>
            ))}
          </div>
          <div className="lp-search-wrap">
            <Search size={18} className="lp-search-ico" />
            <input
              className="lp-search-inp"
              placeholder="Rechercher un patient..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="lp-section">
          {loading ? (
            <div className="lp-loading">Chargement des patients...</div>
          ) : (
            <div className="lp-table-container">
              <table className="lp-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Âge</th>
                    <th>Coordonnées</th>
                    <th>Groupe</th>
                    <th>Séances</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={{ '--delay': `${i * 0.05}s` }} className="lp-tr-animated">
                      <td>
                        <div className="lp-user-cell">
                          <div
                            className="lp-avatar-small"
                            style={{ background: p.user?.photo ? 'transparent' : `linear-gradient(135deg, #8B5CF6, #6366F1)` }}
                          >
                            {p.user?.photo ? (
                              <img
                                src={p.user.photo.startsWith('http') || p.user.photo.startsWith('data:') ? p.user.photo : `http://localhost:8000${p.user.photo}`}
                                alt={`${p.user?.nom} ${p.user?.prenom}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                              />
                            ) : (
                              getInitials(p.user)
                            )}
                          </div>
                          <div className="lp-user-info">
                            <span className="lp-user-name">{p.user?.nom} {p.user?.prenom}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="lp-age-badge">{calculateAge(p.user?.date_naissance)} ans</span>
                      </td>
                      <td>
                        <div className="lp-contact-cell">
                          <div className="lp-contact-item"><Phone size={14} /> {p.user?.telephone}</div>
                          <div className="lp-contact-item"><Mail size={14} /> {p.user?.email}</div>
                        </div>
                      </td>
                      <td>
                        <span className="lp-blood-cell">{p.dossier_medical?.groupe_sanguin || '—'}</span>
                      </td>
                      <td>
                        <span className="lp-sessions-cell">{p.rendez_vous_count || 0}</span>
                      </td>
                      <td>
                        <button
                          className="lp-table-action"
                          onClick={() => setSelectedPatient(p)}
                          title="Voir le dossier"
                        >
                          <Eye size={18} />
                          <span>Dossier</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal - Dossier Médical Complet */}
        {selectedPatient && (
          <div className="lp-modal-overlay" onClick={() => setSelectedPatient(null)}>
            <div className="lp-modal large" onClick={e => e.stopPropagation()}>
              <button className="lp-modal-close" onClick={() => setSelectedPatient(null)}>
                <X size={20} />
              </button>

              <div className="lp-modal-header">
                <div
                  className="lp-mh-avatar"
                  style={{ background: selectedPatient.user?.photo ? 'transparent' : `linear-gradient(135deg, #4361ee, #4cc9f0)` }}
                >
                  {selectedPatient.user?.photo ? (
                    <img
                      src={selectedPatient.user.photo.startsWith('http') || selectedPatient.user.photo.startsWith('data:') ? selectedPatient.user.photo : `http://localhost:8000${selectedPatient.user.photo}`}
                      alt={`${selectedPatient.user?.nom} ${selectedPatient.user?.prenom}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  ) : (
                    getInitials(selectedPatient.user)
                  )}
                </div>
                <div className="lp-mh-info">
                  <h2>{selectedPatient.user?.nom} {selectedPatient.user?.prenom}</h2>
                  <div className="lp-mh-meta">
                    <span><Phone size={14} /> {selectedPatient.user?.telephone}</span>
                    <span><Mail size={14} /> {selectedPatient.user?.email}</span>
                    <span><Calendar size={14} /> Né(e) le {selectedPatient.user?.date_naissance ? new Date(selectedPatient.user.date_naissance).toLocaleDateString('fr-FR') : '—'}</span>
                  </div>
                </div>
              </div>

              <div className="lp-modal-content">
                <div className="lp-modal-scroll">
                  {/* Health Parameters */}
                  <div className="lp-record-section">
                    <div className="lp-rs-header">
                      <Activity size={18} />
                      <h3>Paramètres de santé</h3>
                    </div>
                    <div className="lp-params-grid">
                      <div className="lp-param-item">
                        <span className="lp-pi-label">Groupe Sanguin</span>
                        <span className="lp-pi-value badge-purple">{selectedPatient.dossier_medical?.groupe_sanguin || '—'}</span>
                      </div>
                      <div className="lp-param-item">
                        <span className="lp-pi-label">Poids</span>
                        <span className="lp-pi-value">{selectedPatient.dossier_medical?.poids ? `${selectedPatient.dossier_medical.poids} kg` : '—'}</span>
                      </div>
                      <div className="lp-param-item">
                        <span className="lp-pi-label">Taille</span>
                        <span className="lp-pi-value">{selectedPatient.dossier_medical?.taille ? `${selectedPatient.dossier_medical.taille} cm` : '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Chronic Diseases */}
                  <div className="lp-record-section">
                    <div className="lp-rs-header">
                      <AlertTriangle size={18} className="text-warning" />
                      <h3>Antécédents & Maladies Chroniques</h3>
                    </div>
                    <div className="lp-chronic-box">
                      {selectedPatient.dossier_medical?.maladies_chroniques || "Aucun antécédent majeur renseigné."}
                    </div>
                  </div>

                  {/* Consultation History */}
                  <div className="lp-record-section">
                    <div className="lp-rs-header">
                      <FileText size={18} />
                      <h3>Historique des consultations</h3>
                    </div>
                    <div className="lp-history-list">
                      {selectedPatient.consultations?.length > 0 ? (
                        selectedPatient.consultations.map((c, i) => (
                          <div key={c.id} className="lp-history-item">
                            <div className="lp-hi-date">
                              <strong>{new Date(c.date_consultation).toLocaleDateString('fr-FR')}</strong>
                              <span>{c.rendez_vous?.service?.nom}</span>
                            </div>
                            <div className="lp-hi-notes">
                              <p>{c.notes || "Pas de notes pour cette séance."}</p>
                              {c.ordonnances?.length > 0 && (
                                <div className="lp-hi-ord">
                                  <strong>Ordonnance :</strong> {c.ordonnances[0].medicaments}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="lp-no-data">Aucune consultation passée enregistrée.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lp-modal-footer">
                <button className="lp-modal-btn lp-mb-outline" onClick={() => setSelectedPatient(null)}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default GestionPatients;