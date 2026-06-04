import { useState, useEffect } from 'react';
import Sidebar from '../../../components/common/Sidebar';
import { Heart, 
  Calendar, User, FileText, Clock,
  CreditCard, Download, CheckCircle,
  AlertCircle, RefreshCw, Plus,
  TrendingUp, ArrowUpRight, ArrowDownLeft,
  Wallet, Shield, Star, ChevronRight,
  Receipt, Banknote, Search
 } from 'lucide-react';
import api from '../../../api/axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './Paiement.css';

const Paiement = () => {
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
  const [search, setSearch] = useState('');
  const [paying, setPaying] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPayments();
    handlePaymentReturn();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/patient/paiements');
      if (res.data.success) {
        setPayments(res.data.data.map(p => ({
          id: p.id,
          rawDate: new Date(p.created_at),
          date: new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
          day: new Date(p.created_at).getDate().toString().padStart(2, '0'),
          month: new Date(p.created_at).toLocaleString('fr-FR', { month: 'short' }),
          doctor: `Dr. ${p.rendez_vous.professionnel.user.nom} ${p.rendez_vous.professionnel.user.prenom}`,
          initials: `${p.rendez_vous.professionnel.user.nom[0]}${p.rendez_vous.professionnel.user.prenom[0]}`,
          color: '#8B5CF6',
          service: p.rendez_vous.service.nom,
          montant: parseFloat(p.montant),
          status: p.statut === 'paye' ? 'paid' : (p.statut === 'echoue' ? 'refunded' : 'pending'),
          method: p.statut === 'paye' ? 'Stripe' : 'À régler',
        })));
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des paiements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentReturn = async () => {
    const params = new URLSearchParams(location.search);
    const success = params.get('success');
    const paymentId = params.get('payment_id');

    if (success === 'true' && paymentId) {
      try {
        const res = await api.post(`/patient/paiements/${paymentId}/verify`);
        if (res.data.success) {
          setShowSuccessModal(true);
          fetchPayments(); // Refresh
          navigate('/patient/paiement', { replace: true });
        }
      } catch (err) {
        console.error('Erreur lors de la vérification du paiement:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
           alert('Session expirée ou non autorisée. Veuillez vous reconnecter puis vérifier vos paiements.');
        } else {
           alert('Une erreur est survenue lors de la confirmation du paiement. Veuillez contacter le support.');
        }
      }
    }
  };

  const filtered = payments.filter(p => {
    const matchF = filter === 'tous' || p.status === filter;
    const matchS = p.doctor.toLowerCase().includes(search.toLowerCase()) ||
      p.service.toLowerCase().includes(search.toLowerCase());
    return matchF && matchS;
  });

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.montant, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.montant, 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthPaid = payments.filter(p => p.status === 'paid' && p.rawDate?.getMonth() === currentMonth && p.rawDate?.getFullYear() === currentYear);
  const totalThisMonth = thisMonthPaid.reduce((s, p) => s + p.montant, 0);

  const statusCfg = {
    paid: { label: 'Payé', icon: <CheckCircle size={14} />, cls: 'pay-badge-paid' },
    pending: { label: 'En attente', icon: <AlertCircle size={14} />, cls: 'pay-badge-pending' },
    refunded: { label: 'Remboursé', icon: <RefreshCw size={14} />, cls: 'pay-badge-refunded' },
  };

  const filters = [
    { id: 'tous', label: 'Tous', count: payments.length },
    { id: 'paid', label: 'Payés', count: payments.filter(p => p.status === 'paid').length },
    { id: 'pending', label: 'En attente', count: payments.filter(p => p.status === 'pending').length },
  ];

  const handlePay = async (id) => {
    setPaying(id);
    try {
      const res = await api.post(`/patient/paiements/${id}/checkout`);
      if (res.data.success && res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Erreur Stripe:', err);
      alert('Impossible d\'initier le paiement Stripe.');
      setPaying(null);
    }
  };

  const handleDownloadInvoice = async (id) => {
    try {
      const res = await api.get(`/patient/paiements/${id}/invoice`, {
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
      alert('Impossible de télécharger la facture.');
    }
  };

  const handleExportReport = async () => {
    try {
      const btn = document.getElementById('export-report-btn-patient');
      if (btn) btn.innerHTML = '<span class="pay-spinner" style="width: 16px; height: 16px; margin-right: 8px;"></span> Exportation...';
      
      const res = await api.get('/patient/paiements/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '_');
      link.setAttribute('download', `rapport_paiements_${dateStr}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur exportation rapport:', err);
      alert('Impossible d\'exporter le rapport des paiements.');
    } finally {
      const btn = document.getElementById('export-report-btn-patient');
      if (btn) btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Exporter';
    }
  };

  return (
    <div className="pay-layout">
      <Sidebar links={sidebarLinks} />

      <main className="pay-main">

        {/* ── Header ──────────────────────────────── */}
        <div className="pay-header">
          <div>
            <span className="pay-tag">Finances</span>
            <h1 className="pay-title">Mes paiements</h1>
            <p className="pay-subtitle">Gérez vos transactions et factures médicales</p>
          </div>
          <button id="export-report-btn-patient" className="pay-export-btn" onClick={handleExportReport}>
            <Download size={18} /> Exporter
          </button>
        </div>

        {/* ── Stats ───────────────────────────────── */}
        <div className="pay-stats">

          <div className="pay-stat-card pay-stat-main">
            <div className="pay-stat-bg-deco" />
            <div className="pay-stat-top">
              <div className="pay-stat-icon pay-si-purple">
                <Wallet size={22} />
              </div>
              <span className="pay-stat-trend">
                <TrendingUp size={14} /> +12%
              </span>
            </div>
            <div className="pay-stat-body">
              <span className="pay-stat-label">Total dépensé</span>
              <span className="pay-stat-value">{totalPaid}€</span>
              <span className="pay-stat-sub">{payments.filter(p => p.status !== 'pending' && p.status !== 'refunded').length} transactions</span>
            </div>
          </div>

          <div className="pay-stat-card">
            <div className="pay-stat-top">
              <div className="pay-stat-icon pay-si-green">
                <ArrowUpRight size={22} />
              </div>
            </div>
            <div className="pay-stat-body">
              <span className="pay-stat-label">Payé</span>
              <span className="pay-stat-value pay-val-green">{totalPaid}€</span>
              <span className="pay-stat-sub">{payments.filter(p => p.status === 'paid').length} paiements</span>
            </div>
          </div>

          <div className="pay-stat-card">
            <div className="pay-stat-top">
              <div className="pay-stat-icon pay-si-orange">
                <Clock size={22} />
              </div>
            </div>
            <div className="pay-stat-body">
              <span className="pay-stat-label">En attente</span>
              <span className="pay-stat-value pay-val-orange">{totalPending}€</span>
              <span className="pay-stat-sub">{payments.filter(p => p.status === 'pending').length} facture(s)</span>
            </div>
          </div>

          <div className="pay-stat-card">
            <div className="pay-stat-top">
              <div className="pay-stat-icon pay-si-blue">
                <Calendar size={22} />
              </div>
            </div>
            <div className="pay-stat-body">
              <span className="pay-stat-label">Dépenses ce mois</span>
              <span className="pay-stat-value pay-val-blue">{totalThisMonth}€</span>
              <span className="pay-stat-sub">{thisMonthPaid.length} paiement(s)</span>
            </div>
          </div>

        </div>

        {/* ── Transactions ────────────────────────── */}
        <div className="pay-section">

          <div className="pay-section-header">
            <div>
              <h2>Historique des transactions</h2>
              <p>{filtered.length} transaction(s) trouvée(s)</p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="pay-toolbar">
            <div className="pay-filters">
              {filters.map(f => (
                <button
                  key={f.id}
                  className={`pay-filter-btn ${filter === f.id ? 'active' : ''}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                  <span className={`pay-fc ${filter === f.id ? 'active' : ''}`}>{f.count}</span>
                </button>
              ))}
            </div>
            <div className="pay-search-wrap">
              <Search size={17} className="pay-search-ico" />
              <input
                className="pay-search-inp"
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <div className="pay-list">
            {loading ? (
              <div className="pay-empty">
                <RefreshCw size={48} className="pay-spinner" />
                <h3>Chargement...</h3>
              </div>
            ) : filtered.length === 0 ? (
              <div className="pay-empty">
                <Receipt size={48} />
                <h3>Aucune transaction trouvée</h3>
                <p>Modifiez vos filtres de recherche</p>
              </div>
            ) : filtered.map((p, i) => {
              const cfg = statusCfg[p.status];
              const isLoading = paying === p.id;
              return (
                <div
                  key={p.id}
                  className="pay-row"
                  style={{ '--delay': `${i * 0.07}s` }}
                >
                  {/* Date */}
                  <div className="pay-row-date" style={{ background: `${p.color}15` }}>
                    <span className="pay-rd-day" style={{ color: p.color }}>{p.day}</span>
                    <span className="pay-rd-month" style={{ color: p.color }}>{p.month}</span>
                  </div>

                  {/* Doctor */}
                  <div className="pay-row-doctor">
                    <div
                      className="pay-doc-av"
                      style={{ background: `linear-gradient(135deg,${p.color},${p.color}88)` }}
                    >
                      {p.initials}
                    </div>
                    <div className="pay-doc-txt">
                      <h4>{p.doctor}</h4>
                      <span>{p.service}</span>
                    </div>
                  </div>

                  {/* Method */}
                  <div className="pay-row-method">
                    <span className="pay-method-icon">
                      {p.status === 'paid' ? <CreditCard size={16} /> : <Clock size={16} />}
                    </span>
                    <span>{p.method}</span>
                  </div>

                  {/* Amount */}
                  <div className={`pay-row-amount ${p.status === 'refunded' ? 'refunded' : ''}`}>
                    {p.status === 'refunded' ? '+' : '-'}{p.montant}€
                  </div>

                  {/* Badge */}
                  <span className={`pay-badge ${cfg.cls}`}>
                    {cfg.icon} {cfg.label}
                  </span>

                  {/* Actions */}
                  <div className="pay-row-actions">
                    {p.status === 'pending' && (
                      <button
                        className={`pay-action-primary ${isLoading ? 'loading' : ''}`}
                        onClick={() => handlePay(p.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="pay-spinner" />
                        ) : (
                          <><CreditCard size={15} /> Payer</>
                        )}
                      </button>
                    )}
                    {(p.status === 'paid' || p.status === 'refunded') && (
                      <button className="pay-action-outline" onClick={() => handleDownloadInvoice(p.id)}>
                        <Download size={15} /> Facture
                      </button>
                    )}
                    <button className="pay-action-icon">
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Payment Methods ──────────────────────── */}
        <div className="pay-section">
          <div className="pay-section-header">
            <div>
              <h2>Moyens de paiement</h2>
              <p>Gérez vos cartes et comptes</p>
            </div>
            <button className="pay-add-card-btn">
              <Plus size={17} /> Ajouter une carte
            </button>
          </div>

          <div className="pay-methods-grid">
            {/* Main Card — Visual */}
            <div className="pay-card-visual">
              <div className="pay-cv-top">
                <div className="pay-cv-chip" />
                <div className="pay-cv-logo">VISA</div>
              </div>
              <div className="pay-cv-number">•••• •••• •••• 4242</div>
              <div className="pay-cv-bottom">
                <div>
                  <span className="pay-cv-label">Titulaire</span>
                  <span className="pay-cv-val">Jean Dupont</span>
                </div>
                <div>
                  <span className="pay-cv-label">Expire</span>
                  <span className="pay-cv-val">12 / 25</span>
                </div>
                <div className="pay-cv-default">
                  <Star size={14} fill="white" color="white" />
                  Par défaut
                </div>
              </div>
            </div>

            {/* Info Panel */}
            <div className="pay-methods-info">
              <div className="pay-method-item">
                <div className="pay-mi-icon">
                  <Shield size={20} />
                </div>
                <div className="pay-mi-text">
                  <h4>Paiement sécurisé</h4>
                  <p>Vos données bancaires sont chiffrées et protégées</p>
                </div>
              </div>
              <div className="pay-method-item">
                <div className="pay-mi-icon pay-mi-green">
                  <Banknote size={20} />
                </div>
                <div className="pay-mi-text">
                  <h4>Remboursement automatique</h4>
                  <p>Demandez un remboursement en quelques clics</p>
                </div>
              </div>
              <div className="pay-method-item">
                <div className="pay-mi-icon pay-mi-orange">
                  <Receipt size={20} />
                </div>
                <div className="pay-mi-text">
                  <h4>Factures disponibles</h4>
                  <p>Téléchargez toutes vos factures en PDF</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* ── Success Modal ──────────────────────── */}
      {showSuccessModal && (
        <div className="pay-modal-overlay">
          <div className="pay-modal">
            <div className="pay-modal-icon">
              <CheckCircle size={56} />
            </div>
            <h2>Paiement réussi !</h2>
            <p>Votre règlement a été traité avec succès. La facture est désormais disponible dans votre espace.</p>
            <button className="pay-modal-btn" onClick={() => setShowSuccessModal(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Paiement;