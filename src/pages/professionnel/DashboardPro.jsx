import { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar';
import {
  Calendar, Users, FileText, Clock,
  Activity, Bell, User,
  ChevronRight, Euro, Moon, Sun, Heart,
  Briefcase, Settings, CheckCircle, AlertCircle, Video, X, Save, Eye, CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import NotificationsMenu from '../../components/common/NotificationsMenu';
import { useAlert } from '../../context/AlertContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import './Professionnel.css';

const DashboardPro = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      today_count: 0,
      weekly_total: 0,
      estimated_revenue: 0,
      active_services: 0
    },
    today_appointments: [],
    charts: {
      revenueData: [],
      consultationsData: [],
      statusData: [],
      serviceData: []
    }
  });

  const [activeConsultation, setActiveConsultation] = useState(null);
  const [notes, setNotes] = useState('');
  const [ordonnance, setOrdonnance] = useState('');
  const [showOrdonnance, setShowOrdonnance] = useState(false);
  const [groupeSanguin, setGroupeSanguin] = useState('');
  const [maladiesChroniques, setMaladiesChroniques] = useState('');
  const [poids, setPoids] = useState('');
  const [taille, setTaille] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [viewMode, setViewMode] = useState(false);

  // New states for Rescheduling & Cancellation
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAptToReschedule, setSelectedAptToReschedule] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [aptToCancel, setAptToCancel] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [aptToConfirm, setAptToConfirm] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/pro/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (err) {
      console.error('Erreur dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const [showTrialWelcome, setShowTrialWelcome] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(null);

  useEffect(() => {
    fetchDashboardData();

    // Check trial status
    if (user?.professionnel?.trial_ends_at) {
      const trialEnd = new Date(user.professionnel.trial_ends_at);
      const now = new Date();
      if (trialEnd > now) {
        const diffTime = Math.abs(trialEnd - now);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setTrialDaysLeft(diffDays);

        // Only show once per session or use localStorage
        const hasSeenModal = localStorage.getItem(`has_seen_trial_modal_${user.id}`);
        if (!hasSeenModal) {
          setShowTrialWelcome(true);
        }
      }
    }
  }, [user]);

  const dismissTrialModal = () => {
    localStorage.setItem(`has_seen_trial_modal_${user.id}`, 'true');
    setShowTrialWelcome(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await api.put(`/pro/consultations/${id}/status`, { statut: newStatus });
      if (res.data.success) {
        fetchDashboardData();
        setShowCancelModal(false);
        setShowConfirmModal(false);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime || !selectedAptToReschedule) return;
    try {
      const dateHeure = `${newDate} ${newTime}`;
      const res = await api.put(`/pro/consultations/${selectedAptToReschedule.id}/reschedule`, {
        date_heure: dateHeure
      });
      if (res.data.success) {
        showAlert({ title: 'Succès', message: 'Rendez-vous reprogrammé avec succès.', type: 'success' });
        setShowRescheduleModal(false);
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Erreur lors de la reprogrammation:', error);
      showAlert({ title: 'Erreur', message: 'Erreur lors de la reprogrammation.', type: 'error' });
    }
  };

  const handleStartConsultation = async (apt) => {
    setActiveConsultation(apt);
    setNotes('');
    setOrdonnance('');
    setShowOrdonnance(false);
    setViewMode(false);
    setPatientHistory([]);
    setIsLoadingHistory(true);

    try {
      const res = await api.get(`/pro/patients/${apt.patient.id}/dossier-complet`);
      if (res.data.success) {
        const dm = res.data.data.dossier_medical;
        setGroupeSanguin(dm?.groupe_sanguin || '');
        setMaladiesChroniques(dm?.maladies_chroniques || '');
        setPoids(dm?.poids || '');
        setTaille(dm?.taille || '');
        setPatientHistory(res.data.data.historique_consultations || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du dossier complet:', err);
      // Fallback
      const dm = apt.patient?.dossier_medical;
      setGroupeSanguin(dm?.groupe_sanguin || '');
      setMaladiesChroniques(dm?.maladies_chroniques || '');
      setPoids(dm?.poids || '');
      setTaille(dm?.taille || '');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleViewConsultation = (apt) => {
    setActiveConsultation(apt);
    setNotes(apt.consultation?.notes || '');
    setOrdonnance(apt.consultation?.ordonnances?.[0]?.medicaments || '');
    setShowOrdonnance(!!apt.consultation?.ordonnances?.[0]);
    setViewMode(true);

    const dm = apt.patient?.dossier_medical;
    setGroupeSanguin(dm?.groupe_sanguin || '');
    setMaladiesChroniques(dm?.maladies_chroniques || '');
    setPoids(dm?.poids || '');
    setTaille(dm?.taille || '');
  };

  const handleSaveNotes = async () => {
    if (!activeConsultation) return;
    setIsSavingNotes(true);
    try {
      const res = await api.post(`/pro/consultations/${activeConsultation.id}/notes`, {
        notes,
        ordonnance: showOrdonnance ? ordonnance : null,
        groupe_sanguin: groupeSanguin,
        maladies_chroniques: maladiesChroniques,
        poids,
        taille
      });
      if (res.data.success) {
        showAlert({ title: 'Succès', message: 'Dossier médical mis à jour et consultation terminée avec succès.', type: 'success' });
        setActiveConsultation(null);
        fetchDashboardData(); // Refresh list
      }
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement des notes:', err);
      showAlert({ title: 'Erreur', message: 'Erreur lors de l\'enregistrement des notes.', type: 'error' });
    } finally {
      setIsSavingNotes(false);
    }
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

  const statsCards = [
    {
      title: "Rendez-vous aujourd'hui",
      value: dashboardData.stats.today_count,
      subtext: 'À l\'heure prévue',
      icon: <Calendar size={24} />,
      color: '#8B5CF6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
    },
    {
      title: 'Total cette semaine',
      value: dashboardData.stats.weekly_total,
      subtext: 'Cumulé',
      icon: <Users size={24} />,
      color: '#6366F1',
      bgColor: 'rgba(99, 102, 241, 0.1)',
    },
    {
      title: 'Services actifs',
      value: dashboardData.stats.active_services,
      subtext: 'Proposés aux patients',
      icon: <Activity size={24} />,
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'Revenus estimés (Semaine)',
      value: `${dashboardData.stats.estimated_revenue}€`,
      subtext: 'Basé sur les tarifs',
      icon: <Euro size={24} />,
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
  ];

  const statusCfg = {
    confirme: { label: 'Confirmé', icon: <CheckCircle size={14} />, cls: 'status-confirmed' },
    en_attente: { label: 'En attente', icon: <AlertCircle size={14} />, cls: 'status-pending' },
    termine: { label: 'Terminé', icon: <CheckCircle size={14} />, cls: 'status-confirmed' },
    annule: { label: 'Annulé', icon: <X size={14} />, cls: 'status-pending' },
  };

  return (
    <div className={`pro-container ${darkMode ? 'dark-mode' : ''}`}>
      {!activeConsultation && <Sidebar links={sidebarLinks} />}

      <main className={`pro-main-content ${activeConsultation ? 'no-sidebar' : ''}`} style={{ marginLeft: activeConsultation ? 0 : '280px' }}>
        <div className="pro-top-header">
          <div>
            <h1>Bonjour, Dr. {user?.nom} </h1>
            <p className="pro-subtitle-text">Voici votre activité en temps réel</p>
          </div>
          <div className="pro-header-actions" style={{ gap: '5px' }}>
            <Link to="/professionnel/creneaux" className="notif-trigger-btn" title="Agenda" style={{ textDecoration: 'none' }}>
              <Calendar size={22} />
            </Link>
            <Link to="/professionnel/profil" className="notif-trigger-btn" title="Paramètres" style={{ textDecoration: 'none' }}>
              <Settings size={22} />
            </Link>
            <NotificationsMenu />
            
            <div style={{ width: '1px', height: '30px', background: '#cbd5e1', margin: '0 5px' }}></div>
            
            <Link to="/professionnel/profil" className="pro-user-info" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
              <User size={18} />
              <span>Dr. {user?.nom} </span>
            </Link>
          </div>
        </div>

        {activeConsultation ? (
          <div className="active-cons-view" style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div className="pro-box" style={{ borderTop: '5px solid var(--primary)', padding: '30px' }}>
              <div className="pro-box-header">
                <div>
                  <h2>{viewMode ? 'Compte-rendu de consultation' : 'Consultation en cours'}</h2>
                  <p>{activeConsultation.patient?.user?.nom} {activeConsultation.patient?.user?.prenom}</p>
                </div>
                <button className="pro-btn-outline-sm" onClick={() => setActiveConsultation(null)}>
                  <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Retour
                </button>
              </div>

              <div className="active-cons-medical-record" style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: 'var(--radius)', marginBottom: '25px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--primary)', fontWeight: 700 }}>
                  <Activity size={18} />
                  <span>DOSSIER MÉDICAL</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
                  <div className="record-field">
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-gray)', fontWeight: 600 }}>Date de Naissance</label>
                    <input type="text" value={activeConsultation.patient?.date_naissance ? new Date(activeConsultation.patient.date_naissance).toLocaleDateString('fr-FR') : 'Non renseignée'} readOnly style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-main)', color: 'var(--text-gray)' }} />
                  </div>

                  <div className="record-field">
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-gray)', fontWeight: 600 }}>Groupe Sanguin</label>
                    <input type="text" value={groupeSanguin} onChange={e => setGroupeSanguin(e.target.value)} readOnly={viewMode} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  </div>
                  <div className="record-field">
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-gray)', fontWeight: 600 }}>Poids (kg)</label>
                    <input type="number" value={poids} onChange={e => setPoids(e.target.value)} readOnly={viewMode} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  </div>
                  <div className="record-field">
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-gray)', fontWeight: 600 }}>Taille (cm)</label>
                    <input type="number" value={taille} onChange={e => setTaille(e.target.value)} readOnly={viewMode} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  </div>
                </div>
                <div style={{ marginTop: '15px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-gray)', fontWeight: 600 }}>Maladies Chroniques</label>
                  <textarea value={maladiesChroniques} onChange={e => setMaladiesChroniques(e.target.value)} readOnly={viewMode} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'inherit' }} />
                </div>
              </div>

              {isLoadingHistory ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-gray)' }}>
                  <Activity size={24} style={{ animation: 'spin 1s linear infinite' }} /> Chargement de l'historique...
                </div>
              ) : (
                patientHistory.length > 0 && (
                  <div className="active-cons-medical-record" style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: 'var(--radius)', marginBottom: '25px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: 'var(--primary)', fontWeight: 700 }}>
                      <Clock size={18} />
                      <span>HISTORIQUE DES 5 DERNIERS MOIS</span>
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

              <div className="cons-section">
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '10px' }}><FileText size={18} /> Observations & Notes</label>
                <textarea
                  className="pro-textarea"
                  rows={8}
                  placeholder="Notes de consultation..."
                  value={notes}
                  readOnly={viewMode}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '15px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontFamily: 'inherit' }}
                />
              </div>

              {showOrdonnance && (
                <div className="cons-section" style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '10px' }}><Activity size={18} /> Ordonnance</label>
                  <textarea
                    className="pro-textarea"
                    rows={6}
                    placeholder="Médicaments et posologies..."
                    value={ordonnance}
                    readOnly={viewMode}
                    onChange={(e) => setOrdonnance(e.target.value)}
                    style={{ width: '100%', padding: '15px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontFamily: 'inherit' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '30px' }}>
                {!viewMode ? (
                  <>
                    <button className="pro-btn-outline-sm" onClick={() => setShowOrdonnance(!showOrdonnance)}>
                      {showOrdonnance ? <X size={16} /> : <FileText size={16} />}
                      {showOrdonnance ? "Enlever l'ordonnance" : "Ajouter Ordonnance"}
                    </button>
                    <button className="pro-btn-primary" onClick={handleSaveNotes} disabled={isSavingNotes} style={{ padding: '10px 25px' }}>
                      <Save size={18} /> {isSavingNotes ? '...' : 'Enregistrer et Terminer'}
                    </button>
                  </>
                ) : (
                  <button className="pro-btn-primary" onClick={() => setActiveConsultation(null)} style={{ padding: '10px 25px' }}>
                    Fermer
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="pro-stats-container">
              {statsCards.map((s, i) => (
                <div key={i} className="pro-stat-box" style={{ borderLeftColor: s.color }}>
                  <div className="pro-stat-icon-box" style={{ background: s.bgColor, color: s.color }}>
                    {s.icon}
                  </div>
                  <div className="pro-stat-details">
                    <h3>{s.value}</h3>
                    <p>{s.title}</p>
                    <span className="pro-stat-sub">{s.subtext}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="pro-dashboard-charts">
              {/* Chart 1: Revenus Mensuels */}
              <div className="pro-chart-card">
                <div className="pro-chart-header">
                  <h3>Chiffre d'Affaires (€)</h3>
                </div>
                <div className="pro-chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData.charts?.revenueData || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                      <Legend />
                      <Line type="monotone" name="Revenus (€)" dataKey="revenus" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Consultations Mensuelles */}
              <div className="pro-chart-card">
                <div className="pro-chart-header">
                  <h3>Historique des Consultations</h3>
                </div>
                <div className="pro-chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.charts?.consultationsData || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} cursor={{ fill: 'rgba(67, 97, 238, 0.05)' }} />
                      <Legend />
                      <Bar dataKey="visites" name="Nombre de RDV" fill="#4361EE" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Répartition par Service */}
              <div className="pro-chart-card">
                <div className="pro-chart-header">
                  <h3>Répartition par Service (6 derniers mois)</h3>
                </div>
                <div className="pro-chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.charts?.serviceData || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        labelLine={false}
                      >
                        {(dashboardData.charts?.serviceData || []).map((entry, index) => {
                          const COLORS = ['#4361EE', '#3A0CA3', '#4CC9F0', '#F72585', '#7209B7', '#4895EF'];
                          return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                        })}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Statuts des Rendez-vous */}
              <div className="pro-chart-card">
                <div className="pro-chart-header">
                  <h3>Statuts des Rendez-vous (6 derniers mois)</h3>
                </div>
                <div className="pro-chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.charts?.statusData || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        labelLine={false}
                      >
                        {(dashboardData.charts?.statusData || []).map((entry, index) => {
                          // Map name to specific colors
                          let color = '#CBD5E1'; // default gray
                          if (entry.name === 'Terminé') color = '#10B981';
                          if (entry.name === 'Annulé') color = '#EF4444';
                          if (entry.name === 'Confirmé') color = '#4361EE';
                          if (entry.name === 'En attente') color = '#F59E0B';
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="pro-main-grid" style={{ marginTop: '25px' }}>
              <div className="pro-box pro-box-large">
                <div className="pro-box-header">
                  <div>
                    <h2>Rendez-vous du jour</h2>
                    <p>{dashboardData.today_appointments.length} consultation(s) prévue(s)</p>
                  </div>
                  <Link to="/professionnel/consultations" className="pro-link-action">
                    Tout voir <ChevronRight size={18} />
                  </Link>
                </div>

                <div className="pro-appointments" style={{ marginTop: '20px' }}>
                  {loading ? (
                    <p style={{ padding: '20px' }}>Chargement...</p>
                  ) : dashboardData.today_appointments.length === 0 ? (
                    <p style={{ padding: '20px' }}>Aucun rendez-vous pour aujourd'hui.</p>
                  ) : (
                    dashboardData.today_appointments.map((apt) => {
                      const cfg = statusCfg[apt.statut] || statusCfg.en_attente;
                      const aptTime = apt.date_heure.split('T')[1].substring(0, 5);
                      const initials = apt.patient?.user?.nom?.substring(0, 1).toUpperCase() + apt.patient?.user?.prenom?.substring(0, 1).toUpperCase();

                      return (
                        <div key={apt.id} className="pro-apt-card">
                          <div className="pro-apt-time-col">
                            <span className="pro-time-h">{aptTime}</span>
                            <span className="pro-time-d">Aujourd'hui</span>
                          </div>
                          <div className="pro-apt-line" style={{ background: cfg.cls === 'status-confirmed' ? 'var(--success)' : 'var(--warning)' }}></div>
                          <div className="pro-apt-body">
                            <div className="pro-apt-top">
                              <div className="pro-apt-avatar" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
                                {initials}
                              </div>
                              <div className="pro-apt-details">
                                <h4>
                                  {apt.patient?.user?.nom} {apt.patient?.user?.prenom}
                                  <span style={{ fontSize: '0.85rem', marginLeft: '8px' }}>({(() => {
                                    const [y, m, d] = apt.date_heure.split('T')[0].split('-');
                                    return `${d}/${m}/${y}`;
                                  })()})</span>
                                </h4>
                                <p>{apt.service?.nom || apt.motif || 'Consultation standard'}</p>
                              </div>
                              <span className={`pro-status-badge ${cfg.cls}`}>
                                {cfg.icon} {cfg.label}
                              </span>
                            </div>
                            <div className="pro-apt-bottom">
                              <div className="pro-type-label">
                                <Video size={14} /> {apt.service?.prix ? `${apt.service.prix}€` : 'Tarif non spécifié'}
                              </div>
                              <div className="pro-apt-buttons">
                                {apt.statut === 'en_attente' && (
                                  <button
                                    className="pro-btn-primary-sm"
                                    onClick={() => { setAptToConfirm(apt); setShowConfirmModal(true); }}
                                    style={apt.reprogrammed ? { background: '#F3F4F6', color: '#9CA3AF', border: '1px solid #E5E7EB', cursor: 'not-allowed', opacity: 0.7 } : { background: '#ECFDF5', color: '#10B981', border: '1px solid #A7F3D0' }}
                                    disabled={apt.reprogrammed}
                                    title={apt.reprogrammed ? "En attente de la confirmation du patient suite à la reprogrammation" : ""}
                                  >
                                    <CheckCircle size={14} /> {apt.reprogrammed ? "En attente" : "Confirmer"}
                                  </button>
                                )}
                                {(apt.statut === 'confirme' || apt.statut === 'en_attente') && (
                                  <>
                                    {apt.statut === 'confirme' && (
                                      <button className="pro-btn-primary-sm" onClick={() => handleStartConsultation(apt)}>
                                        <Activity size={14} /> Démarrer
                                      </button>
                                    )}
                                    <button className="pro-btn-outline-sm" onClick={() => {
                                      setSelectedAptToReschedule(apt);
                                      setNewDate(apt.date_heure.split('T')[0]);
                                      setNewTime(apt.date_heure.split('T')[1].substring(0, 5));
                                      setShowRescheduleModal(true);
                                    }}>
                                      Report
                                    </button>
                                    <button className="pro-btn-outline-sm" onClick={() => {
                                      setAptToCancel(apt);
                                      setShowCancelModal(true);
                                    }} style={{ color: 'var(--danger)' }}>
                                      <X size={16} />
                                    </button>
                                  </>
                                )}
                                {apt.statut === 'termine' && (
                                  <button className="pro-btn-outline-sm" onClick={() => handleViewConsultation(apt)}>
                                    <Eye size={14} /> Voir Compte-rendu
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pro-right-col">
                <div className="pro-box">
                  <div className="pro-box-header">
                    <h2>Raccourcis rapides</h2>
                  </div>
                  <div className="pro-tasks">
                    <button className="pro-view-all-button" style={{ marginBottom: '10px' }} onClick={() => window.location.href = '/professionnel/creneaux'}>
                      <Calendar size={18} /> Gérer mon planning
                    </button>
                    <button className="pro-view-all-button" onClick={() => window.location.href = '/professionnel/services'}>
                      <Briefcase size={18} /> Mes services & tarifs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal Reprogrammation */}
        {showRescheduleModal && (
          <div className="pro-modal-overlay">
            <div className="pro-modal" style={{ maxWidth: '500px' }}>
              <div className="pro-modal-header">
                <h2>Reprogrammer RDV</h2>
                <button className="pro-modal-close" onClick={() => setShowRescheduleModal(false)}><X size={24} /></button>
              </div>
              <div className="pro-modal-content" style={{ padding: '20px' }}>
                <p>Nouvelle date pour <strong>{selectedAptToReschedule?.patient?.user?.nom}</strong> :</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
              </div>
              <div className="active-cons-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '20px' }}>
                <button className="pro-btn-outline-sm" onClick={() => setShowRescheduleModal(false)}>Annuler</button>
                <button className="pro-btn-primary" onClick={handleReschedule}>Valider</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmation Confirmer */}
        {showConfirmModal && aptToConfirm && (
          <div className="pro-modal-overlay">
            <div className="pro-modal" style={{ maxWidth: '400px' }}>
              <div className="pro-modal-header" style={{ borderBottom: 'none' }}>
                <h2>Confirmer le rendez-vous</h2>
              </div>
              <div className="pro-modal-content" style={{ textAlign: 'center', padding: '20px' }}>
                <CheckCircle size={48} color="#10B981" style={{ marginBottom: '15px' }} />
                <p>Voulez-vous confirmer le rendez-vous de <strong>{aptToConfirm?.patient?.user?.nom}</strong> ?</p>
              </div>
              <div className="active-cons-actions" style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '20px' }}>
                <button className="pro-btn-outline-sm" onClick={() => setShowConfirmModal(false)}>Annuler</button>
                <button className="pro-btn-primary" style={{ background: '#10B981', borderColor: '#10B981' }} onClick={() => handleStatusChange(aptToConfirm.id, 'confirme')}>Oui, confirmer</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmation Annulation */}
        {showCancelModal && (
          <div className="pro-modal-overlay">
            <div className="pro-modal cancel-modal" style={{ maxWidth: '400px' }}>
              <div className="pro-modal-header" style={{ borderBottom: 'none' }}>
                <h2>Confirmer l'annulation</h2>
              </div>
              <div className="pro-modal-content" style={{ textAlign: 'center', padding: '20px' }}>
                <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '15px' }} />
                <p>Voulez-vous vraiment annuler le rendez-vous de <strong>{aptToCancel?.patient?.user?.nom}</strong> ?</p>
              </div>
              <div className="active-cons-actions" style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '20px' }}>
                <button className="pro-btn-outline-sm" onClick={() => setShowCancelModal(false)}>Non, garder</button>
                <button className="pro-btn-primary" style={{ background: 'var(--danger)' }} onClick={() => handleStatusChange(aptToCancel.id, 'annule')}>Oui, annuler</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Trial Welcome Modal */}
      {showTrialWelcome && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17, 24, 39, 0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.4s ease-out' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '40px', maxWidth: '500px', width: '90%', textAlign: 'center', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)' }}>
              <Activity color="white" size={40} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937', marginBottom: '16px' }}>Bienvenue, Dr. {user?.nom}</h2>
            <p style={{ color: '#4b5563', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '32px' }}>
              Vous avez actuellement <strong style={{ color: '#6366f1' }}>{trialDaysLeft} jour(s)</strong> pour tester gratuitement l'ensemble de nos services. Profitez-en pour découvrir toutes les fonctionnalités !<br /><br />
              <span style={{ fontSize: '0.95rem', color: '#6b7280' }}>Après ce délai, un abonnement sera nécessaire pour continuer à utiliser la plateforme.</span>
            </p>
            <button
              onClick={dismissTrialModal}
              style={{ padding: '14px 32px', borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', border: 'none', fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Commencer mon essai
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPro;
