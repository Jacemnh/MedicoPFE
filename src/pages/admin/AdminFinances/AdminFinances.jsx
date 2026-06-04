import { useState, useEffect } from 'react';
import { 
    Users, CircleDollarSign, TrendingUp, Wallet,
    Activity, Stethoscope, Menu, PieChart as PieChartIcon, Tag,
    Clock, ShieldCheck
, User } from 'lucide-react';
import { 
    ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area
} from 'recharts';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar';
import AdminHeader from '../../../components/admin/AdminHeader';
import './AdminFinances.css';

const AdminFinances = () => {
    const [stats, setStats] = useState(null);
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
                const res = await api.get('/admin/stats/finances');
                if (res.data.success) {
                    setStats(res.data.data);
                }
            } catch (err) {
                console.error('Error fetching finance stats', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="label">{label}</p>
                    <p className="desc">{`${payload[0].value} €`}</p>
                </div>
            );
        }
        return null;
    };

    if (loading) return <div className="admin-loading">Chargement des données financières...</div>;

    return (
        <div className="admin-layout">
            <Sidebar links={sidebarLinks} />
            
            <main className="admin-main">
                <AdminHeader 
                    title="Analyses Financières" 
                    subtitle="Suivi des revenus, des paiements et des performances globales" 
                />

                <div className="admin-stats-grid">
                    <div className="admin-stat-card primary">
                        <div className="admin-stat-icon"><CircleDollarSign size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>Revenus Totaux</h3>
                            <p className="admin-stat-value">{stats.total_revenue}€</p>
                            <span className="admin-stat-tag">Global cumulé</span>
                        </div>
                    </div>
                    
                    <div className="admin-stat-card success">
                        <div className="admin-stat-icon"><Wallet size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>Revenus du mois</h3>
                            <p className="admin-stat-value">{stats.current_month_revenue}€</p>
                            <span className="admin-stat-tag">Ce mois-ci</span>
                        </div>
                    </div>

                    <div className="admin-stat-card warning">
                        <div className="admin-stat-icon"><Clock size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>En attente</h3>
                            <p className="admin-stat-value">{stats.pending_amount}€</p>
                            <span className="admin-stat-tag">Paiements impayés</span>
                        </div>
                    </div>

                    <div className="admin-stat-card indigo">
                        <div className="admin-stat-icon"><TrendingUp size={24} /></div>
                        <div className="admin-stat-info">
                            <h3>crééoissance</h3>
                            <p className="admin-stat-value">{stats.monthly_growth > 0 ? '+' : ''}{stats.monthly_growth.toFixed(1)}%</p>
                            <span className="admin-stat-tag">Vs mois dernier</span>
                        </div>
                    </div>
                </div>

                <div className="admin-charts-grid">
                    {/* Évolution des revenus */}
                    <div className="admin-chart-card wide">
                        <div className="admin-chart-header">
                            <h2>Évolution des revenus (6 derniers mois)</h2>
                        </div>
                        <div className="admin-chart-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={stats.revenue_trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Payés vs Impayés */}
                    <div className="admin-chart-card">
                        <div className="admin-chart-header">
                            <h2>Répartition des paiements</h2>
                        </div>
                        <div className="admin-chart-body center">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={stats.paid_unpaid}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {stats.paid_unpaid.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Revenus par médecin */}
                    <div className="admin-chart-card">
                        <div className="admin-chart-header">
                            <h2>Top 5 Revenus / Médecin</h2>
                        </div>
                        <div className="admin-chart-body">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={stats.by_doctor} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} width={100} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Revenus par service */}
                    <div className="admin-chart-card wide">
                        <div className="admin-chart-header">
                            <h2>Performance par Service</h2>
                        </div>
                        <div className="admin-chart-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stats.by_service} margin={{ top: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="nom" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminFinances;








