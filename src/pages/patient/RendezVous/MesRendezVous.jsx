import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/common/Sidebar';
import api from '../../../api/axios';
import { Heart, 
  Calendar, User, FileText, Clock,
  CreditCard, X, MapPin, Video,
  Phone, ChevronRight, ChevronLeft, Plus,
  CheckCircle, AlertCircle, XCircle,
  Star, Filter, Search, Save, Lock
 } from 'lucide-react';
import './RendezVous.css';
import '../../Search/SearchResults.css';

const ITEMS_PER_PAGE = 8;

const MesRendezVous = () => {
  const navigate = useNavigate();
  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http') || photo.startsWith('/')) return photo;
    return `/storage/${photo}`;
  };
  const sidebarLinks = [
    { path: '/patient/dashboard', label: 'Tableau de bord', icon: <User size={20} /> },
    { path: '/patient/rendez-vous', label: 'Mes rendez-vous', icon: <Calendar size={20} /> },
    { path: '/patient/prendre-rendez-vous', label: 'Prendre RDV', icon: <Plus size={20} /> },
    { path: '/patient/dossier-medical', label: 'Dossier médical', icon: <FileText size={20} /> },
    { path: '/patient/diagnostic-ia', label: 'Assistant Médical IA', icon: <Heart size={20} /> },
    { path: '/patient/paiement', label: 'Paiements', icon: <CreditCard size={20} /> },
    { path: '/patient/profil', label: 'Mon profil', icon: <User size={20} /> },
  ];

  const [filter, setFilter] = useState('tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [aptToCancel, setAptToCancel] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [selectedPro, setSelectedPro] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/patient/rendez-vous');
      if (response.data.success) {
        setAppointments(response.data.data);
      }
    } catch (error) {
      console.error('Erreur chargement rendez-vous', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!aptToCancel) return;
    try {
      const res = await api.put(`/patient/rendez-vous/${aptToCancel.id}/cancel`);
      if (res.data.success) {
        setShowCancelModal(false);
        fetchAppointments();
      }
    } catch (error) {
      console.error('Erreur annulation:', error);
    }
  };

  const filters = [
    { id: 'tous', label: 'Tous', count: appointments.length },
    { id: 'upcoming', label: 'À venir', count: appointments.filter(a => a.type === 'upcoming').length },
    { id: 'past', label: 'Passés', count: appointments.filter(a => a.type === 'past').length },
  ];

  const filtered = appointments.filter(a => {
    const matchFilter = filter === 'tous' || a.type === filter;
    const matchSearch = a.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const upcomingCount = appointments.filter(a => a.type === 'upcoming').length;

  const statusConfig = {
    confirmed: { icon: <CheckCircle size={14} />, class: 'rv-badge-confirmed', label: 'Confirmé' },
    pending: { icon: <AlertCircle size={14} />, class: 'rv-badge-pending', label: 'En attente' },
    done: { icon: <CheckCircle size={14} />, class: 'rv-badge-done', label: 'Terminé' },
    cancelled: { icon: <XCircle size={14} />, class: 'rv-badge-cancelled', label: 'Annulé' },
  };

  return (
    <div className="rv-layout">
      <Sidebar links={sidebarLinks} />

      <main className="rv-main">

        {/* ── Header ───────────────────────────────── */}
        <div className="rv-header">
          <div className="rv-header-left">
            <span className="rv-tag">Mes rendez-vous</span>
            <h1 className="rv-title">Gérez vos consultations</h1>
            <p className="rv-subtitle">
              {upcomingCount} rendez-vous à venir cette période
            </p>
          </div>
          <a href="/patient/prendre-rendez-vous" className="rv-new-btn">
            <Plus size={18} />
            Nouveau RDV
          </a>
        </div>

        {/* ── Summary Cards ────────────────────────── */}
        <div className="rv-summary">
          <div className="rv-summary-card rv-summary-primary">
            <div className="rv-sc-icon"><Calendar size={22} /></div>
            <div className="rv-sc-info">
              <span className="rv-sc-value">{upcomingCount}</span>
              <span className="rv-sc-label">À venir</span>
            </div>
          </div>
          <div className="rv-summary-card rv-summary-success">
            <div className="rv-sc-icon"><CheckCircle size={22} /></div>
            <div className="rv-sc-info">
              <span className="rv-sc-value">{appointments.filter(a => a.status === 'done').length}</span>
              <span className="rv-sc-label">Terminés</span>
            </div>
          </div>
          <div className="rv-summary-card rv-summary-danger">
            <div className="rv-sc-icon"><XCircle size={22} /></div>
            <div className="rv-sc-info">
              <span className="rv-sc-value">{appointments.filter(a => a.status === 'cancelled').length}</span>
              <span className="rv-sc-label">Annulés</span>
            </div>
          </div>
        </div>

        {/* ── Toolbar ──────────────────────────────── */}
        <div className="rv-toolbar">
          <div className="rv-filters">
            {filters.map(f => (
              <button
                key={f.id}
                className={`rv-filter-btn ${filter === f.id ? 'active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                <span className={`rv-filter-count ${filter === f.id ? 'active' : ''}`}>{f.count}</span>
              </button>
            ))}
          </div>
          <div className="rv-search-wrapper">
            <Search size={18} className="rv-search-icon" />
            <input
              type="text"
              placeholder="Rechercher un médecin ou spécialité..."
              className="rv-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* ── Table ────────────────────────────────── */}
        <div className="rv-table-card">
          {loading ? (
            <div className="rv-empty" style={{ padding: '3rem' }}>
              <div className="pay-spinner" style={{ borderColor: '#6B7280', borderTopColor: 'transparent', margin: '0 auto 1rem' }}></div>
              <p>Chargement des rendez-vous...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rv-empty">
              <Calendar size={48} />
              <h3>Aucun rendez-vous trouvé</h3>
              <p>Modifiez vos filtres ou prenez un nouveau rendez-vous</p>
              <a href="/patient/prendre-rendez-vous" className="rv-empty-btn">
                <Plus size={16} />
                Prendre un RDV
              </a>
            </div>
          ) : (
            <>
              <div className="rv-table-responsive">
                <table className="rv-table">
                  <thead>
                    <tr>
                      <th>Professionnel</th>
                      <th>Spécialité</th>
                      <th>Date & Heure</th>
                      <th>Lieu</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((apt) => {
                      const badge = statusConfig[apt.status] || statusConfig.pending;
                      return (
                        <tr key={apt.id} className={`rv-row-${apt.status}`}>
                          {/* Professionnel with photo */}
                          <td>
                            <div className="rv-td-doctor">
                              {apt.photo_url ? (
                                <img
                                  src={apt.photo_url}
                                  alt={apt.doctor}
                                  className="rv-td-photo"
                                />
                              ) : (
                                <div
                                  className="rv-td-avatar"
                                  style={{ background: `linear-gradient(135deg, ${apt.color || '#8B5CF6'}, ${apt.color || '#8B5CF6'}99)` }}
                                >
                                  {apt.initials}
                                </div>
                              )}
                              <div className="rv-td-doctor-info">
                                <span className="rv-td-doctor-name" style={{ cursor: 'pointer' }} onClick={() => setSelectedPro({
                                  id: apt.pro_id,
                                  name: apt.doctor,
                                  specialty: apt.specialty,
                                  photo: apt.photo_url,
                                  cabinet_name: apt.cabinet_name,
                                  cabinet_address: apt.cabinet_address,
                                  cabinet_city: apt.cabinet_city,
                                  cabinet_tel: apt.cabinet_tel,
                                  cabinet_email: apt.cabinet_email,
                                  bio: apt.bio,
                                  services: apt.services,
                                  initials: apt.initials,
                                  color: apt.color
                                })}>{apt.doctor}</span>
                              </div>
                            </div>
                          </td>
                          {/* Spécialité */}
                          <td><span className="rv-td-specialty">{apt.specialty}</span></td>
                          {/* Date & Heure */}
                          <td>
                            <div className="rv-td-datetime">
                              <span className="rv-td-date">{apt.day} {apt.month} {apt.year}</span>
                              <span className="rv-td-time"><Clock size={13} /> {apt.time}</span>
                            </div>
                          </td>
                          {/* Lieu */}
                          <td>
                            <div className="rv-td-location">
                              <MapPin size={14} />
                              <span>{apt.location}</span>
                            </div>
                          </td>
                          {/* Statut */}
                          <td>
                            <span className={`rv-badge ${badge.class}`}>
                              {badge.icon} {apt.statusLabel}
                            </span>
                          </td>
                          {/* Actions */}
                          <td>
                            <div className="rv-td-actions">
                              {apt.type === 'upcoming' && apt.status !== 'cancelled' && apt.status !== 'done' && (
                                <>
                                  <button className="rv-btn-sm rv-btn-outline" onClick={() => navigate('/patient/prendre-rendez-vous', { state: { rescheduleDoctorName: apt.doctor, rescheduleAptId: apt.id } })}>
                                    <Calendar size={14} /> Reprogrammer
                                  </button>
                                  <button className="rv-btn-sm rv-btn-danger" onClick={() => { setAptToCancel(apt); setShowCancelModal(true); }}>
                                    <X size={14} /> Annuler
                                  </button>
                                </>
                              )}
                              {apt.status === 'done' && (
                                apt.is_paid ? (
                                  <button className="rv-btn-sm rv-btn-outline" onClick={() => setActiveReport(apt)}>
                                    <FileText size={14} /> Compte-rendu
                                  </button>
                                ) : (
                                  <button className="rv-btn-sm rv-btn-locked" onClick={() => navigate('/patient/paiement')} title="Paiement requis pour accéder au compte-rendu">
                                    <Lock size={14} /> Compte-rendu
                                  </button>
                                )
                              )}
                              {apt.status === 'cancelled' && (
                                <>
                                  <button className="rv-btn-sm rv-btn-primary" onClick={() => navigate('/patient/prendre-rendez-vous', { state: { rescheduleDoctorName: apt.doctor, rescheduleAptId: apt.id } })}>
                                    <Plus size={14} /> Reprogrammer
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ────────────────────────── */}
              {totalPages > 1 && (
                <div className="rv-pagination">
                  <span className="rv-pagination-info">
                    Affichage {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length}
                  </span>
                  <div className="rv-pagination-controls">
                    <button
                      className="rv-page-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`rv-page-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      className="rv-page-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Modal Confirmation Annulation ────────── */}
        {showCancelModal && (
          <div className="pro-modal-overlay" style={{ zIndex: 1000 }}>
            <div className="pro-modal-container" style={{ maxWidth: '400px' }}>
              <div className="pro-modal-header" style={{ borderBottom: 'none' }}>
                <h2>Confirmer l'annulation</h2>
                <button className="pro-modal-close" onClick={() => setShowCancelModal(false)}><X size={24} /></button>
              </div>
              <div className="pro-modal-content" style={{ textAlign: 'center', padding: '20px' }}>
                <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '15px' }} />
                <p>Voulez-vous vraiment annuler votre rendez-vous avec le <strong>{aptToCancel?.doctor}</strong> ?</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '20px' }}>
                <button className="rv-btn-sm rv-btn-outline" onClick={() => setShowCancelModal(false)}>Non, garder</button>
                <button className="rv-btn-sm rv-btn-danger" onClick={handleCancel}>Oui, annuler</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Compte-rendu ──────────────────── */}
        {activeReport && (
          <div className="pro-modal-overlay" style={{ zIndex: 1000 }}>
            <div className="pro-modal-container" style={{ maxWidth: '600px' }}>
              <div className="pro-modal-header">
                <h2>Compte-rendu médical</h2>
                <button className="pro-modal-close" onClick={() => setActiveReport(null)}><X size={24} /></button>
              </div>
              <div className="pro-modal-content" style={{ padding: '25px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: '#6B7280', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>MÉDECIN</label>
                  <p style={{ fontWeight: 600, color: '#111827' }}>{activeReport.doctor}</p>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: '#6B7280', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>NOTES ET OBSERVATIONS</label>
                  <div style={{ background: '#F9FAFB', padding: '15px', borderRadius: '8px', border: '1px solid #E5E7EB', color: '#374151', minHeight: '100px', whiteSpace: 'pre-wrap' }}>
                    {activeReport.consultation?.notes || "Aucune note disponible pour cette consultation."}
                  </div>
                </div>
                {activeReport.consultation?.ordonnances?.length > 0 && (
                  <div>
                    <label style={{ display: 'block', color: '#6B7280', fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px' }}>ORDONNANCE</label>
                    <div style={{ background: '#F0F9FF', padding: '15px', borderRadius: '8px', border: '1px solid #BAE6FD', color: '#0369A1' }}>
                      {activeReport.consultation.ordonnances[0].medicaments}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px', borderTop: '1px solid #F3F4F6' }}>
                <button className="rv-btn-sm rv-btn-primary" onClick={() => setActiveReport(null)}>Fermer</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Détails Professionnel */}
        {selectedPro && (
          <div className="sr-modal-overlay" onClick={() => setSelectedPro(null)}>
            <div className="sr-modal-content pro-details-modal" onClick={e => e.stopPropagation()}>
              <button className="sr-modal-close" onClick={() => setSelectedPro(null)}>&times;</button>
              <div className="modal-body">
                <div className="modal-pro-header">
                  <div className="modal-pro-avatar">
                    {selectedPro.photo ? (
                      <img src={getPhotoUrl(selectedPro.photo)} alt={selectedPro.name} />
                    ) : (
                      <div className="avatar-placeholder" style={{ background: `linear-gradient(135deg, ${selectedPro.color || '#0284c7'}, #3b82f6)` }}>
                        {selectedPro.initials}
                      </div>
                    )}
                  </div>
                  <div className="modal-pro-info">
                    <h2>{selectedPro.name}</h2>
                    <p className="modal-specialty">{selectedPro.specialty}</p>
                  </div>
                </div>

                <div className="modal-section">
                  <h3><MapPin size={18} /> Coordonnées</h3>
                  <p><strong>{selectedPro.cabinet_name}</strong></p>
                  <p>{selectedPro.cabinet_address}</p>
                  <p>{selectedPro.cabinet_city}</p>
                  {selectedPro.cabinet_tel && (
                    <p style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Phone size={14} /> {selectedPro.cabinet_tel}
                    </p>
                  )}
                  {selectedPro.cabinet_email && (
                    <p style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={14} /> {selectedPro.cabinet_email}
                    </p>
                  )}
                </div>

                <div className="modal-section">
                  <h3><FileText size={18} /> À propos</h3>
                  <p>{selectedPro.bio || "Ce professionnel n'a pas encore renseigné de description."}</p>
                </div>

                <div className="modal-section">
                  <h3><CreditCard size={18} /> Tarifs et remboursements</h3>
                  <div className="modal-services-list">
                    {selectedPro.services?.map((s, idx) => (
                      <div key={idx} className="modal-service-item">
                        <span>{s.nom}</span>
                        <span>{s.prix} €</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="modal-book-btn" onClick={() => {
                  navigate('/patient/prendre-rendez-vous', { state: { rescheduleDoctorName: selectedPro.name } });
                  setSelectedPro(null);
                }}>
                  Prendre un nouveau rendez-vous
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default MesRendezVous;
