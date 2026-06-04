import { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar';
import api from '../../api/axios';
import {
  Calendar, Users, Clock, Phone,
  AlertCircle, CheckCircle, TrendingUp,
  FileText, Bell, X,
  ChevronRight, Search,
  Mail, Video, Activity, User, Moon, Sun, Hospital, Settings
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import NotificationsMenu from '../../components/common/NotificationsMenu';
import './Secretaire.css';

const DashboardSecretaire = () => {
  const { user } = useAuth();
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUnlinkedModal, setShowUnlinkedModal] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      today_rdv: 0,
      total_rdv: 0,
      pending_rdv: 0,
      confirmed_rdv: 0,
      cancelled_rdv: 0,
      total_patients: 0,
    },
    pending: [],
    schedule: [],
    weekly_chart: [],
    pie_chart: [],
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/secretaire/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching secretary dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'secretaire' && !user.secretaire) {
      setShowUnlinkedModal(true);
      setLoading(false);
    } else {
      fetchDashboardData();
    }
  }, [user, navigate]);

  const sidebarLinks = [
    { path: '/secretaire/dashboard', label: 'Tableau de bord', icon: <Activity size={20} /> },
    { path: '/secretaire/rendez-vous', label: 'Gestion RDV', icon: <Calendar size={20} />, badge: dashboardData.pending.length.toString(), badgeVariant: 'warning' },
    { path: '/secretaire/patients', label: 'Gestion Patients', icon: <Users size={20} /> },
    { path: '/secretaire/cabinet', label: 'Mon Cabinet', icon: <Hospital size={20} /> },
    { path: '/secretaire/profil', label: 'Mon profil', icon: <User size={20} /> },
  ];

  const stats = [
    {
      title: 'Total RDV',
      value: dashboardData.stats.total_rdv.toString(),
      icon: <Calendar size={28} />,
      color: '#4361ee',
    },
    {
      title: 'Confirmés',
      value: dashboardData.stats.confirmed_rdv?.toString() ?? '0',
      icon: <CheckCircle size={28} />,
      color: '#10B981',
    },
    {
      title: 'En attente',
      value: dashboardData.stats.pending_rdv.toString(),
      icon: <AlertCircle size={28} />,
      color: '#F59E0B',
    },
    {
      title: 'Annulés',
      value: dashboardData.stats.cancelled_rdv?.toString() ?? '0',
      icon: <X size={28} />,
      color: '#EF4444',
    },
  ];

  const statusCfg = {
    confirmé: { label: 'Confirmé', icon: <CheckCircle size={13} />, cls: 'sec-badge-confirmed' },
    termine: { label: 'Terminé', icon: <CheckCircle size={13} />, cls: 'sec-badge-confirmed' },
    en_cours: { label: 'En cours', icon: <Activity size={13} />, cls: 'sec-badge-ongoing' },
    'en attente': { label: 'En attente', icon: <AlertCircle size={13} />, cls: 'sec-badge-pending' },
  };

  const weeklyData = dashboardData.weekly_chart;
  const pieData = dashboardData.pie_chart;
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/secretaire/rendez-vous/${id}/status`, { status });
      setSelectedAppointment(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleConfirm = (id) => {
    handleUpdateStatus(id, 'confirmé');
  };

  const handleCancel = (id) => {
    if (window.confirm('Annuler ce RDV ?')) {
      handleUpdateStatus(id, 'annule');
    }
  };

  return (
    <div className="sec-layout">
      <Sidebar links={sidebarLinks} />

      <main className="sec-main">

        {/* ── Header ──────────────────────────────── */}
        <div className="sec-header">
          <div>

            <h1>Gestion du Cabinet</h1>
            <p className="sec-subtitle">
              {user?.secretaire?.professionnel?.user ? (
                <>Collaborateur de <strong>Dr. {user.secretaire.professionnel.user.nom} {user.secretaire.professionnel.user.prenom}</strong></>
              ) : (
                "Organisez et gérez tous les rendez-vous médicaux"
              )}
            </p>
            <span className="sec-tag-primary">Tableau de Bord</span>
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

        {/* ── Stats ───────────────────────────────── */}
        <div className="sec-stats">
          {stats.map((s, i) => (
            <div
              key={i}
              className="sec-stat-card"
            >
              <div
                className="sec-sc-icon"
                style={{ background: `${s.color}15`, color: s.color }}
              >
                {s.icon}
              </div>
              <div className="sec-sc-body">
                <span className="sec-sc-value">{s.value}</span>
                <span className="sec-sc-label">{s.title}</span>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="sec-loading">
            <div className="sec-spinner"></div>
            <p>Chargement des données en cours...</p>
          </div>
        ) : (
          <>
            <div className="sec-content-grid">

              {/* Left — Pending */}
              <div className="sec-left">
                <div className="sec-section">
                  <div className="sec-section-header">
                    <div>
                      <h2>Rendez-vous en attente</h2>
                      <p>{dashboardData.pending.length} demande(s) à traiter</p>
                    </div>
                    <span className="sec-count-badge">{dashboardData.pending.length}</span>
                  </div>

                  <div className="sec-pending-list">
                    {dashboardData.pending.length === 0 ? (
                      <div className="sec-empty-state">Aucun rendez-vous en attente</div>
                    ) : (
                      dashboardData.pending.map((apt, i) => (
                        <div
                          key={apt.id}
                          className="sec-pending-card"
                          style={{ '--delay': `${i * 0.07}s` }}
                        >
                          <div className="sec-pc-main">
                            <div
                              className="sec-pc-avatar"
                              style={{ background: `linear-gradient(135deg,${apt.color},${apt.color}88)` }}
                            >
                              {apt.initials}
                            </div>
                            <div className="sec-pc-info">
                              <h4>{apt.patient}</h4>
                              <div className="sec-pci-row">
                                <span className="sec-pci-item">
                                  <Phone size={13} /> {apt.telephone}
                                </span>
                                <span className="sec-pci-item">
                                  <Mail size={13} /> {apt.email}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="sec-pc-details">
                            <div className="sec-pcd-pill">
                              <Calendar size={14} />
                              <span>{apt.date} à {apt.time}</span>
                            </div>
                            <div className="sec-pcd-pill">
                              <Users size={14} />
                              <span>{apt.doctor} · {apt.reason}</span>
                            </div>
                            <div className="sec-pcd-pill sec-reason-pill">
                              <FileText size={14} />
                              <span>{apt.reason}</span>
                            </div>
                          </div>

                          <div className="sec-pc-actions">
                            <button
                              className="sec-pc-btn sec-pc-confirm"
                              onClick={() => handleConfirm(apt.id)}
                              disabled={apt.reprogrammed}
                              style={apt.reprogrammed ? { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#E5E7EB', color: '#9CA3AF' } : {}}
                              title={apt.reprogrammed ? "En attente de la confirmation du patient suite à la reprogrammation" : ""}
                            >
                              <CheckCircle size={16} />
                              {apt.reprogrammed ? "En attente" : "Confirmer"}
                            </button>
                            <button
                              className="sec-pc-btn sec-pc-reject"
                              onClick={() => handleCancel(apt.id)}
                            >
                              <X size={16} />
                              Refuser
                            </button>
                            <button
                              className="sec-pc-btn sec-pc-details-btn"
                              onClick={() => setSelectedAppointment(apt)}
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right — Sidebar */}
              <div className="sec-right">

                {/* Planning du jour */}
                <div className="sec-section">
                  <div className="sec-section-header">
                    <div>
                      <h2>Planning du jour</h2>
                      <p>{dashboardData.schedule.length} RDV programmés</p>
                    </div>
                  </div>

                  <div className="sec-schedule-list">
                    {dashboardData.schedule.length === 0 ? (
                      <div className="sec-empty-state">Aucun rendez-vous pour aujourd'hui</div>
                    ) : (
                      dashboardData.schedule.map((s, i) => {
                        const cfg = statusCfg[s.status] || {
                          label: s.status,
                          icon: <Clock size={13} />,
                          cls: 'sec-badge-pending'
                        };
                        return (
                          <div
                            key={s.id}
                            className="sec-schedule-item"
                            style={{ '--delay': `${i * 0.05}s` }}
                          >
                            <div
                              className="sec-si-time"
                              style={{ background: `${s.color}18`, color: s.color }}
                            >
                              {s.time}
                            </div>
                            <div className="sec-si-info">
                              <h5>{s.patient}</h5>
                              <span>{s.doctor}</span>
                              <span className={`sec-si-badge ${cfg.cls}`}>
                                {cfg.icon} {cfg.label}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Charts - pleine largeur */}
            <div className="sec-charts-grid">

              {/* Graphique à barres */}
              <div className="sec-section sec-chart-card">
                <div className="sec-chart-header">
                  <div>
                    <h3 className="sec-chart-title">Activite hebdomadaire</h3>
                    <p className="sec-chart-sub">Consultations vs Urgences - 7 dernieres semaines</p>
                  </div>
                  <div className="sec-chart-legend">
                    <span className="sec-legend-dot" style={{ background: '#3B82F6' }}></span> Consultations
                    <span className="sec-legend-dot" style={{ background: '#10B981', marginLeft: '1rem' }}></span> Urgences
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weeklyData} barGap={4} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="semaine" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '0.85rem' }}
                      cursor={{ fill: 'rgba(139,92,246,0.05)' }}
                    />
                    <Bar dataKey="consultations" name="Consultations" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="urgences" name="Urgences" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Graphique en anneau */}
              <div className="sec-section sec-chart-card">
                <div className="sec-chart-header">
                  <div>
                    <h3 className="sec-chart-title">Répartition des consultations</h3>
                    <p className="sec-chart-sub">Par type de service</p>
                  </div>
                </div>
                <div className="sec-donut-wrapper">
                  <div className="sec-donut-chart">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%" cy="50%"
                          innerRadius={55} outerRadius={85}
                          dataKey="value"
                          startAngle={90} endAngle={-270}
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="sec-donut-center">
                      <strong>{pieTotal}</strong>
                      <span>total</span>
                    </div>
                  </div>
                  <div className="sec-donut-legend">
                    {pieData.map((item, i) => (
                      <div key={i} className="sec-donut-row">
                        <div className="sec-donut-row-left">
                          <span className="sec-legend-square" style={{ background: item.color }}></span>
                          <div>
                            <p className="sec-donut-name">{item.name}</p>
                            <p className="sec-donut-pct">{item.percent}</p>
                          </div>
                        </div>
                        <strong className="sec-donut-val">{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </>

        )}

        {/* ── Modal Details ───────────────────────── */}
        {selectedAppointment && (
          <div className="sec-modal-overlay" onClick={() => setSelectedAppointment(null)}>
            <div className="sec-modal" onClick={e => e.stopPropagation()}>
              <button className="sec-modal-close" onClick={() => setSelectedAppointment(null)}>
                <X size={20} />
              </button>

              <div className="sec-modal-header">
                <div
                  className="sec-mh-avatar"
                  style={{ background: `linear-gradient(135deg,${selectedAppointment.color},${selectedAppointment.color}88)` }}
                >
                  {selectedAppointment.initials}
                </div>
                <div>
                  <h2>{selectedAppointment.patient}</h2>
                  <p>Demande de rendez-vous</p>
                </div>
              </div>

              <div className="sec-modal-grid">
                <div className="sec-mg-item">
                  <Phone size={18} />
                  <div>
                    <span>Téléphone</span>
                    <strong>{selectedAppointment.telephone}</strong>
                  </div>
                </div>
                <div className="sec-mg-item">
                  <Mail size={18} />
                  <div>
                    <span>Email</span>
                    <strong>{selectedAppointment.email}</strong>
                  </div>
                </div>
                <div className="sec-mg-item">
                  <Calendar size={18} />
                  <div>
                    <span>Date souhaitée</span>
                    <strong>{selectedAppointment.date} à {selectedAppointment.time}</strong>
                  </div>
                </div>
                <div className="sec-mg-item">
                  <Users size={18} />
                  <div>
                    <span>Médecin</span>
                    <strong>{selectedAppointment.doctor}</strong>
                  </div>
                </div>
                <div className="sec-mg-item sec-mg-full">
                  <FileText size={18} />
                  <div>
                    <span>Motif</span>
                    <strong>{selectedAppointment.reason}</strong>
                  </div>
                </div>
              </div>

              <div className="sec-modal-actions">
                <button
                  className="sec-modal-btn sec-mb-confirm"
                  onClick={() => handleConfirm(selectedAppointment.id)}
                  disabled={selectedAppointment.reprogrammed}
                  style={selectedAppointment.reprogrammed ? { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#E5E7EB', color: '#9CA3AF' } : {}}
                  title={selectedAppointment.reprogrammed ? "En attente de la confirmation du patient" : ""}
                >
                  <CheckCircle size={16} />
                  {selectedAppointment.reprogrammed ? "En attente du patient" : "Confirmer le RDV"}
                </button>
                <button
                  className="sec-modal-btn sec-mb-cancel"
                  onClick={() => handleCancel(selectedAppointment.id)}
                >
                  <X size={16} />
                  Refuser
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal pour secrétaire non liée */}
        {showUnlinkedModal && (
          <div className="sec-modal-overlay">
            <div className="sec-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', textAlign: 'center', padding: '2.5rem 2rem', background: 'white', borderRadius: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={40} color="#D97706" />
                </div>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1E293B', marginBottom: '1rem' }}>Accès Restreint</h2>
              <p style={{ fontSize: '1.1rem', color: '#475569', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                Vous n’êtes plus rattachée à un cabinet professionnel.
              </p>
              <p style={{ fontSize: '0.95rem', color: '#64748B', marginBottom: '2rem', lineHeight: '1.5' }}>
                Pour continuer à utiliser l'espace secrétaire, veuillez saisir un nouveau code de liaison depuis votre profil.
              </p>
              <Link 
                to="/secretaire/profil" 
                className="sec-btn-static" 
                style={{ textDecoration: 'none', display: 'inline-flex', width: '100%', justifyContent: 'center', padding: '1rem' }}
              >
                Aller vers Mon Profil
              </Link>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default DashboardSecretaire;