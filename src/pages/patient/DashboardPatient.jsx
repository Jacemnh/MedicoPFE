import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import {
  Calendar,
  FileText,
  Clock,
  CreditCard,
  User,
  Activity,
  Heart,
  Bell,
  MapPin,
  Phone,
  ChevronRight,
  Plus,
  Search,
  Video,
  MessageCircle,
  Star,
  ArrowUpRight,
  MoreVertical,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import NotificationsMenu from '../../components/common/NotificationsMenu';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import '../professionnel/Professionnel.css';
import './DashboardPatient.css';

const DashboardPatient = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcoming_count: 0,
    total_consultations: 0,
    pending_payments_count: 0,
    pending_payments_total: 0,
    documents_count: 0,
  });
  const [charts, setCharts] = useState({
    statusData: [],
    consultationsData: [],
    specialtyData: [],
    expenseData: [],
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/patient/dashboard');
      if (res.data.success) {
        setStats(res.data.data.stats);
        if (res.data.data.charts) {
          setCharts(res.data.data.charts);
        }
      }
    } catch (err) {
      console.error('Erreur dashboard patient:', err);
    } finally {
      setLoading(false);
    }
  };

  const sidebarLinks = [
    { path: '/patient/dashboard', label: "Vue d'ensemble", icon: <User size={20} /> },
    { path: '/patient/rendez-vous', label: 'Rendez-vous', icon: <Calendar size={20} />, badge: stats.upcoming_count > 0 ? String(stats.upcoming_count) : undefined },
    { path: '/patient/prendre-rendez-vous', label: 'Nouveau RDV', icon: <Plus size={20} /> },
    { path: '/patient/dossier-medical', label: 'Dossier médical', icon: <FileText size={20} /> },
    { path: '/patient/diagnostic-ia', label: 'Assistant Médical IA', icon: <Heart size={20} /> },
    { path: '/patient/paiement', label: 'Paiements', icon: <CreditCard size={20} />, badge: stats.pending_payments_count > 0 ? String(stats.pending_payments_count) : undefined },
    { path: '/patient/profil', label: 'Mon profil', icon: <User size={20} /> },
  ];

  const kpiCards = [
    {
      label: 'Rendez-vous à venir',
      value: stats.upcoming_count,
      change: 'Prochainement',
      changeType: 'positive',
      icon: <Calendar size={24} />,
      color: '#4361ee',
      bgColor: 'rgba(67, 97, 238, 0.1)',
    },
    {
      label: 'Consultations totales',
      value: stats.total_consultations,
      change: 'Depuis le début',
      changeType: 'neutral',
      icon: <Activity size={24} />,
      color: '#4cc9f0',
      bgColor: 'rgba(76, 201, 240, 0.1)',
    },
    {
      label: 'Paiements en attente',
      value: stats.pending_payments_count,
      change: stats.pending_payments_total > 0 ? `${stats.pending_payments_total}€ total` : 'Aucun',
      changeType: stats.pending_payments_count > 0 ? 'warning' : 'positive',
      icon: <CreditCard size={24} />,
      color: '#ff9800',
      bgColor: 'rgba(255, 152, 0, 0.1)',
    },
    {
      label: 'Documents médicaux',
      value: stats.documents_count || 0,
      change: 'Dans votre dossier',
      changeType: 'positive',
      icon: <FileText size={24} />,
      color: '#f72585',
      bgColor: 'rgba(247, 37, 133, 0.1)',
    },
  ];

  const COLORS = ['#4361ee', '#4cc9f0', '#f72585', '#3f37c9'];



  return (
    <div className="pro-container">
      <Sidebar links={sidebarLinks} />

      <main className="pro-main-content">
        {/* Topbar: Welcome Text and Icons */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>

          {/* Welcome Text */}
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Bonjour, {user?.prenom || 'Patient'} </h1>
            <p style={{ color: '#64748b', margin: '5px 0 0 0', fontSize: '0.9rem' }}>Voici l'aperçu de votre santé aujourd'hui.</p>
          </div>

          {/* Action Icons & Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Link to="/patient/prendre-rendez-vous" title="Prendre RDV" className="notif-trigger-btn" style={{ textDecoration: 'none' }}>
              <Plus size={22} />
            </Link>

            <Link to="/patient/dossier-medical" title="Mon dossier" className="notif-trigger-btn" style={{ textDecoration: 'none' }}>
              <FileText size={22} />
            </Link>

            <NotificationsMenu />

            <div style={{ width: '1px', height: '30px', background: '#cbd5e1', margin: '0 5px' }}></div>

            <Link to="/patient/profil" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 9px', border: '1px solid #ffffffff', borderRadius: '50px', textDecoration: 'none', cursor: 'pointer', background: '#ffffff', transition: 'all 0.2s' }}>
              <User size={18} color="#334155" />
              <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#0369a1' }}>
                {user?.prenom} {user?.nom}
              </span>
            </Link>
          </div>
        </header>
        {/* KPI Cards */}
        <div className="pro-stats-container patient-kpi-grid">
          {kpiCards.map((kpi, index) => (
            <div key={index} className="pro-stat-box" style={{ borderLeftColor: kpi.color }}>
              <div className="pro-stat-icon-box" style={{ background: kpi.bgColor, color: kpi.color }}>
                {kpi.icon}
              </div>
              <div className="pro-stat-details">
                <h3>{loading ? '…' : kpi.value}</h3>
                <p>{kpi.label}</p>
                <span className="pro-stat-sub">{kpi.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="patient-dashboard-charts">
          {/* Chart 1: Statuts des Rendez-vous */}
          <div className="patient-chart-card">
            <div className="patient-chart-header">
              <h3>Statuts des Rendez-vous</h3>
            </div>
            <div className="patient-chart-body">
              {charts.statusData && charts.statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={charts.statusData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Line type="monotone" name="Terminé" dataKey="termine" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" name="Annulé" dataKey="annule" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: '#94a3b8' }}>Aucune donnée de statut.</p>
              )}
            </div>
          </div>

          {/* Chart 2: Consultations */}
          <div className="patient-chart-card">
            <div className="patient-chart-header">
              <h3>Historique des consultations</h3>
            </div>
            <div className="patient-chart-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={charts.consultationsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="visites" name="Nombre de visites" fill="#4361ee" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Répartition par spécialité */}
          <div className="patient-chart-card">
            <div className="patient-chart-header">
              <h3>Répartition par spécialité</h3>
            </div>
            <div className="patient-chart-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={charts.specialtyData}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.specialtyData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Dépenses et remboursements */}
          <div className="patient-chart-card">
            <div className="patient-chart-header">
              <h3>Dépenses (€)</h3>
            </div>
            <div className="patient-chart-body">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={charts.expenseData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Line type="monotone" name="Dépenses" dataKey="depenses" stroke="#ff9800" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="pro-main-grid" style={{ gridTemplateColumns: '1fr' }}>

          {/* Right Section: Quick Links */}
          <div className="pro-right-col">
            <div className="pro-box">
              <div className="pro-box-header">
                <h2>Raccourcis rapides</h2>
              </div>
              <div className="pro-tasks" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <button className="pro-view-all-button" onClick={() => window.location.href = '/patient/prendre-rendez-vous'} style={{ margin: 0 }}>
                  <Search size={18} /> Prendre un rendez-vous
                </button>
                <button className="pro-view-all-button" onClick={() => window.location.href = '/patient/rendez-vous'} style={{ margin: 0 }}>
                  <Calendar size={18} /> Historique des RDV
                </button>
                <button className="pro-view-all-button" onClick={() => window.location.href = '/patient/dossier-medical'} style={{ margin: 0 }}>
                  <FileText size={18} /> Mon dossier médical
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPatient;