import { useState, useEffect } from 'react';
import Sidebar from '../../../components/common/Sidebar';
import {
  Calendar, Users, FileText, Clock,
  Trash2, Save, Activity, Briefcase, Settings,
  ChevronLeft, ChevronRight, X, Phone, Mail, MapPin, CheckCircle, Eye, Euro, CreditCard, User
} from 'lucide-react';
import api from '../../../api/axios';
import { useAlert } from '../../../context/AlertContext';
import { useAuth } from '../../../context/AuthContext';
import { Link } from 'react-router-dom';
import NotificationsMenu from '../../../components/common/NotificationsMenu';
import './Creneaux.css';

const Creneaux = () => {
  const { showAlert } = useAlert();
  const { user } = useAuth();
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

  const joursSemaine = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  // Form state for base config
  const [duree, setDuree] = useState(30);
  const [horaires, setHoraires] = useState({
    lundi: { actif: false, matin: { debut: '08:00', fin: '12:00' }, apresmidi: { debut: '14:00', fin: '18:00' } },
    mardi: { actif: false, matin: { debut: '08:00', fin: '12:00' }, apresmidi: { debut: '14:00', fin: '18:00' } },
    mercredi: { actif: false, matin: { debut: '08:00', fin: '12:00' }, apresmidi: { debut: '14:00', fin: '18:00' } },
    jeudi: { actif: false, matin: { debut: '08:00', fin: '12:00' }, apresmidi: { debut: '14:00', fin: '18:00' } },
    vendredi: { actif: false, matin: { debut: '08:00', fin: '12:00' }, apresmidi: { debut: '14:00', fin: '18:00' } },
    samedi: { actif: false, matin: { debut: '08:00', fin: '12:00' }, apresmidi: { debut: '14:00', fin: '18:00' } },
    dimanche: { actif: false, matin: { debut: '08:00', fin: '12:00' }, apresmidi: { debut: '14:00', fin: '18:00' } },
  });

  // Get current week's Monday date
  const getMondayOfWeek = (d = new Date()) => {
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const [currentWeekMonday, setCurrentWeekMonday] = useState(getMondayOfWeek());

  // Plages state
  const [plages, setPlages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Modal State
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotForm, setSlotForm] = useState({ statut: 'disponible', heure_fin: '' });
  const [savingSlot, setSavingSlot] = useState(false);

  // Fetch Base Config (just to have default form values)
  const fetchBaseConfig = async () => {
    try {
      const res = await api.get('/pro/creneaux');
      if (res.data.success && res.data.data.length > 0) {
        const latest = res.data.data[res.data.data.length - 1]; // get latest
        setHoraires(latest.horaires_travail);
        setDuree(latest.duree_consultation_defaut);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Plages Horaires for the current viewed week
  const fetchPlages = async () => {
    setLoading(true);
    try {
      const dateStr = currentWeekMonday.toLocaleDateString('en-CA'); // YYYY-MM-DD local
      const res = await api.get(`/pro/plages-horaires?date=${dateStr}`);
      if (res.data.success) {
        setPlages(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des créneaux' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaseConfig();
  }, []);

  useEffect(() => {
    fetchPlages();
    // Clear messages when changing week
    setMessage({ type: '', text: '' });
  }, [currentWeekMonday]);

  // Navigate Weeks
  const prevWeek = () => {
    const d = new Date(currentWeekMonday);
    d.setDate(d.getDate() - 7);
    setCurrentWeekMonday(d);
  };

  const nextWeek = () => {
    const d = new Date(currentWeekMonday);
    d.setDate(d.getDate() + 7);
    setCurrentWeekMonday(d);
  };

  // Get week range label
  const getWeekLabel = () => {
    const sunday = new Date(currentWeekMonday);
    sunday.setDate(currentWeekMonday.getDate() + 6);
    const opts = { day: 'numeric', month: 'short' };
    return `Semaine du ${currentWeekMonday.toLocaleDateString('fr-FR', opts)} au ${sunday.toLocaleDateString('fr-FR', opts)} ${sunday.getFullYear()}`;
  };

  // Vérifier si un créneau est passé
  const isPastSlot = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return false;
    const now = new Date();
    const [year, month, day] = dateStr.substring(0, 10).split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const slotDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return slotDate < now;
  };

  // Vérifier si un jour est entièrement passé
  const isPastDay = (dateStr) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set now to start of today
    const dayToCheck = new Date(dateStr);
    dayToCheck.setHours(0, 0, 0, 0); // Set dayToCheck to start of its day
    return dayToCheck < now;
  };

  const formatSlotTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5); // HH:mm:ss -> HH:mm
  };

  // Save new configuration (which triggers generation for this week)
  const handleSaveConfig = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const dateStr = currentWeekMonday.toLocaleDateString('en-CA');
      const res = await api.post('/pro/creneaux', {
        date: dateStr,
        horaires_travail: horaires,
        duree_consultation_defaut: duree,
      });
      if (res.data.success) {
        showAlert({ title: 'Succès', message: 'Configuration enregistrée et créneaux générés', type: 'success' });
        fetchPlages(); // Refresh the grid
      }
    } catch (err) {
      showAlert({ title: 'Erreur', message: 'Erreur lors de l\'enregistrement de la configuration', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Toggle day for config form
  const toggleDay = (jour) => {
    setHoraires(prev => ({
      ...prev,
      [jour]: { ...prev[jour], actif: !prev[jour].actif }
    }));
  };

  // Update time for config form
  const updateTimeConfig = (jour, periode, champ, value) => {
    setHoraires(prev => ({
      ...prev,
      [jour]: {
        ...prev[jour],
        [periode]: { ...prev[jour][periode], [champ]: value }
      }
    }));
  };

  // Slot Modify Modal
  const openSlotModal = (slot) => {
    setSelectedSlot(slot);
    setSlotForm({
      statut: slot.statut,
      heure_fin: formatSlotTime(slot.heure_fin)
    });
  };

  const closeSlotModal = () => {
    setSelectedSlot(null);
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    setSavingSlot(true);
    try {
      const payload = {
        statut: slotForm.statut,
      };
      // Validation simple de format pour l'heure de fin
      if (slotForm.heure_fin) {
        payload.heure_fin = slotForm.heure_fin + ':00';
      }

      const res = await api.put(`/pro/plages-horaires/${selectedSlot.id}`, payload);
      if (res.data.success) {
        showAlert({ title: 'Succès', message: 'Créneau mis à jour', type: 'success' });
        closeSlotModal();
        fetchPlages();
      }
    } catch (err) {
      showAlert({ title: 'Erreur', message: err.response?.data?.error || 'Erreur lors de la mise à jour', type: 'error' });
    } finally {
      setSavingSlot(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedSlot?.rendez_vous) return;

    showAlert({
      title: 'Annulation RDV',
      message: 'Êtes-vous sûr de vouloir annuler ce rendez-vous ?',
      type: 'warning',
      showCancel: true,
      onConfirm: async () => {
        setSavingSlot(true);
        try {
          const res = await api.put(`/pro/consultations/${selectedSlot.rendez_vous.id}/status`, {
            statut: 'annule'
          });

          if (res.data.success) {
            showAlert({ title: 'Succès', message: 'Rendez-vous annulé avec succès.', type: 'success' });
            closeSlotModal();
            fetchPlages();
          }
        } catch (err) {
          console.error(err);
          showAlert({ title: 'Erreur', message: 'Erreur lors de l\'annulation.', type: 'error' });
        } finally {
          setSavingSlot(false);
        }
      }
    });
  };

  const handleStatusChange = async (id, newStatus) => {
      try {
        const res = await api.put(`/pro/consultations/${id}/status`, { statut: newStatus });
        if (res.data.success) {
          showAlert({ title: 'Succès', message: 'Statut du rendez-vous mis à jour avec succès.', type: 'success' });
          closeSlotModal();
          fetchPlages();
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        showAlert({ title: 'Erreur', message: 'Erreur lors de la mise à jour du statut.', type: 'error' });
      }
    };


    // Group plages by day matching current visible week
    const slotsByDay = joursSemaine.map((jour, idx) => {
      const d = new Date(currentWeekMonday);
      d.setDate(currentWeekMonday.getDate() + idx);
      const dateStr = d.toLocaleDateString('en-CA');
      const daySlots = plages.filter(p => p.date.substring(0, 10) === dateStr);

      // Sort slots by start time
      daySlots.sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));

      return {
        jour,
        dateObj: d,
        dateStr,
        daySlots
      };
    });

    return (
      <div className="cr-layout">
        {!selectedSlot && <Sidebar links={sidebarLinks} />}

        <main className={`cr-main ${selectedSlot ? 'no-sidebar' : ''}`}>
          {/* Header */}
          <div className="cr-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="cr-header-badge"><Calendar size={16} /> <span>Mon Agenda Hebdomadaire</span></div>
              <h1 className="cr-title">Planning & Rendez-vous</h1>
              <p className="cr-subtitle">Gérez vos disponibilités et vos consultations sur toute la semaine.</p>
            </div>
            <div className="pro-header-actions" style={{ gap: '5px', display: 'flex', alignItems: 'center' }}>

              <Link to="/professionnel/profil" className="notif-trigger-btn" title="Paramètres" style={{ textDecoration: 'none' }}>
                <Settings size={22} />
              </Link>
              <NotificationsMenu />
              
              <div style={{ width: '1px', height: '30px', background: '#cbd5e1', margin: '0 5px' }}></div>
              
              <Link to="/professionnel/profil" className="pro-user-info" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 9px', border: '1px solid #ffffffff', borderRadius: '50px', textDecoration: 'none', cursor: 'pointer', background: '#ffffff', transition: 'all 0.2s' }}>
                <User size={18} color="#0f0f0fff" />
                <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#030303ff' }}>
                  Dr. {user?.nom}
                </span>
              </Link>
            </div>
          </div>



          {/* Configuration Form ──────────────────────────────────── */}
          <div className="cr-section cr-config-zone">
            <div className="cr-section-header">
              <h2>Générer selon mon agenda type</h2>

            </div>

            <div className="cr-config-row">
              <div className="cr-config-field">
                <label><Clock size={16} /> Durée consultation (génération automatique)</label>
                <select value={duree} onChange={(e) => setDuree(parseInt(e.target.value))}>
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
            </div>
            <div className="cr-table-wrapper">
              <table className="cr-schedule-table">
                <thead>
                  <tr>
                    <th>Jour</th>
                    <th>Actif</th>
                    <th>Matin (Début)</th>
                    <th>Matin (Fin)</th>
                    <th>Après-midi (Début)</th>
                    <th>Après-midi (Fin)</th>
                  </tr>
                </thead>
                <tbody>
                  {joursSemaine.map((jour) => (
                    <tr key={jour} className={horaires[jour].actif ? 'row-active' : 'row-inactive'}>
                      <td className="td-jour">{jour.charAt(0).toUpperCase() + jour.slice(1)}</td>
                      <td>
                        <label className="cr-toggle">
                          <input type="checkbox" checked={horaires[jour].actif} onChange={() => toggleDay(jour)} />
                          <span className="cr-toggle-slider"></span>
                        </label>
                      </td>
                      <td>
                        <input type="time" value={horaires[jour].matin.debut} disabled={!horaires[jour].actif}
                          onChange={(e) => updateTimeConfig(jour, 'matin', 'debut', e.target.value)} />
                      </td>
                      <td>
                        <input type="time" value={horaires[jour].matin.fin} disabled={!horaires[jour].actif}
                          onChange={(e) => updateTimeConfig(jour, 'matin', 'fin', e.target.value)} />
                      </td>
                      <td>
                        <input type="time" value={horaires[jour].apresmidi.debut} disabled={!horaires[jour].actif}
                          onChange={(e) => updateTimeConfig(jour, 'apresmidi', 'debut', e.target.value)} />
                      </td>
                      <td>
                        <input type="time" value={horaires[jour].apresmidi.fin} disabled={!horaires[jour].actif}
                          onChange={(e) => updateTimeConfig(jour, 'apresmidi', 'fin', e.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="cr-new-btn" onClick={handleSaveConfig} disabled={saving}>
              <Save size={18} />
              {saving ? 'Génération...' : 'Enregistrer & Générer la semaine'}
            </button>
          </div>

          {/* Week View ────────────────────────────────────────── */}
          <div className="cr-section">

            <div className="cr-week-header">
              <h2 className="cr-week-title">{getWeekLabel()}</h2>
            </div>

            {loading ? (
              <div className="cr-loading">Chargement des créneaux...</div>
            ) : (
              <div className="cr-grid-container">
                {slotsByDay.map(day => (
                  <div key={day.jour} className="cr-day-col">
                    <div className={`cr-day-col-header ${isPastDay(day.dateStr) ? 'is-past' : ''}`}>
                      <span className="cr-day-name">{day.jour}</span>
                      <span className="cr-day-number">{day.dateObj.getDate()} {day.dateObj.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                    </div>

                    <div className="cr-day-slots">
                      {day.daySlots.length === 0 ? (
                        <div className="cr-no-slots">Repos</div>
                      ) : (
                        day.daySlots.map(slot => (
                          <div
                            key={slot.id}
                            className={`cr-slot-card status-${slot.statut} ${isPastSlot(day.dateStr, slot.heure_debut) ? 'is-past' : ''}`}
                            onClick={() => openSlotModal(slot)}
                            title={slot.statut === 'reserve' || slot.statut === 'en_attente' ? "Voir les détails du patient" : "Cliquez pour modifier"}
                          >
                            <div className="cr-slot-time">
                              {formatSlotTime(slot.heure_debut)} - {formatSlotTime(slot.heure_fin)}
                            </div>
                            <div className="cr-slot-status">
                              {slot.statut === 'disponible' && 'Disponible'}
                              {slot.statut === 'inactif' && 'Inactif'}
                              {slot.statut === 'reserve' && 'Réservé'}
                              {slot.statut === 'en_attente' && 'En attente'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modale de modification de créneau ─────────────────────── */}
          {selectedSlot && (
            <div className="cr-modal-overlay">
              <div className="cr-modal">
                <div className="cr-modal-header">
                  <h3>Modifier le créneau</h3>
                  <button className="cr-close-btn" onClick={closeSlotModal}><X size={20} /></button>
                </div>
                <form onSubmit={handleUpdateSlot}>
                  <div className="cr-modal-body">
                    <div className="cr-modal-info">
                      <div className="cr-info-item">
                        <span className="cr-info-label">Date</span>
                        <span className="cr-info-value">{new Date(selectedSlot.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="cr-info-item">
                        <span className="cr-info-label">Heure</span>
                        <span className="cr-info-value">{formatSlotTime(selectedSlot.heure_debut)} - {formatSlotTime(selectedSlot.heure_fin)}</span>
                      </div>
                    </div>

                    {selectedSlot.rendez_vous ? (
                      <div className="cr-patient-info-card">
                        <div className="cr-patient-header">
                          <div className="cr-patient-avatar">
                            {selectedSlot.rendez_vous.patient?.user?.nom?.charAt(0)}{selectedSlot.rendez_vous.patient?.user?.prenom?.charAt(0)}
                          </div>
                          <div className="cr-patient-details">
                            <h4>{selectedSlot.rendez_vous.patient?.user?.nom} {selectedSlot.rendez_vous.patient?.user?.prenom}</h4>
                            <p>Patient via plateforme</p>
                          </div>
                        </div>
                        <div className="cr-patient-meta">
                          <div className="cr-meta-item">
                            <Phone size={14} /> <strong>Téléphone:</strong> {selectedSlot.rendez_vous.patient?.user?.telephone || 'Non renseigné'}
                          </div>
                          <div className="cr-meta-item">
                            <Mail size={14} /> <strong>Email:</strong> {selectedSlot.rendez_vous.patient?.user?.email || 'Non renseigné'}
                          </div>
                          <div className="cr-meta-item">
                            <FileText size={14} /> <strong>Motif:</strong> {selectedSlot.rendez_vous.motif || selectedSlot.rendez_vous.service?.nom || 'Non spécifié'}
                          </div>
                          <div className="cr-meta-item">
                            <strong>Statut RDV:</strong> <span className={`status-badge ${selectedSlot.rendez_vous.statut}`}>{selectedSlot.rendez_vous.statut}</span>
                          </div>
                        </div>

                        <div className="cr-action-grid">
                          {selectedSlot.rendez_vous.statut === 'en_attente' && (
                            <button
                              type="button"
                              className="cr-btn-action btn-confirm"
                              onClick={() => handleStatusChange(selectedSlot.rendez_vous.id, 'confirme')}
                              disabled={selectedSlot.rendez_vous.reprogrammed}
                              style={selectedSlot.rendez_vous.reprogrammed ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                              title={selectedSlot.rendez_vous.reprogrammed ? "En attente de la confirmation du patient suite à la reprogrammation" : ""}
                            >
                              <CheckCircle size={16} /> {selectedSlot.rendez_vous.reprogrammed ? "En attente" : "Confirmer"}
                            </button>
                          )}
                          {selectedSlot.rendez_vous.statut === 'confirme' && (
                            <button
                              type="button"
                              className="cr-btn-action btn-start"
                              onClick={() => window.location.href = `/professionnel/consultations?id=${selectedSlot.rendez_vous.id}&start=true`}
                            >
                              <Activity size={16} /> Démarrer
                            </button>
                          )}
                          {selectedSlot.rendez_vous.statut === 'termine' && (
                            <button
                              type="button"
                              className="cr-btn-action btn-view"
                              onClick={() => window.location.href = `/professionnel/consultations?id=${selectedSlot.rendez_vous.id}&view=true`}
                            >
                              <Eye size={16} /> Voir Compte-rendu
                            </button>
                          )}
                          <button
                            type="button"
                            className="cr-btn-cancel-rdv"
                            onClick={handleCancelAppointment}
                            disabled={savingSlot}
                          >
                            <X size={16} /> Annuler le rendez-vous
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="cr-form-group">
                          <label>Heure de fin</label>
                          <input
                            type="time"
                            value={slotForm.heure_fin}
                            onChange={(e) => setSlotForm({ ...slotForm, heure_fin: e.target.value })}
                            required
                          />
                          <small>Permet de rallonger ou raccourcir ce créneau.</small>
                        </div>

                        <div className="cr-form-group">
                          <label>Statut</label>
                          <div className="cr-radio-group">
                            <label className={`cr-radio ${slotForm.statut === 'disponible' ? 'active' : ''}`}>
                              <input
                                type="radio"
                                name="statut"
                                value="disponible"
                                checked={slotForm.statut === 'disponible'}
                                onChange={(e) => setSlotForm({ ...slotForm, statut: e.target.value })}
                              />
                              Disponible (Vert)
                            </label>
                            <label className={`cr-radio ${slotForm.statut === 'inactif' ? 'active alert' : ''}`}>
                              <input
                                type="radio"
                                name="statut"
                                value="inactif"
                                checked={slotForm.statut === 'inactif'}
                                onChange={(e) => setSlotForm({ ...slotForm, statut: e.target.value })}
                              />
                              Inactif (Gris)
                            </label>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="cr-modal-footer">
                    <button type="button" className="cr-cancel-btn" onClick={closeSlotModal}>Fermer</button>
                    {!selectedSlot.rendez_vous && (
                      <button type="submit" className="cr-save-btn" disabled={savingSlot}>
                        {savingSlot ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    );
  };

  export default Creneaux;