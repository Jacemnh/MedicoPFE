import { useState, useEffect } from 'react';
import Sidebar from '../../../components/common/Sidebar';
import { Heart, 
  Calendar, User, FileText, Clock,
  CreditCard, Download, Eye, Plus,
  Activity, Droplets, Weight, Ruler,
  AlertTriangle, Pill, ChevronRight,
  Shield, CheckCircle, AlertCircle,
  X, Save, Lock
 } from 'lucide-react';
import api from '../../../api/axios';
import { useAlert } from '../../../context/AlertContext';
import './DossierMedical.css';

const DossierMedical = () => {
  const { showAlert } = useAlert();
  const sidebarLinks = [
    { path: '/patient/dashboard', label: 'Tableau de bord', icon: <User size={20} /> },
    { path: '/patient/rendez-vous', label: 'Mes rendez-vous', icon: <Calendar size={20} /> },
    { path: '/patient/prendre-rendez-vous', label: 'Prendre RDV', icon: <Plus size={20} /> },
    { path: '/patient/dossier-medical', label: 'Dossier médical', icon: <FileText size={20} /> },
    { path: '/patient/diagnostic-ia', label: 'Assistant Médical IA', icon: <Heart size={20} /> },
    { path: '/patient/paiement', label: 'Paiements', icon: <CreditCard size={20} /> },
    { path: '/patient/profil', label: 'Mon profil', icon: <User size={20} /> },

  ];

  const [activeTab, setActiveTab] = useState('consultations');
  const [expandedConsultation, setExpandedConsultation] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [dossier, setDossier] = useState(null);

  const [consultations, setConsultations] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    groupe_sanguin: '',
    allergies: '',
    poids: '',
    taille: '',
    maladies_chroniques: '',
    vaccinations_str: '',
  });

  useEffect(() => {
    fetchDossier();
  }, []);

  const fetchDossier = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patient/dossier');
      
      const data = response.data.data;
      setDossier(data);
      setConsultations(data.consultations || []);
      setDocuments(data.documents || []);
      setVaccinations(data.vaccinations || []);
      
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement du dossier médical');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    setEditForm({
      groupe_sanguin: dossier?.groupe_sanguin || '',
      allergies: dossier?.allergies ? dossier.allergies.join(', ') : '',
      poids: dossier?.poids || '',
      taille: dossier?.taille || '',
      maladies_chroniques: dossier?.maladies_chroniques || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateDossier = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editForm,
        allergies: editForm.allergies ? editForm.allergies.split(',').map(s => s.trim()) : [],
        poids: editForm.poids !== '' ? parseFloat(editForm.poids) : null,
        taille: editForm.taille !== '' ? parseFloat(editForm.taille) : null,
      };

      await api.put('/patient/dossier', payload);
      
      setIsEditModalOpen(false);
      fetchDossier();
      showAlert({ title: 'Succès', message: 'Vos informations personnelles ont été mises à jour avec succès.', type: 'success' });
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Erreur', message: 'Erreur lors de la mise à jour du dossier.', type: 'error' });
    }
  };

  const handleDownloadDossier = async () => {
    try {
      const response = await api.get('/patient/dossier/download', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'dossier_medical.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Erreur', message: 'Erreur lors du téléchargement.', type: 'error' });
    }
  };

  const handleDownloadOrdonnance = async (consultationId) => {
    try {
      const response = await api.get(`/patient/consultation/${consultationId}/ordonnance/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ordonnance_${consultationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Erreur', message: "Erreur lors du téléchargement de l'ordonnance.", type: 'error' });
    }
  };

  if (loading) {
    return <div className="dm-layout"><Sidebar links={sidebarLinks} /><main className="dm-main"><p>Chargement...</p></main></div>;
  }

  const isDossierEmpty = !dossier?.groupe_sanguin && 
                         !dossier?.poids && 
                         !dossier?.taille && 
                         !dossier?.maladies_chroniques && 
                         (!dossier?.allergies || dossier.allergies.length === 0);


  const patientInfo = [
    { icon: <Droplets size={20} />, label: 'Groupe sanguin', value: dossier?.groupe_sanguin || 'Non renseigné', color: '#EF4444' },
    { icon: <AlertTriangle size={20} />, label: 'Allergies', value: dossier?.allergies?.length ? dossier.allergies.join(', ') : 'Aucune', color: '#F59E0B' },
    { icon: <Weight size={20} />, label: 'Poids', value: dossier?.poids ? `${dossier.poids} kg` : 'Non renseigné', color: '#8B5CF6' },
    { icon: <Ruler size={20} />, label: 'Taille', value: dossier?.taille ? `${dossier.taille} cm` : 'Non renseignée', color: '#6366F1' },
    { icon: <Activity size={20} />, label: 'Maladies chroniques', value: dossier?.maladies_chroniques || 'Aucune', color: '#10B981' },
  ];

  const formattedConsultations = consultations.map(c => {
    const d = new Date(c.date_consultation || c.created_at);
    
    let meds = c.ordonnance?.medicaments;
    if (typeof meds === 'string') {
      try {
        meds = JSON.parse(meds);
      } catch (e) {
        meds = [meds];
      }
    }
    const finalMeds = Array.isArray(meds) ? meds : (meds ? [meds] : []);

    return {
      id: c.id,
      rawDate: d,
      day: d.getDate().toString().padStart(2, '0'),
      month: d.toLocaleString('fr-FR', { month: 'short' }),
      doctor: c.professionnel?.user ? `Dr. ${c.professionnel.user.nom} ${c.professionnel.user.prenom}` : 'Médecin',
      specialty: c.professionnel?.specialite?.nom || 'Généraliste',
      motif: c.notes ? 'Consultation' : 'Contrôle',
      diagnostic: c.diagnostique || 'Non spécifié',
      notes: c.notes || 'Aucune note',
      ordonnance: !!c.ordonnance,
      medicaments: finalMeds,
      date_full: d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      avatar: c.professionnel?.user ? `${c.professionnel.user.prenom[0]}${c.professionnel.user.nom[0]}` : 'DR',
      color: '#3B82F6',
      isPaid: c.rendez_vous?.paiement?.statut === 'paye',
    };
  }).sort((a, b) => b.rawDate - a.rawDate);


  const tabs = [
    { id: 'consultations', label: 'Consultations', icon: <Activity size={18} />, count: formattedConsultations.length },
  ];

  return (
    <div className="dm-layout">
      <Sidebar links={sidebarLinks} />

      <main className="dm-main">

        {/* ── Header ─────────────────────────────────── */}
        <div className="dm-header">
          <div className="dm-header-left">
            <span className="dm-header-tag">Dossier médical</span>
            <h1 className="dm-header-title">Mon dossier de santé</h1>
            <p className="dm-header-sub">Accédez à votre historique complet et vos documents</p>
          </div>
          <button className="dm-download-btn" onClick={handleDownloadDossier}>
            <Download size={18} />
            Télécharger le dossier complet
          </button>
        </div>

        {/* ── Patient Info Card ───────────────────────── */}
        <div className="dm-info-card">
          <div className="dm-info-card-header">
            <div className="dm-info-avatar">
              <User size={32} />
            </div>
            <div className="dm-info-identity">
              <h2>Informations personnelles</h2>
              <p>Dernière mise à jour : {dossier?.updated_at ? new Date(dossier.updated_at).toLocaleDateString('fr-FR') : 'Récente'}</p>
            </div>
            <button className="dm-edit-btn" onClick={handleOpenEditModal}>
              {isDossierEmpty ? 'Ajouter' : 'Modifier'}
            </button>
          </div>

          <div className="dm-info-grid">
            {patientInfo.map((item, i) => (
              <div key={i} className="dm-info-item">
                <div className="dm-info-icon" style={{ background: `${item.color}18`, color: item.color }}>
                  {item.icon}
                </div>
                <div className="dm-info-content">
                  <span className="dm-info-label">{item.label}</span>
                  <span className="dm-info-value">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────── */}
        <div className="dm-tabs-wrapper">
          <div className="dm-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`dm-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className={`dm-tab-count ${activeTab === tab.id ? 'active' : ''}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Consultations ──────────────────────────── */}
        {activeTab === 'consultations' && (
          <div className="dm-section">
            <div className="dm-section-header">
              <h2>Historique des consultations</h2>
              <span className="dm-count-badge">{formattedConsultations.length} consultations</span>
            </div>

            <div className="dm-consultations">
              {formattedConsultations.length === 0 && <p className="dm-empty-state">Aucune consultation trouvée.</p>}
              {formattedConsultations.map((c) => (
                <div key={c.id} className={`dm-consult-card ${expandedConsultation === c.id ? 'expanded' : ''}`}>
                  <div className="dm-consult-main" onClick={() => setExpandedConsultation(expandedConsultation === c.id ? null : c.id)}>
                    {/* Date Badge */}
                    <div className="dm-consult-date" style={{ background: `${c.color}18` }}>
                      <span className="dm-date-day" style={{ color: c.color }}>{c.day}</span>
                      <span className="dm-date-month" style={{ color: c.color }}>{c.month}</span>
                    </div>

                    {/* Doctor */}
                    <div className="dm-consult-doctor">
                      <div className="dm-doctor-avatar" style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}99)` }}>
                        {c.avatar}
                      </div>
                      <div className="dm-doctor-info">
                        <h3>{c.doctor}</h3>
                        <span className="dm-specialty">{c.specialty}</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="dm-consult-details">
                      <div className="dm-detail-pill">
                        <span className="dm-detail-label">Motif</span>
                        <span className="dm-detail-value">{c.motif}</span>
                      </div>
                      <div className="dm-detail-pill">
                        <span className="dm-detail-label">Diagnostic</span>
                        <span className="dm-detail-value">{c.diagnostic}</span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight
                      size={20}
                      className={`dm-consult-arrow ${expandedConsultation === c.id ? 'rotated' : ''}`}
                    />
                  </div>

                  {/* Expanded Content */}
                  {expandedConsultation === c.id && (
                    <div className="dm-consult-expanded">
                      {c.isPaid ? (
                        <>
                          <div className="dm-notes-block">
                            <span className="dm-notes-label">Notes du médecin</span>
                            <p className="dm-notes-text">{c.notes}</p>
                          </div>
                          <div className="dm-consult-actions">
                            <button 
                              className="dm-action-btn dm-action-outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedConsultation(c);
                                setIsDetailModalOpen(true);
                              }}
                            >
                              <Eye size={16} />
                              Voir le détail
                            </button>
                            {c.ordonnance && (
                              <button 
                                className="dm-action-btn dm-action-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadOrdonnance(c.id);
                                }}
                              >
                                <Download size={16} />
                                Télécharger l'ordonnance
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="dm-payment-notice">
                          <div className="dm-payment-notice-icon">
                            <Lock size={22} />
                          </div>
                          <div className="dm-payment-notice-content">
                            <h4>Paiement requis</h4>
                            <p>Les détails de cette consultation seront disponibles après le règlement. Rendez-vous dans l'onglet <strong>Paiements</strong> pour effectuer votre règlement.</p>
                          </div>
                          <a href="/patient/paiement" className="dm-action-btn dm-action-primary" onClick={(e) => e.stopPropagation()}>
                            <CreditCard size={16} />
                            Accéder aux paiements
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        )}


      </main>

      {/* ── Edit Modal ─────────────────────────────── */}
      {isEditModalOpen && (
        <div className="dm-modal-overlay">
          <div className="dm-modal">
            <div className="dm-modal-header dm-edit-header">
              <div className="dm-modal-header-info">
                <div className="dm-header-icon">
                  <User size={24} color="#8B5CF6" />
                </div>
                <div>
                  <h2>{isDossierEmpty ? 'Ajouter mes informations' : 'Modifier mes informations'}</h2>
                  <p>Mettez à jour vos données médicales</p>
                </div>
              </div>
              <button className="dm-modal-close" onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateDossier} className="dm-modal-form">
              
              <div className="dm-form-section">
                <div className="dm-form-section-title">
                  <Activity size={16} />
                  <span>Données physiologiques</span>
                </div>
                
                <div className="dm-form-row">
                  <div className="dm-form-group">
                    <label>Groupe sanguin</label>
                    <div className="dm-input-with-icon">
                      <Droplets size={18} className="dm-input-icon" color="#EF4444" />
                      <select 
                        value={editForm.groupe_sanguin} 
                        onChange={(e) => setEditForm({...editForm, groupe_sanguin: e.target.value})}
                      >
                        <option value="">Non renseigné</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="dm-form-row">
                  <div className="dm-form-group">
                    <label>Poids (kg)</label>
                    <div className="dm-input-with-icon">
                      <Weight size={18} className="dm-input-icon" color="#8B5CF6" />
                      <input 
                        type="number" 
                        step="0.1"
                        value={editForm.poids} 
                        onChange={(e) => setEditForm({...editForm, poids: e.target.value})}
                        placeholder="Ex: 70"
                      />
                    </div>
                  </div>
                  <div className="dm-form-group">
                    <label>Taille (cm)</label>
                    <div className="dm-input-with-icon">
                      <Ruler size={18} className="dm-input-icon" color="#6366F1" />
                      <input 
                        type="number" 
                        value={editForm.taille} 
                        onChange={(e) => setEditForm({...editForm, taille: e.target.value})}
                        placeholder="Ex: 175"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="dm-form-section">
                <div className="dm-form-section-title">
                  <AlertTriangle size={16} />
                  <span>Antécédents médicaux</span>
                </div>

                <div className="dm-form-group">
                  <label>Allergies connues</label>
                  <div className="dm-input-with-icon">
                    <AlertTriangle size={18} className="dm-input-icon" color="#F59E0B" />
                    <input 
                      type="text" 
                      value={editForm.allergies} 
                      onChange={(e) => setEditForm({...editForm, allergies: e.target.value})}
                      placeholder="Ex: Pénicilline, Pollen (séparées par une virgule)"
                    />
                  </div>
                </div>

                <div className="dm-form-group">
                  <label>Maladies chroniques</label>
                  <div className="dm-textarea-with-icon">
                    <Activity size={18} className="dm-input-icon" color="#10B981" />
                    <textarea 
                      value={editForm.maladies_chroniques} 
                      onChange={(e) => setEditForm({...editForm, maladies_chroniques: e.target.value})}
                      placeholder="Ex: Diabète type 2, Asthme..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="dm-modal-actions">
                <button type="button" className="dm-btn-cancel" onClick={() => setIsEditModalOpen(false)}>Annuler</button>
                <button type="submit" className="dm-btn-save">
                  <Save size={18} />
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Consultation Detail Modal ──────────────── */}
      {isDetailModalOpen && selectedConsultation && (
        <div className="dm-modal-overlay">
          <div className="dm-modal dm-modal-large">
            <div className="dm-modal-header">
              <div className="dm-modal-header-info">
                <Activity size={24} color="#3B82F6" />
                <div>
                  <h2>Détails de la consultation</h2>
                  <p>{selectedConsultation.date_full}</p>
                </div>
              </div>
              <button className="dm-modal-close" onClick={() => setIsDetailModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="dm-modal-body">
              <div className="dm-detail-section">
                <div className="dm-detail-doctor-card">
                  <div className="dm-doctor-avatar-large">
                    {selectedConsultation.avatar}
                  </div>
                  <div className="dm-doctor-identity">
                    <h3>{selectedConsultation.doctor}</h3>
                    <span className="dm-specialty">{selectedConsultation.specialty}</span>
                  </div>
                </div>
              </div>

              <div className="dm-detail-grid">
                <div className="dm-detail-block">
                  <span className="dm-detail-label">Motif de consultation</span>
                  <p className="dm-detail-text">{selectedConsultation.motif}</p>
                </div>
                <div className="dm-detail-block">
                  <span className="dm-detail-label">Diagnostic</span>
                  <p className="dm-detail-text highlight">{selectedConsultation.diagnostic}</p>
                </div>
              </div>

              <div className="dm-detail-block full">
                <span className="dm-detail-label">Observations et notes</span>
                <div className="dm-notes-container">
                  <p className="dm-detail-text">{selectedConsultation.notes}</p>
                </div>
              </div>

              {selectedConsultation.ordonnance && (
                <div className="dm-detail-block full">
                  <span className="dm-detail-label">Prescription (Ordonnance)</span>
                  <div className="dm-prescription-list">
                    {selectedConsultation.medicaments.map((med, idx) => (
                      <div key={idx} className="dm-med-item">
                        <Pill size={16} color="#8B5CF6" />
                        <div className="dm-med-info">
                          <span className="dm-med-name">{med.nom || med}</span>
                          {med.posologie && <span className="dm-med-poso">{med.posologie}</span>}
                        </div>
                      </div>
                    ))}
                    {selectedConsultation.medicaments.length === 0 && <p className="dm-empty-text">Détails de l'ordonnance non renseignés.</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="dm-modal-actions">
              <button className="dm-btn-cancel" onClick={() => setIsDetailModalOpen(false)}>Fermer</button>
              {selectedConsultation.ordonnance && (
                <button 
                  className="dm-btn-save" 
                  onClick={() => handleDownloadOrdonnance(selectedConsultation.id)}
                >
                  <Download size={18} />
                  Télécharger l'ordonnance
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


export default DossierMedical;