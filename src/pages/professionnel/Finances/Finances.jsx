import { useState, useEffect } from 'react';
import Sidebar from '../../../components/common/Sidebar';
import {
  Calendar, Users, FileText, Clock,
  Activity, Briefcase, Settings, Euro,
  TrendingDown, TrendingUp, Download, CheckCircle, RefreshCw, AlertCircle, CreditCard
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useAlert } from '../../../context/AlertContext';
import './Finances.css';

const Finances = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('monthly'); // 'monthly' | 'weekly'
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    fetchFinances();
  }, []);

  const fetchFinances = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pro/finances');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Erreur Finances:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (id) => {
    try {
      const res = await api.get(`/pro/finances/${id}/invoice`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture_FAC-${String(id).padStart(5, '0')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur téléchargement facture:', err);
      showAlert({ title: 'Erreur', message: 'Impossible de télécharger la facture.', type: 'error' });
    }
  };

  const handleExportReport = async () => {
    try {
      const btn = document.getElementById('export-report-btn');
      if (btn) btn.innerHTML = '<span class="pro-spinner" style="width: 16px; height: 16px; margin-right: 8px;"></span> Exportation...';
      
      const res = await api.get('/pro/finances/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      
      // Format date like YYYY_MM_DD
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '_');
      link.setAttribute('download', `rapport_financier_${dateStr}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showAlert({ title: 'Succès', message: 'Rapport financier exporté avec succès.', type: 'success' });
    } catch (err) {
      console.error('Erreur exportation rapport:', err);
      showAlert({ title: 'Erreur', message: 'Impossible d\'exporter le rapport financier.', type: 'error' });
    } finally {
      const btn = document.getElementById('export-report-btn');
      if (btn) btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Exporter le rapport';
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

  if (loading || !data) {
    return (
      <div className="pro-finances-layout">
        <Sidebar links={sidebarLinks} />
        <main className="pro-finances-main flex-center">
          <div className="pro-spinner"></div>
        </main>
      </div>
    );
  }

  const { stats, chart, transactions } = data;

  const totalPages = transactions ? Math.ceil(transactions.length / ITEMS_PER_PAGE) : 0;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentTransactions = transactions ? transactions.slice(startIndex, startIndex + ITEMS_PER_PAGE) : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="pro-chart-tooltip">
          <p className="pro-ct-label">{label}</p>
          <p className="pro-ct-value">{payload[0].value}€</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pro-finances-layout">
      <Sidebar links={sidebarLinks} />

      <main className="pro-finances-main">
        <div className="pro-finances-header">
          <div>
            <span className="pro-tag-primary">Tableau de bord financier</span>
            <h1>Revenus & Paiements</h1>
            <p>Suivez vos encaissements et la croissance de votre cabinet.</p>
          </div>
          <button id="export-report-btn" className="pro-btn-primary" onClick={handleExportReport}>
            <Download size={18} /> Exporter le rapport
          </button>
        </div>

        {/* ── Stats Cards ── */}
        <div className="pro-stats-grid">
          <div className="pro-stat-card">
            <div className="pro-sc-top">
              <div className="pro-sc-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                <Euro size={22} />
              </div>
            </div>
            <div className="pro-sc-body">
              <span>Aujourd'hui</span>
              <h3>{stats.today}€</h3>
            </div>
          </div>

          <div className="pro-stat-card">
            <div className="pro-sc-top">
              <div className="pro-sc-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                <Calendar size={22} />
              </div>
              <span className="pro-sc-badge positive"><TrendingUp size={14} /> +12%</span>
            </div>
            <div className="pro-sc-body">
              <span>Ce Mois</span>
              <h3>{stats.this_month}€</h3>
            </div>
          </div>

          <div className="pro-stat-card">
            <div className="pro-sc-top">
              <div className="pro-sc-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
                <Activity size={22} />
              </div>
            </div>
            <div className="pro-sc-body">
              <span>Cette Année</span>
              <h3>{stats.this_year}€</h3>
            </div>
          </div>

          <div className="pro-stat-card">
            <div className="pro-sc-top">
              <div className="pro-sc-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                <Clock size={22} />
              </div>
              <span className="pro-sc-badge warning"><TrendingDown size={14} /> En attente</span>
            </div>
            <div className="pro-sc-body">
              <span>Paiements en attente</span>
              <h3>{stats.pending}€</h3>
            </div>
          </div>
        </div>

        {/* ── Chart Section ── */}
        <div className="pro-finances-box pro-chart-section">
          <div className="pro-box-header">
            <div>
              <h2>Évolution des Revenus</h2>
              <p>Visualisez la tendance de vos encaissements</p>
            </div>
            <div className="pro-chart-toggle">
              <button 
                className={chartView === 'weekly' ? 'active' : ''} 
                onClick={() => setChartView('weekly')}
              >
                Hebdomadaire
              </button>
              <button 
                className={chartView === 'monthly' ? 'active' : ''} 
                onClick={() => setChartView('monthly')}
              >
                Mensuel
              </button>
            </div>
          </div>
          
          <div className="pro-chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              {chartView === 'monthly' ? (
                <AreaChart data={chart.monthly}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 13}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 13}} tickFormatter={(v) => `${v}€`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              ) : (
                <BarChart data={chart.weekly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 13}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 13}} tickFormatter={(v) => `${v}€`} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#F3F4F6'}} />
                  <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Transactions List ── */}
        <div className="pro-finances-box">
          <div className="pro-box-header">
            <h2>Historique des paiements</h2>
          </div>
          
          <div className="pro-table-wrapper">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Type de soin</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="pro-no-data">Aucun paiement trouvé.</td>
                  </tr>
                ) : (
                  currentTransactions.map(trx => {
                    const patient = trx.rendez_vous?.patient?.user;
                    const date = new Date(trx.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    });
                    
                    let statusObj = { label: 'En attente', color: 'warning', icon: <AlertCircle size={14} /> };
                    if (trx.statut === 'paye') statusObj = { label: 'Payé', color: 'success', icon: <CheckCircle size={14} /> };
                    if (trx.statut === 'echoue') statusObj = { label: 'Échoué/Remboursé', color: 'danger', icon: <RefreshCw size={14} /> };

                    return (
                      <tr key={trx.id}>
                        <td>
                          <div className="pro-tbl-patient">
                            <div className="pro-tbl-avatar">
                              {patient ? patient.nom[0] + patient.prenom[0] : '?'}
                            </div>
                            <div className="pro-tbl-pinfo">
                              <h4>{patient ? `${patient.nom} ${patient.prenom}` : 'Inconnu'}</h4>
                            </div>
                          </div>
                        </td>
                        <td className="pro-tbl-date">{date}</td>
                        <td className="pro-tbl-service">{trx.rendez_vous?.service?.nom || 'Standard'}</td>
                        <td className="pro-tbl-amount">{trx.montant}€</td>
                        <td>
                          <span className={`pro-badge pro-badge-${statusObj.color}`}>
                            {statusObj.icon} {statusObj.label}
                          </span>
                        </td>
                        <td>
                          <button className="pro-btn-outline-sm" onClick={() => handleDownloadInvoice(trx.id)}>Facture</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pro-pagination">
              <button 
                className="pro-page-btn" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </button>
              <div className="pro-page-info">
                Page {currentPage} sur {totalPages}
              </div>
              <button 
                className="pro-page-btn" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Finances;
