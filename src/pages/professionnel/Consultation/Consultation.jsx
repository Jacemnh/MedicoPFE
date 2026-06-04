import { useState, useEffect } from 'react';
import Sidebar from '../../../components/common/Sidebar';
import axios from '../../../api/axios';
import {
  Calendar, Users, FileText, Clock,
  Search, Eye, Edit, Activity, Moon, Sun, Bell,
  User, X, Briefcase, Settings, CheckCircle, AlertCircle, Save, ChevronLeft, MapPin, ChevronRight, Phone, Mail, Euro, CreditCard
} from 'lucide-react';
import './Consultation.css';
import './Consultation.css';
import { Link } from 'react-router-dom';
import NotificationsMenu from '../../../components/common/NotificationsMenu';
import { useAlert } from '../../../context/AlertContext';
const Consultation = () => {
  const { showAlert } = useAlert();
  const [darkMode, setDarkMode] = useState(false);
  const [filter, setFilter] = useState('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [consultations, setConsultations] = useState([]);
  const [creneaux, setCreneaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [activeConsultation, setActiveConsultation] = useState(null);
  const [notes, setNotes] = useState('');
  const [ordonnance, setOrdonnance] = useState('');
  const [showOrdonnance, setShowOrdonnance] = useState(false);
  const [groupeSanguin, setGroupeSanguin] = useState('');
  const [maladiesChroniques, setMaladiesChroniques] = useState('');
  const [poids, setPoids] = useState('');
  const [taille, setTaille] = useState('');
  const [diagnostique, setDiagnostique] = useState('');
  const [showDiagnostique, setShowDiagnostique] = useState(false);

  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [viewMode, setViewMode] = useState(false); // New state for read-only view
  const [activeConsViewMode, setActiveConsViewMode] = useState('full'); // 'full', 'contact-only', 'reschedule-only', 'view', 'confirmed'
  const [patientHistory, setPatientHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // New states for Rescheduling & Cancellation
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAptToReschedule, setSelectedAptToReschedule] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [aptToCancel, setAptToCancel] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [aptToConfirm, setAptToConfirm] = useState(null);
  const [showAllAptsForDay, setShowAllAptsForDay] = useState(null); // stores dateStr or null
  const [selectedDay, setSelectedDay] = useState(null); // dateStr of clicked day

  // Success notification state
  const [successNotif, setSuccessNotif] = useState(null); // { type: 'confirme'|'annule'|'reprogramme', patientName: string }

  // Agenda Grid States
  const [viewType, setViewType] = useState('liste'); // 'liste' or 'agenda'
  const [viewMonth, setViewMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  // Monthly Calendar Logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Mon=0, Sun=6
  };

  const generateCalendarDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Prev month days
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, month: month - 1, year: year, current: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month: month, year: year, current: true });
    }

    // Next month days
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({ day: i, month: month + 1, year: year, current: false });
    }
    return days;
  };

  const calendarDays = generateCalendarDays(viewMonth);
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  const handlePrevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  const handleToday = () => setViewMonth(new Date());

  useEffect(() => {
    fetchConsultations();
    fetchUser();
    fetchCreneaux();
  }, [filter, searchTerm]);

  const isPastSlot = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return false;
    const now = new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const slotDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return slotDate < now;
  };

  const joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  const getAppointmentsForDay = (dateStr) => {
    return consultations.filter(c => {
      if (!c.date_heure) return false;
      const cDateStr = c.date_heure.split('T')[0];
      return cDateStr === dateStr;
    });
  };

  const fetchUser = async () => {
    try {
      const response = await axios.get('/pro/profile');
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  };

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'tous') params.statut = filter;
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get('/pro/consultations', { params });
      if (response.data.success) {
        setConsultations(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreneaux = async () => {
    try {
      const response = await axios.get('/pro/creneaux');
      if (response.data.success) {
        setCreneaux(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des créneaux:', error);
    }
  };

  const showSuccessNotification = (type, patientName) => {
    setSuccessNotif({ type, patientName });
    setTimeout(() => setSuccessNotif(null), 3000);
  };

  const handleStatusChange = async (id, newStatus) => {
    const patientName = aptToConfirm?.patient?.user?.nom || aptToCancel?.patient?.user?.nom || '';
    try {
      const res = await axios.put(`/pro/consultations/${id}/status`, { statut: newStatus });
      if (res.data.success) {
        fetchConsultations();
        setShowCancelModal(false);
        setShowConfirmModal(false);
        setAptToCancel(null);
        setAptToConfirm(null);
        showSuccessNotification(newStatus === 'confirme' ? 'confirme' : 'annule', patientName);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime || !selectedAptToReschedule) return;
    const patientName = selectedAptToReschedule?.patient?.user?.nom || '';
    try {
      const dateHeure = `${newDate} ${newTime}`;
      const res = await axios.put(`/pro/consultations/${selectedAptToReschedule.id}/reschedule`, {
        date_heure: dateHeure
      });
      if (res.data.success) {
        setShowRescheduleModal(false);
        setSelectedAptToReschedule(null);
        fetchConsultations();
        showSuccessNotification('reprogramme', patientName);
      }
    } catch (error) {
      console.error('Erreur lors de la reprogrammation:', error);
    }
  };

  const fetchPatientHistory = async (patientId, currentDm) => {
    setPatientHistory([]);
    setIsLoadingHistory(true);
    try {
      const res = await axios.get(`/pro/patients/${patientId}/dossier-complet`);
      if (res.data.success) {
        const dm = res.data.data.dossier_medical;
        setGroupeSanguin(dm?.groupe_sanguin || '');
        setMaladiesChroniques(dm?.maladies_chroniques || '');
        setPoids(dm?.poids || '');
        setTaille(dm?.taille || '');
        setPatientHistory(res.data.data.historique_consultations || []);
      }
    } catch (err) {
      console.error('Erreur chargement dossier complet', err);
      setGroupeSanguin(currentDm?.groupe_sanguin || '');
      setMaladiesChroniques(currentDm?.maladies_chroniques || '');
      setPoids(currentDm?.poids || '');
      setTaille(currentDm?.taille || '');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleStartConsultation = (c) => {
    setActiveConsultation(c);
    setNotes('');
    setOrdonnance('');
    setDiagnostique('');
    setShowOrdonnance(false);
    setShowDiagnostique(false);
    setViewMode(false);
    setActiveConsViewMode('full');

    // Initialize medical record fields & fetch history
    const dm = c.patient?.dossier_medical;
    fetchPatientHistory(c.patient.id, dm);
  };

  const handleSlotClick = (c) => {
    setActiveConsultation(c);

    const dm = c.patient?.dossier_medical;
    fetchPatientHistory(c.patient.id, dm);

    if (c.statut === 'en_attente') {
      setActiveConsViewMode('contact-only');
    } else if (c.statut === 'termine') {
      setActiveConsViewMode('view');
      setViewMode(true);
      setNotes(c.consultation?.notes || '');
      setOrdonnance(c.consultation?.ordonnances?.[0]?.medicaments || '');
      setDiagnostique(c.consultation?.diagnostique || '');
      setShowOrdonnance(!!c.consultation?.ordonnances?.[0]);
      setShowDiagnostique(!!c.consultation?.diagnostique);
    } else if (c.statut === 'annule') {
      setActiveConsViewMode('reschedule-only');
    } else {
      // confirme
      setActiveConsViewMode('confirmed');
    }
  };

  const handleViewConsultation = (c) => {
    handleSlotClick(c);
  };

  const handleSaveNotes = async () => {
    if (!activeConsultation) return;
    setIsSavingNotes(true);
    try {
      const res = await axios.post(`/pro/consultations/${activeConsultation.id}/notes`, {
        notes,
        diagnostique: showDiagnostique ? diagnostique : null,
        ordonnance: showOrdonnance ? ordonnance : null,
        groupe_sanguin: groupeSanguin,
        maladies_chroniques: maladiesChroniques,
        poids,
        taille
      });
      if (res.data.success) {
        showAlert({ title: 'Succès', message: 'Consultation enregistrée avec succès.', type: 'success' });
        setActiveConsultation(null);
        fetchConsultations(); // Refresh list
      }
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement des notes:', err);
      showAlert({ title: 'Erreur', message: 'Erreur lors de l\'enregistrement des notes.', type: 'error' });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const statusCfg = {
    confirme: { label: 'Confirmé', cls: 'info' },
    en_attente: { label: 'En attente', cls: 'warning' },
    termine: { label: 'Terminé', cls: 'success' },
    annule: { label: 'Annulé', cls: 'danger' },
  };

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

  const stats = [
    { label: 'Total', value: consultations.length, color: '#8B5CF6' },
    { label: 'À venir', value: consultations.filter(c => c.statut === 'en_attente' || c.statut === 'confirme').length, color: '#6366F1' },
    { label: 'Terminées', value: consultations.filter(c => c.statut === 'termine').length, color: '#10B981' },
    { label: 'Annulées', value: consultations.filter(c => c.statut === 'annule').length, color: '#EF4444' },
  ];

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(year, month - 1, day).toLocaleDateString('fr-FR', options);
  };

  // Computation helper
  const filteredConsultations = consultations.filter(c => {
    const matchFilter = filter === 'tous' || c.statut === filter;
    const matchSearch = !searchTerm ||
      c.patient?.user?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.patient?.user?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.service?.nom?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  let gridStartHour = 8;
  let gridEndHour = 20;

  if (creneaux && creneaux.length > 0) {
    let minH = 24;
    let maxH = 0;
    creneaux.forEach(c => {
      if (!c.heure_debut || !c.heure_fin) return;
      const sH = parseInt(c.heure_debut.split(':')[0], 10);
      let eH = parseInt(c.heure_fin.split(':')[0], 10);
      const eM = parseInt(c.heure_fin.split(':')[1], 10);
      if (eM > 0) eH += 1;

      if (sH < minH) minH = sH;
      if (eH > maxH) maxH = eH;
    });
    if (minH < 24) gridStartHour = minH;
    if (maxH > 0) gridEndHour = maxH;
  }

  if (gridEndHour <= gridStartHour) {
    gridEndHour = gridStartHour + 8;
  }

  const totalHalfHours = (gridEndHour - gridStartHour) * 2;

  return (
    <div className={`cons-container ${darkMode ? 'dark-mode' : ''}`}>
      {!activeConsultation && <Sidebar links={sidebarLinks} />}

      <main className={`cons-main ${activeConsultation ? 'no-sidebar' : ''}`}>

        {/* Header */}
        <div className="cons-header">
          <div>
            <h1>Mes Consultations</h1>
            <p className="cons-subtitle">Gérez vos rendez-vous et comptes-rendus médicaux</p>
          </div>
          <div className="pro-header-actions" style={{ gap: '5px', display: 'flex', alignItems: 'center' }}>
            <Link to="/professionnel/creneaux" className="notif-trigger-btn" title="Agenda" style={{ textDecoration: 'none' }}>
              <Calendar size={22} />
            </Link>
            <Link to="/professionnel/profil" className="notif-trigger-btn" title="Paramètres" style={{ textDecoration: 'none' }}>
              <Settings size={22} />
            </Link>
            <NotificationsMenu />
            
            <div style={{ width: '1px', height: '30px', background: '#cbd5e1', margin: '0 5px' }}></div>
            
            <Link to="/professionnel/profil" className="pro-user-info" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 9px', border: '1px solid #ffffffff', borderRadius: '50px', textDecoration: 'none', cursor: 'pointer', background: '#ffffff', transition: 'all 0.2s' }}>
              <User size={18} color="#000000ff" />
              <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#050505ff' }}>
                Dr. {user?.nom}
              </span>
            </Link>
          </div>
        </div>

        {/* --- MAIN DASHBOARD CONTENT --- */}
        <div className="cons-stats">
          {stats.map((stat, i) => (
            <div key={i} className="cons-stat-card">
              <div className="cons-stat-value" style={{ color: stat.color }}>{stat.value}</div>
              <div className="cons-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="cons-filters-box">
          <div className="cons-search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Rechercher un patient ou un motif..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="cons-filter-tabs">
            {['tous', 'confirme', 'termine', 'annule'].map(f => (
              <button
                key={f}
                className={`cons-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'tous' ? 'Tous' : f === 'confirme' ? 'Confirmés' : f === 'termine' ? 'Terminés' : 'Annulés'}
              </button>
            ))}
          </div>

          <div className="cons-view-toggle">
            <button
              className={`view-toggle-btn ${viewType === 'liste' ? 'active' : ''}`}
              onClick={() => setViewType('liste')}
            >
              <Users size={18} /> Liste
            </button>
            <button
              className={`view-toggle-btn ${viewType === 'agenda' ? 'active' : ''}`}
              onClick={() => setViewType('agenda')}
            >
              <Calendar size={18} /> Agenda
            </button>
          </div>
        </div>



        {viewType === 'liste' ? (
          <div className="cons-list-view-container">
            {loading ? (
              <div className="cons-loading">Chargement des rendez-vous...</div>
            ) : filteredConsultations.length === 0 ? (
              <div className="cons-loading">Aucun rendez-vous trouvé</div>
            ) : (
              <>
                <div className="cons-list-header">
                  <span>Patient</span>
                  <span>Date & Heure</span>
                  <span>Statut</span>
                  <span style={{ textAlign: 'right' }}>Actions</span>
                </div>
                <div className="cons-card-list">
                  {filteredConsultations
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((c) => {
                      const cfg = statusCfg[c.statut] || statusCfg.en_attente;
                      const sTimeStr = c.date_heure.split('T')[1].substring(0, 5); // "08:00"
                      const [sH, sM] = sTimeStr.split(':');
                      let startHour = parseInt(sH, 10);
                      let startMin = parseInt(sM, 10);

                      let endHour = startHour;
                      let endMin = startMin + 30; // default 30 mins
                      if (endMin >= 60) {
                        endHour += Math.floor(endMin / 60);
                        endMin = endMin % 60;
                      }

                      const timeStr = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')} - ${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

                      return (
                        <div key={c.id} className="cons-card-item" onClick={() => handleSlotClick(c)}>
                          <div className="table-patient-cell">
                            <div className="table-avatar">
                              {getInitials(c.patient?.user?.nom + ' ' + c.patient?.user?.prenom)}
                            </div>
                            <div className="table-patient-info">
                              <span className="tp-name">{c.patient?.user?.nom} {c.patient?.user?.prenom}</span>
                              <span className="tp-id">PAT-{String(c.patient_id).padStart(3, '0')}</span>
                            </div>
                          </div>
                          <div className="table-date-cell">
                            <span className="td-date"><Calendar size={16} /> {formatDate(c.date_heure)}</span>
                            <span className="td-time"><Clock size={16} /> {timeStr}</span>
                          </div>
                          <div className="table-status-cell">
                            <span className={`cons-status-badge ${cfg.cls}`}>
                              <div className="status-dot"></div>
                              {cfg.label}
                            </span>
                          </div>
                          <div className="table-actions-container" style={{ justifyContent: 'flex-end' }}>
                            {c.statut === 'confirme' && (
                              <button className="table-action-btn btn-start-cons" onClick={(e) => { e.stopPropagation(); handleStartConsultation(c); }}>
                                <Activity size={18} /> Démarrer
                              </button>
                            )}
                            <button className="table-action-btn btn-manage" onClick={(e) => { e.stopPropagation(); handleSlotClick(c); }}>
                              <Eye size={18} /> Gérer
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="agenda-layout-container">
            {/* Main Calendar Section */}
            <div className="agenda-main-section">
              <div className="calendar-header-controls">
                <div className="current-month-label">
                  {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                </div>
                <div className="calendar-nav-btns">
                  <button className="nav-btn" onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
                  <button className="today-btn" onClick={handleToday}>Ce mois-ci</button>
                  <button className="nav-btn" onClick={handleNextMonth}><ChevronRight size={20} /></button>
                </div>
              </div>

              <div className="monthly-calendar-grid">
                {/* Days of week header */}
                <div className="grid-header-row">
                  {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map((d, i) => {
                    const today = new Date();
                    let dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
                    const normalizedTodayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    const isTodayColumn = normalizedTodayIdx === i;

                    return (
                      <div key={d} className={`grid-header-cell ${isTodayColumn ? 'active-column' : ''}`}>
                        {isTodayColumn ? <span className="active-day-label">{d}</span> : d}
                      </div>
                    );
                  })}
                </div>

                {/* Day cells */}
                <div className="grid-days-container">
                  {calendarDays.map((dayObj, idx) => {
                    const dateStr = `${dayObj.year}-${String(dayObj.month + 1).padStart(2, '0')}-${String(dayObj.day).padStart(2, '0')}`;
                    const dayApts = getAppointmentsForDay(dateStr);
                    const isToday = new Date().toDateString() === new Date(dayObj.year, dayObj.month, dayObj.day).toDateString();
                    const isSelected = selectedDay === dateStr;
                    const isWeekend = (idx % 7 === 5) || (idx % 7 === 6);

                    return (
                      <div
                        key={idx}
                        className={`grid-day-cell ${!dayObj.current ? 'not-current' : ''} ${isToday ? 'is-today-cell' : ''} ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => setSelectedDay(dateStr)}
                      >
                        <div className={`day-number-label ${isWeekend ? 'weekend' : ''}`}>{dayObj.day}</div>
                        <div className="day-apts-container">
                          {dayApts.slice(0, dayApts.length > 2 ? 1 : 2).map(apt => {
                            const timeStr = apt.date_heure.split('T')[1].substring(0, 5);
                            return (
                              <div key={apt.id} className={`apt-pill status-${apt.statut}`} onClick={() => handleSlotClick(apt)}>
                                {timeStr} {apt.patient?.user?.nom}
                              </div>
                            );
                          })}
                          {dayApts.length > 2 && (
                            <div className="more-apts" onClick={(e) => { e.stopPropagation(); setShowAllAptsForDay(dateStr); }}>
                              +{dayApts.length - 1} autres
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar Section */}
            <div className="agenda-sidebar">
              <div className="sidebar-card">
                <div className="sidebar-card-header">
                  <h3>Calendrier</h3>
                  <span>{monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}</span>
                </div>
                <div className="mini-calendar-container">
                  <div className="mini-calendar-nav">
                    <span>{monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}</span>
                    <div className="mini-nav-btns">
                      <ChevronLeft size={16} onClick={handlePrevMonth} />
                      <ChevronRight size={16} onClick={handleNextMonth} />
                    </div>
                  </div>
                  <div className="mini-days-header">
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i}>{d}</span>)}
                  </div>
                  <div className="mini-grid">
                    {calendarDays.slice(0, 42).map((d, i) => {
                      const dateStr = `${d.year}-${String(d.month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
                      const dayApts = getAppointmentsForDay(dateStr);
                      const isToday = new Date().toDateString() === new Date(d.year, d.month, d.day).toDateString();
                      return (
                        <div key={i} className={`mini-day-box ${d.current ? 'current' : 'not-current'} ${isToday ? 'today' : ''}`}>
                          <span>{d.day}</span>
                          {dayApts.length > 0 && <div className="mini-apt-dot"></div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="sidebar-card">
                <div className="sidebar-card-header">
                  <h3>Prochains RDV</h3>
                  <span>Aujourd'hui</span>
                </div>
                <div className="sidebar-rdv-list">
                  {(() => {
                    const today = new Date();
                    const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    const todaysApts = getAppointmentsForDay(todayDateStr);
                    return todaysApts.length > 0 ? (
                      todaysApts.map(apt => {
                        const timeStr = apt.date_heure.split('T')[1].substring(0, 5);
                        return (
                          <div key={apt.id} className="sidebar-rdv-item" onClick={() => handleSlotClick(apt)}>
                            <div className="rdv-time-box">{timeStr}</div>
                            <div className="rdv-details">
                              <span className="rdv-patient-name">{apt.patient?.user?.nom} {apt.patient?.user?.prenom}</span>
                              <span className="rdv-doctor-name">Dr. {user?.nom}</span>
                            </div>
                            <div className={`status-dot-mini ${apt.statut}`}></div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ textAlign: 'center', padding: '15px 0', fontSize: '0.8rem', color: '#94a3b8' }}>Aucun rendez-vous pour aujourd'hui</div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination UI - using filteredConsultations */}
        {!loading && filteredConsultations.length > itemsPerPage && (
          <div className="cons-pagination">
            <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
              <ChevronLeft size={18} /> Précédent
            </button>
            <div className="pagination-numbers">
              {Array.from({ length: Math.ceil(filteredConsultations.length / itemsPerPage) }, (_, i) => (
                <button key={i} className={`page-number ${currentPage === i + 1 ? 'active' : ''}`} onClick={() => setCurrentPage(i + 1)}>
                  {i + 1}
                </button>
              ))}
            </div>
            <button className="pagination-btn" disabled={currentPage === Math.ceil(filteredConsultations.length / itemsPerPage)} onClick={() => setCurrentPage(p => p + 1)}>
              Suivant <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Modal Voir tous les rendez-vous du jour */}
        {showAllAptsForDay && (
          <div className="all-apts-overlay" onClick={() => setShowAllAptsForDay(null)}>
            <div className="all-apts-modal" onClick={e => e.stopPropagation()}>
              <div className="all-apts-header">
                <h3>Rendez-vous du {formatDate(showAllAptsForDay)}</h3>
                <button className="close-all-btn" onClick={() => setShowAllAptsForDay(null)}><X size={20} /></button>
              </div>
              <div className="all-apts-body">
                {getAppointmentsForDay(showAllAptsForDay).map(apt => (
                  <div key={apt.id} className={`all-apt-item status-${apt.statut}`} onClick={() => { handleSlotClick(apt); setShowAllAptsForDay(null); }}>
                    <div className="all-apt-time">{apt.date_heure.split('T')[1].substring(0, 5)}</div>
                    <div className="all-apt-info">
                      <span className="all-apt-patient">{apt.patient?.user?.nom} {apt.patient?.user?.prenom}</span>
                      <span className="all-apt-service">{apt.service?.nom}</span>
                    </div>
                    <div className="all-apt-action">Gérer</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal Reprogrammation */}
        {showRescheduleModal && (
          <div className="cons-modal-overlay">
            <div className="cons-modal-container">
              <div className="cons-modal-header">
                <h2>Reprogrammer</h2>
                <button className="cons-modal-close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cons-text)' }} onClick={() => setShowRescheduleModal(false)}><X size={24} /></button>
              </div>
              <div className="cons-modal-content">
                <p>Nouvelle date pour <strong>{selectedAptToReschedule?.patient?.user?.nom} {selectedAptToReschedule?.patient?.user?.prenom}</strong> :</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="active-cons-textarea" />
                  <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="active-cons-textarea" />
                </div>
              </div>
              <div className="cons-modal-footer">
                <button className="pagination-btn" onClick={() => setShowRescheduleModal(false)}>Annuler</button>
                <button className="btn-save-finish" onClick={handleReschedule}>Valider</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmation Annulation */}
        {showCancelModal && aptToCancel && (
          <div className="cons-modal-overlay">
            <div className="cons-modal-container cancel-modal" style={{ maxWidth: '400px' }}>
              <div className="cons-modal-header">
                <h2>Annuler le rendez-vous</h2>
                <button className="icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cons-text)' }} onClick={() => setShowCancelModal(false)}><X size={20} /></button>
              </div>
              <div className="cons-modal-content">
                <p style={{ marginBottom: '1rem' }}>Êtes-vous sûr de vouloir annuler ce rendez-vous ? L'action est irréversible.</p>
              </div>
              <div className="cons-modal-footer" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button className="pagination-btn" onClick={() => setShowCancelModal(false)}>Non, garder</button>
                <button className="table-action-btn btn-cancel-appt" style={{ width: 'auto' }} onClick={() => handleStatusChange(aptToCancel.id, 'annule')}>
                  Oui, annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmation Confirmer */}
        {showConfirmModal && aptToConfirm && (
          <div className="cons-modal-overlay">
            <div className="cons-modal-container cancel-modal" style={{ maxWidth: '400px' }}>
              <div className="cons-modal-header">
                <h2>Confirmer le rendez-vous</h2>
                <button className="icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cons-text)' }} onClick={() => setShowConfirmModal(false)}><X size={20} /></button>
              </div>
              <div className="cons-modal-content">
                <p style={{ marginBottom: '1rem' }}>Voulez-vous confirmer le rendez-vous de <strong>{aptToConfirm?.patient?.user?.nom}</strong> ?</p>
              </div>
              <div className="cons-modal-footer" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button className="pagination-btn" onClick={() => setShowConfirmModal(false)}>Annuler</button>
                <button className="table-action-btn btn-confirm-appt" style={{ width: 'auto' }} onClick={() => handleStatusChange(aptToConfirm.id, 'confirme')}>
                  Oui, confirmer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contextual Active Consultation Modal */}
        {activeConsultation && (
          <div className="cons-modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '5vh' }}>
            <div className="active-cons-card" style={{ maxHeight: '90vh', overflowY: 'auto', width: '90vw', maxWidth: '900px', backgroundColor: 'var(--cons-white)', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              <div className="active-cons-header">
                <h2>
                  {activeConsViewMode === 'contact-only' ? 'Détails du Rendez-vous (En attente)' :
                    activeConsViewMode === 'reschedule-only' ? 'Rendez-vous Annulé' :
                      activeConsViewMode === 'confirmed' ? 'Détails du Rendez-vous (Confirmé)' :
                        activeConsViewMode === 'view' ? 'Compte-rendu de consultation' :
                          'Consultation en cours'}
                </h2>
                <button className="icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cons-text)' }} onClick={() => setActiveConsultation(null)}>
                  <X size={24} />
                </button>
              </div>

              <div className="active-cons-patient-card">
                <div className="active-cons-avatar">
                  {getInitials(activeConsultation.patient?.user?.nom + ' ' + activeConsultation.patient?.user?.prenom)}
                </div>
                <div className="active-cons-details">
                  <h3>{activeConsultation.patient?.user?.nom} {activeConsultation.patient?.user?.prenom} <span style={{ fontSize: '0.9rem', color: 'var(--cons-gray-500)', fontWeight: 500, marginLeft: '8px' }}>({formatDate(activeConsultation.date_heure)})</span></h3>
                  <div className="active-cons-info-row">
                    <span><strong>Motif :</strong> {activeConsultation.service?.nom || activeConsultation.motif || 'Non spécifié'}</span>
                    <div className="active-cons-divider"></div>
                    <span><Phone size={14} style={{ marginRight: '4px' }} /> <strong>Tél :</strong> {activeConsultation.patient?.user?.telephone || 'Non renseigné'}</span>
                    <div className="active-cons-divider"></div>
                    <span><Mail size={14} style={{ marginRight: '4px' }} /> <strong>Email :</strong> {activeConsultation.patient?.user?.email || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>

              {(activeConsViewMode === 'full' || activeConsViewMode === 'view') && (
                <>
                  <div className="active-cons-medical-record">
                    <div className="record-header">
                      <Activity size={18} />
                      <h4>Dossier Médical</h4>
                    </div>
                    <div className="record-grid">
                      <div className="record-field">
                        <label>Date de Naissance</label>
                        <input
                          type="text"
                          value={activeConsultation.patient?.date_naissance ? new Date(activeConsultation.patient.date_naissance).toLocaleDateString('fr-FR') : 'Non renseignée'}
                          readOnly
                          style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-gray)' }}
                        />
                      </div>

                      <div className="record-field">
                        <label>Groupe Sanguin</label>
                        <input
                          type="text"
                          placeholder="Ex: A+"
                          value={groupeSanguin}
                          onChange={(e) => setGroupeSanguin(e.target.value)}
                          readOnly={viewMode}
                        />
                      </div>
                      <div className="record-field">
                        <label>Poids (kg)</label>
                        <input
                          type="number"
                          placeholder="Ex: 75"
                          value={poids}
                          onChange={(e) => setPoids(e.target.value)}
                          readOnly={viewMode}
                        />
                      </div>
                      <div className="record-field">
                        <label>Taille (cm)</label>
                        <input
                          type="number"
                          placeholder="Ex: 175"
                          value={taille}
                          onChange={(e) => setTaille(e.target.value)}
                          readOnly={viewMode}
                        />
                      </div>
                      <div className="record-field span-full">
                        <label>Maladies Chroniques</label>
                        <textarea
                          placeholder="Listez les pathologies chroniques ou antécédents majeurs..."
                          value={maladiesChroniques}
                          onChange={(e) => setMaladiesChroniques(e.target.value)}
                          readOnly={viewMode}
                          className="active-cons-textarea"
                        />
                      </div>
                    </div>
                  </div>

                  {isLoadingHistory ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-gray)' }}>
                      <Activity size={24} style={{ animation: 'spin 1s linear infinite' }} /> Chargement de l'historique...
                    </div>
                  ) : (
                    patientHistory.length > 0 && (
                      <div className="active-cons-medical-record" style={{ marginTop: '20px' }}>
                        <div className="record-header" style={{ marginBottom: '15px' }}>
                          <Clock size={18} />
                          <h4>Historique des 5 derniers mois</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '300px', overflowY: 'auto' }}>
                          {patientHistory.map((hist, idx) => (
                            <div key={idx} style={{ padding: '15px 20px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid var(--primary)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'relative' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Calendar size={16} color="var(--primary)" />
                                  <strong style={{ fontSize: '1rem', color: 'var(--text-dark)' }}>
                                    {new Date(hist.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                  </strong>
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', backgroundColor: 'var(--bg-light)', padding: '4px 10px', borderRadius: '20px' }}>
                                  {hist.rendez_vous?.service?.nom || 'Consultation standard'}
                                </span>
                              </div>
                              {hist.notes && (
                                <div style={{ fontSize: '0.95rem', color: 'var(--text-dark)', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9', lineHeight: '1.5' }}>
                                  <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#64748b', fontSize: '0.85rem' }}>
                                    <FileText size={14} /> Notes du médecin
                                  </strong>
                                  {hist.notes}
                                </div>
                              )}
                              {hist.ordonnances && hist.ordonnances.length > 0 && hist.ordonnances[0].medicaments && (
                                <div style={{ fontSize: '0.95rem', color: 'var(--text-dark)', background: '#f0f9ff', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd', marginTop: '12px' }}>
                                  <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#0284c7', fontSize: '0.85rem' }}>
                                    <FileText size={14} /> Ordonnance
                                  </strong>
                                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{hist.ordonnances[0].medicaments}</div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  <div className="cons-section" style={{ marginTop: '20px' }}>
                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '1rem' }}><FileText size={18} /> Notes de consultation</label>
                    <textarea
                      className={`active-cons-textarea ${viewMode ? 'view-only' : ''}`}
                      rows={8}
                      placeholder={viewMode ? "Aucune note saisie." : "Saisissez les notes, observations ou compte rendu..."}
                      value={notes}
                      readOnly={viewMode}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  {showDiagnostique && (
                    <div className="cons-section">
                      <label style={{ fontWeight: 700, display: 'block', marginBottom: '1rem' }}><Activity size={18} /> Diagnostic</label>
                      <textarea
                        className={`active-cons-textarea ${viewMode ? 'view-only' : ''}`}
                        rows={6}
                        placeholder={viewMode ? "Aucun diagnostic." : "Saisissez le diagnostic médical..."}
                        value={diagnostique}
                        readOnly={viewMode}
                        onChange={(e) => setDiagnostique(e.target.value)}
                      />
                    </div>
                  )}

                  {showOrdonnance && (
                    <div className="cons-section">
                      <label style={{ fontWeight: 700, display: 'block', marginBottom: '1rem' }}><Activity size={18} /> Ordonnance</label>
                      <textarea
                        className={`active-cons-textarea ${viewMode ? 'view-only' : ''}`}
                        rows={6}
                        placeholder={viewMode ? "Aucune ordonnance." : "Médicaments et posologies..."}
                        value={ordonnance}
                        readOnly={viewMode}
                        onChange={(e) => setOrdonnance(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}

              <div className="cons-modal-footer">
                {activeConsViewMode === 'contact-only' && (
                  <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
                    <button 
                      className="table-action-btn btn-confirm-appt" 
                      onClick={() => { setAptToConfirm(activeConsultation); setShowConfirmModal(true); setActiveConsultation(null); }}
                      disabled={activeConsultation.reprogrammed}
                      style={activeConsultation.reprogrammed ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      title={activeConsultation.reprogrammed ? "En attente de la confirmation du patient suite à la reprogrammation" : ""}
                    >
                      <CheckCircle size={16} /> {activeConsultation.reprogrammed ? "En attente du patient" : "Confirmer"}
                    </button>
                    <button className="table-action-btn btn-resched-appt" onClick={() => {
                      setSelectedAptToReschedule(activeConsultation);
                      setNewDate(activeConsultation.date_heure.split('T')[0]);
                      setNewTime(activeConsultation.date_heure.split('T')[1].substring(0, 5));
                      setShowRescheduleModal(true);
                      setActiveConsultation(null);
                    }}>
                      <Calendar size={16} /> Reprogrammer
                    </button>
                    <button className="table-action-btn btn-cancel-appt" onClick={() => {
                      setAptToCancel(activeConsultation);
                      setShowCancelModal(true);
                      setActiveConsultation(null);
                    }}>
                      <X size={16} /> Annuler
                    </button>
                    <button className="btn-save-finish" onClick={() => setActiveConsultation(null)} style={{ marginLeft: 'auto' }}>
                      Fermer
                    </button>
                  </div>
                )}

                {activeConsViewMode === 'reschedule-only' && (
                  <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
                    <button className="table-action-btn btn-resched-appt" onClick={() => {
                      setSelectedAptToReschedule(activeConsultation);
                      setNewDate(activeConsultation.date_heure.split('T')[0]);
                      setNewTime(activeConsultation.date_heure.split('T')[1].substring(0, 5));
                      setShowRescheduleModal(true);
                      setActiveConsultation(null);
                    }}>
                      <Calendar size={16} /> Reprogrammer
                    </button>
                    <button className="btn-save-finish" onClick={() => setActiveConsultation(null)} style={{ marginLeft: 'auto' }}>
                      Fermer
                    </button>
                  </div>
                )}

                {activeConsViewMode === 'confirmed' && (
                  <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
                    <button className="table-action-btn btn-start-cons" onClick={() => { handleStartConsultation(activeConsultation); }}>
                      <Activity size={16} /> Démarrer Diagnostic
                    </button>
                    <button className="table-action-btn btn-resched-appt" onClick={() => {
                      setSelectedAptToReschedule(activeConsultation);
                      setNewDate(activeConsultation.date_heure.split('T')[0]);
                      setNewTime(activeConsultation.date_heure.split('T')[1].substring(0, 5));
                      setShowRescheduleModal(true);
                      setActiveConsultation(null);
                    }}>
                      <Calendar size={16} /> Reprogrammer
                    </button>
                    <button className="table-action-btn btn-cancel-appt" onClick={() => {
                      setAptToCancel(activeConsultation);
                      setShowCancelModal(true);
                      setActiveConsultation(null);
                    }}>
                      <X size={16} /> Annuler
                    </button>
                    <button className="btn-save-finish" onClick={() => setActiveConsultation(null)} style={{ marginLeft: 'auto' }}>
                      Fermer
                    </button>
                  </div>
                )}

                {activeConsViewMode === 'view' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                    <button className="btn-save-finish" onClick={() => setActiveConsultation(null)}>
                      Fermer le compte-rendu
                    </button>
                  </div>
                )}

                {activeConsViewMode === 'full' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        className="pagination-btn"
                        onClick={() => setShowDiagnostique(!showDiagnostique)}
                      >
                        {showDiagnostique ? <X size={18} /> : <Activity size={18} />}
                        {showDiagnostique ? "Retirer le diagnostic" : "Ajouter un diagnostic"}
                      </button>
                      <button
                        className="pagination-btn"
                        onClick={() => setShowOrdonnance(!showOrdonnance)}
                      >
                        {showOrdonnance ? <X size={18} /> : <FileText size={18} />}
                        {showOrdonnance ? "Retirer l'ordonnance" : "Ajouter une ordonnance"}
                      </button>
                    </div>
                    <button className="btn-save-finish" onClick={handleSaveNotes} disabled={isSavingNotes}>
                      <Save size={18} /> {isSavingNotes ? 'Enregistrement...' : 'Enregistrer et Terminer'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Success Notification Modal ── */}
        {successNotif && (
          <div className="success-notif-overlay" onClick={() => setSuccessNotif(null)}>
            <div className="success-notif-card" onClick={e => e.stopPropagation()}>
              <div className={`success-notif-icon-ring ${
                successNotif.type === 'confirme' ? 'ring-success' :
                successNotif.type === 'annule' ? 'ring-danger' : 'ring-warning'
              }`}>
                <div className={`success-notif-icon-bg ${
                  successNotif.type === 'confirme' ? 'bg-success' :
                  successNotif.type === 'annule' ? 'bg-danger' : 'bg-warning'
                }`}>
                  {successNotif.type === 'confirme' && <CheckCircle size={32} />}
                  {successNotif.type === 'annule' && <X size={32} />}
                  {successNotif.type === 'reprogramme' && <Calendar size={32} />}
                </div>
              </div>
              <h3 className="success-notif-title">
                {successNotif.type === 'confirme' && 'Rendez-vous confirmé'}
                {successNotif.type === 'annule' && 'Rendez-vous annulé'}
                {successNotif.type === 'reprogramme' && 'Rendez-vous reprogrammé'}
              </h3>
              <p className="success-notif-message">
                {successNotif.type === 'confirme' && (
                  <>Le rendez-vous de <strong>{successNotif.patientName}</strong> a été confirmé avec succès.</>
                )}
                {successNotif.type === 'annule' && (
                  <>Le rendez-vous de <strong>{successNotif.patientName}</strong> a été annulé.</>
                )}
                {successNotif.type === 'reprogramme' && (
                  <>Le rendez-vous de <strong>{successNotif.patientName}</strong> a été reprogrammé avec succès.</>
                )}
              </p>
              <button className={`success-notif-btn ${
                successNotif.type === 'confirme' ? 'btn-notif-success' :
                successNotif.type === 'annule' ? 'btn-notif-danger' : 'btn-notif-warning'
              }`} onClick={() => setSuccessNotif(null)}>Compris</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Consultation;
