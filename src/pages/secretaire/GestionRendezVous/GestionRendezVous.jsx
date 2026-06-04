import { useState, useEffect } from 'react';
import Sidebar from '../../../components/common/Sidebar';
import axios from '../../../api/axios';
import {
  Calendar, Users, FileText, Clock,
  Search, Eye, Edit, Activity, Moon, Sun, Bell,
  User, X, Briefcase, Settings, CheckCircle, AlertCircle, Save, ChevronLeft, Hospital, ChevronRight, Phone, Mail
} from 'lucide-react';
import './GestionRendezVous.css';
import './GestionRendezVous.css';
import { Link } from 'react-router-dom';
import NotificationsMenu from '../../../components/common/NotificationsMenu';
import { useAlert } from '../../../context/AlertContext';
const GestionRendezVous = () => {
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
  const { showAlert } = useAlert();

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
    // fetchCreneaux(); // Secretary might not have slots management
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
      const response = await axios.get('/profile'); // Generic profile endpoint
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

      const response = await axios.get('/secretaire/rendez-vous', { params });
      if (response.data.success) {
        setConsultations(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await axios.put(`/pro/consultations/${id}/status`, { statut: newStatus });
      if (res.data.success) {
        fetchConsultations();
        setShowCancelModal(false);
        setShowConfirmModal(false);
        showAlert({ 
            title: 'Succès', 
            message: `Le statut du rendez-vous a été mis à jour avec succès.`, 
            type: 'success' 
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime || !selectedAptToReschedule) return;
    try {
      const dateHeure = `${newDate} ${newTime}`;
      const res = await axios.put(`/pro/consultations/${selectedAptToReschedule.id}/reschedule`, {
        date_heure: dateHeure
      });
      if (res.data.success) {
        showAlert({ title: 'Succès', message: 'Rendez-vous reprogrammé avec succès.', type: 'success' });
        setShowRescheduleModal(false);
        fetchConsultations();
      }
    } catch (error) {
      console.error('Erreur lors de la reprogrammation:', error);
      showAlert({ title: 'Erreur', message: 'Erreur lors de la reprogrammation.', type: 'error' });
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

    // Initialize medical record fields
    const dm = c.patient?.dossier_medical;
    setGroupeSanguin(dm?.groupe_sanguin || '');
    setMaladiesChroniques(dm?.maladies_chroniques || '');
    setPoids(dm?.poids || '');
    setTaille(dm?.taille || '');
  };

  const handleSlotClick = (c) => {
    setActiveConsultation(c);

    // Initialize medical record fields
    const dm = c.patient?.dossier_medical;
    setGroupeSanguin(dm?.groupe_sanguin || '');
    setMaladiesChroniques(dm?.maladies_chroniques || '');
    setPoids(dm?.poids || '');
    setTaille(dm?.taille || '');

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
    { path: '/secretaire/dashboard', label: 'Tableau de bord', icon: <Activity size={20} /> },
    { path: '/secretaire/rendez-vous', label: 'Gestion RDV', icon: <Calendar size={20} /> },
    { path: '/secretaire/patients', label: 'Gestion Patients', icon: <Users size={20} /> },
    { path: '/secretaire/cabinet', label: 'Mon Cabinet', icon: <Hospital size={20} /> },
    { path: '/secretaire/profil', label: 'Mon profil', icon: <User size={20} /> },
  ];

  const stats = [
    { label: 'Total', value: consultations.length, color: '#8B5CF6' },
    { label: 'À venir', value: consultations.filter(c => c.statut === 'en_attente' || c.statut === 'confirme').length, color: '#6366F1' },
    { label: 'Terminées', value: consultations.filter(c => c.statut === 'termine').length, color: '#10B981' },
    { label: 'Annulées', value: consultations.filter(c => c.statut === 'annule').length, color: '#EF4444' },
  ];

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
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

  return (
    <div className={`rdv-container ${darkMode ? 'dark-mode' : ''}`}>
      {!activeConsultation && <Sidebar links={sidebarLinks} />}

      <main className={`rdv-main ${activeConsultation ? 'no-sidebar' : ''}`}>

        {/* Header */}
        <div className="rdv-header">
          <div>
            <h1>Gestion des rendez-vous</h1>
            <p className="rdv-subtitle">Gérez et organisez les consultations du cabinet</p>
          </div>
          <div className="pro-header-actions" style={{ gap: '5px', display: 'flex', alignItems: 'center' }}>
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

        {/* Stats Row */}
        <div className="rdv-stats">
          {stats.map((stat, i) => (
            <div key={i} className="rdv-stat-card">
              <div className="rdv-stat-value" style={{ color: stat.color }}>{stat.value}</div>
              <div className="rdv-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="rdv-filters-box">
          <div className="rdv-search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Rechercher un patient ou un motif..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="rdv-filter-tabs">
            {['tous', 'confirme', 'termine', 'annule'].map(f => (
              <button
                key={f}
                className={`rdv-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'tous' ? 'Tous' : f === 'confirme' ? 'Confirmés' : f === 'termine' ? 'Terminés' : 'Annulés'}
              </button>
            ))}
          </div>

          <div className="rdv-view-toggle">
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
          <div className="rdv-list-view-container">
            {loading ? (
              <div className="cons-loading">Chargement des rendez-vous...</div>
            ) : filteredConsultations.length === 0 ? (
              <div className="cons-loading">Aucun rendez-vous trouvé</div>
            ) : (
              <>
                <div className="rdv-list-header">
                  <span>Patient</span>
                  <span>Date & Heure</span>
                  <span>Statut</span>
                  <span style={{ textAlign: 'right' }}>Actions</span>
                </div>
                <div className="rdv-card-list">
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
                        <div key={c.id} className="rdv-card-item" onClick={() => handleSlotClick(c)}>
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
                            <span className={`rdv-status-badge ${cfg.cls}`}>
                              <div className="status-dot"></div>
                              {cfg.label}
                            </span>
                          </div>
                          <div className="table-actions-container" style={{ justifyContent: 'flex-end' }}>
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

                    return (
                      <div
                        key={idx}
                        className={`grid-day-cell ${!dayObj.current ? 'not-current' : ''} ${isToday ? 'is-today-cell' : ''} ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => setSelectedDay(dateStr)}
                      >
                        <div className="day-number-label">{dayObj.day}</div>
                        <div className="day-apts-container">
                          {dayApts.slice(0, 1).map(apt => {
                            const timeStr = apt.date_heure.split('T')[1].substring(0, 5);
                            return (
                              <div key={apt.id} className={`apt-pill status-${apt.statut}`} onClick={() => handleSlotClick(apt)}>
                                {timeStr} {apt.patient?.user?.nom}
                              </div>
                            );
                          })}
                          {dayApts.length > 1 && (
                            <div className="more-apts" onClick={(e) => { e.stopPropagation(); setShowAllAptsForDay(dateStr); }}>
                              +{dayApts.length - 1} {dayApts.length - 1 === 1 ? 'autre' : 'autres'}
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
                    <span>{monthNames[viewMonth.getMonth()]}</span>
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
                  {getAppointmentsForDay(new Date().toISOString().split('T')[0]).length > 0 ? (
                    getAppointmentsForDay(new Date().toISOString().split('T')[0]).map(apt => {
                      const timeStr = apt.date_heure.split('T')[1].substring(0, 5);
                      return (
                        <div key={apt.id} className="sidebar-rdv-item" onClick={() => handleSlotClick(apt)}>
                          <div className="rdv-time-box">{timeStr}</div>
                          <div className="rdv-details">
                            <span className="rdv-patient-name">{apt.patient?.user?.nom} {apt.patient?.user?.prenom}</span>
                            <span className="rdv-doctor-name">Dr. {apt.professionnel?.nom || 'du cabinet'}</span>
                          </div>
                          <div className={`status-dot-mini ${apt.statut}`}></div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-rdv-msg" style={{ padding: '15px', color: '#94a3b8', fontSize: '0.85rem' }}>Aucun rendez-vous aujourd'hui</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination UI */}
        {!loading && filteredConsultations.length > itemsPerPage && (
          <div className="rdv-pagination">
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
                <button className="cons-modal-close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} onClick={() => setShowRescheduleModal(false)}><X size={24} /></button>
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

        {/* Modal Confirmation Confirmer */}
        {showConfirmModal && aptToConfirm && (
          <div className="cons-modal-overlay">
            <div className="cons-modal-container cancel-modal" style={{ maxWidth: '400px' }}>
              <div className="cons-modal-header">
                <h2>Confirmer le rendez-vous</h2>
                <button className="icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} onClick={() => setShowConfirmModal(false)}><X size={20} /></button>
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

        {/* Modal Confirmation Annulation */}
        {showCancelModal && aptToCancel && (
          <div className="cons-modal-overlay">
            <div className="cons-modal-container cancel-modal" style={{ maxWidth: '400px' }}>
              <div className="cons-modal-header">
                <h2>Annuler le rendez-vous</h2>
                <button className="icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} onClick={() => setShowCancelModal(false)}><X size={20} /></button>
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

        {/* Contextual Active Consultation Modal */}
        {activeConsultation && (
          <div className="cons-modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '5vh' }}>
            <div className="active-cons-card" style={{ maxHeight: '90vh', overflowY: 'auto', width: '90vw', maxWidth: '900px' }}>
              <div className="active-cons-header">
                <h2>
                  {activeConsViewMode === 'contact-only' ? 'Détails du Rendez-vous (En attente)' :
                    activeConsViewMode === 'reschedule-only' ? 'Rendez-vous Annulé' :
                      activeConsViewMode === 'confirmed' ? 'Détails du Rendez-vous (Confirmé)' :
                        activeConsViewMode === 'view' ? 'Compte-rendu de consultation' :
                          'Consultation en cours'}
                </h2>
                <button className="icon-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setActiveConsultation(null)}>
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
                      <h4>Dossier Médical (Informations permanentes)</h4>
                    </div>
                    <div className="record-grid">
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

                  <div className="cons-section">
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
                        {showDiagnostique ? "Retirer" : "Diagnostic"}
                      </button>
                      <button
                        className="pagination-btn"
                        onClick={() => setShowOrdonnance(!showOrdonnance)}
                      >
                        {showOrdonnance ? <X size={18} /> : <FileText size={18} />}
                        {showOrdonnance ? "Retirer" : "Ordonnance"}
                      </button>
                    </div>
                    <button className="btn-save-finish" onClick={handleSaveNotes} disabled={isSavingNotes}>
                      <Save size={18} /> {isSavingNotes ? 'Enreg...' : 'Enregistrer'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default GestionRendezVous;