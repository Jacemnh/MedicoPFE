import { useState, useEffect } from 'react';
import { 
    Users, Calendar, TrendingUp, Activity, 
    PieChart as PieChartIcon, BarChart3, 
    CircleDollarSign, Stethoscope, 
    Menu, Bell, Moon, Sun, Search, Tag, ShieldCheck
, User } from 'lucide-react';
import { 
    ResponsiveContainer, AreaChart, Area, 
    XAxis, YAxis, CartesianGrid, Tooltip, 
    PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar';
import AdminHeader from '../../../components/admin/AdminHeader';
import './DashboardAdmin.css';

const DashboardAdmin = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

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
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/summary');
                if (res.data.success) {
                    setData(res.data.data);
                }
            } catch (err) {
                console.error('Error fetching admin stats', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    if (loading) return <div className="admin-loading">Chargement...</div>;

    return (
        <div className="admin-layout">
            <Sidebar links={sidebarLinks} />
            
            <main className="admin-main">
                <AdminHeader 
                    title="Administration" 
                    subtitle="Vue d'ensemble de l'activité de la plateforme Medico" 
                />
                {/* KPI Cards */}
                <div className="admin-stats-grid">
                    <div className="admin-stat-card primary">
                        <div className="admin-stat-icon"><Users size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>Total Patients</h3>
                            <p className="admin-stat-value">{data.kpis.total_patients}</p>
                            <span className="admin-stat-tag">+12% ce mois</span>
                        </div>
                    </div>
                    <div className="admin-stat-card success">
                        <div className="admin-stat-icon"><Calendar size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>RDV ce mois</h3>
                            <p className="admin-stat-value">{data.kpis.appointments_this_month}</p>
                            <span className="admin-stat-tag">Sur l'ensemble du réseau</span>
                        </div>
                    </div>
                    <div className="admin-stat-card indigo">
                        <div className="admin-stat-icon"><CircleDollarSign size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>Revenus ce mois</h3>
                            <p className="admin-stat-value">{data.kpis.revenue_this_month}€</p>
                            <span className="admin-stat-tag">Paiements confirmés</span>
                        </div>
                    </div>
                    <div className="admin-stat-card purple">
                        <div className="admin-stat-icon"><Stethoscope size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>Médecins actifs</h3>
                            <p className="admin-stat-value">{data.kpis.active_doctors}</p>
                            <span className="admin-stat-tag">{data.kpis.occupancy_rate}% d'occupation</span>
                        </div>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="admin-charts-grid">
                    <div className="admin-chart-card wide">
                        <div className="admin-chart-header">
                            <h2>Activitéé & revenus</h2>
                            <div className="admin-chart-legend">
                                <span className="dot appointments"></span> RDV
                                <span className="dot revenue"></span> Revenus
                            </div>
                        </div>
                        <div className="admin-chart-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={data.charts.appointments_trend}>
                                    <defs>
                                        <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="admin-chart-card">
                        <div className="admin-chart-header">
                            <h2>Spécialités</h2>
                        </div>
                        <div className="admin-chart-body center">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={data.charts.specialties}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="nom"
                                    >
                                        {data.charts.specialties.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="admin-chart-card">
                        <div className="admin-chart-header">
                            <h2>Statut des RDV</h2>
                        </div>
                        <div className="admin-chart-body">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={data.charts.status}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="statut" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                    <Tooltip />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {data.charts.status.map((entry, index) => (
                                            <Cell key={`bar-${index}`} fill={entry.statut === 'confirme' ? '#10b981' : entry.statut === 'attente' ? '#f59e0b' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardAdmin;








