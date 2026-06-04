import { useState, useEffect } from 'react';
import { useLocation, useSearchParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../../../components/common/Sidebar';
import api from '../../../api/axios';
import {
  Calendar, User, FileText, Clock,
  CreditCard, Search, MapPin, Plus,
  ChevronLeft, ChevronRight, Star, CheckCircle,
  Video, Building2, ArrowRight,
  Stethoscope, Heart, Eye, Baby,
  Smile, Activity, Navigation, Briefcase, Phone, AlertTriangle
} from 'lucide-react';
import { useAlert } from '../../../context/AlertContext';
import { useAuth } from '../../../context/AuthContext';
import NotificationsMenu from '../../../components/common/NotificationsMenu';
import './PrendreRendezVous.css';
import '../../Search/SearchResults.css';

const PrendreRendezVous = () => {
  const { showAlert } = useAlert();
  const { user } = useAuth();
  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http') || photo.startsWith('/')) return photo;
    return `/storage/${photo}`;
  };

  const sidebarLinks = [
    { path: '/patient/dashboard', label: 'Tableau de bord', icon: <User size={20} /> },
    { path: '/patient/rendez-vous', label: 'Mes rendez-vous', icon: <Calendar size={20} /> },
    { path: '/patient/prendre-rendez-vous', label: 'Prendre RDV', icon: <Plus size={20} /> },
    { path: '/patient/dossier-medical', label: 'Dossier médical', icon: <FileText size={20} /> },
    { path: '/patient/diagnostic-ia', label: 'Assistant Médical IA', icon: <Heart size={20} /> },
    { path: '/patient/paiement', label: 'Paiements', icon: <CreditCard size={20} /> },
    { path: '/patient/profil', label: 'Mon profil', icon: <User size={20} /> },
  ];

  const location = useLocation();
  const [step, setStep] = useState(1);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || ''); // This will be our query
  const [locationValue, setLocationValue] = useState(searchParams.get('loc') || '');
  const [confirmed, setConfirmed] = useState(false);
  const [expandedDoctorId, setExpandedDoctorId] = useState(null);
  const [expandedServices, setExpandedServices] = useState({}); // { proId: boolean }

  // New states for advanced filters
  const [filterService, setFilterService] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedPro, setSelectedPro] = useState(null);
  const [rescheduleAptId, setRescheduleAptId] = useState(location.state?.rescheduleAptId || null);

  // New states for payment blocking
  const [isBlocked, setIsBlocked] = useState(false);
  const [checkingBlock, setCheckingBlock] = useState(true);
  const navigate = useNavigate();

  // Check payment status on mount
  useEffect(() => {
    const checkPayment = async () => {
      try {
        const res = await api.get('/patient/check-payment-status');
        if (res.data.success && res.data.blocked) {
          setIsBlocked(true);
        }
      } catch (err) {
        console.error("Erreur vérification paiement:", err);
      } finally {
        setCheckingBlock(false);
      }
    };
    checkPayment();
  }, []);

  // Gérer la sélection automatique depuis la recherche (SearchBar)
  useEffect(() => {
    if (location.state?.selectedDoctor) {
      const doc = location.state.selectedDoctor;
      setSelectedDoctor(doc);
      setSelectedSpecialty(doc.specialty);
      fetchDoctorSlots(doc.id);
      setStep(3); // Aller directement à la sélection de date
    } else if (location.state?.rescheduleDoctorName) {
      setSearchTerm(location.state.rescheduleDoctorName);
      if (location.state.rescheduleAptId) {
        setRescheduleAptId(location.state.rescheduleAptId);
      }
      setStep(2); // Aller directement à la liste filtrée (Étape 2)
    }
  }, [location.state]);


  const [querySuggestions, setQuerySuggestions] = useState([]);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState(null);
  const [doctorsList, setDoctorsList] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [doctorSlots, setDoctorSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const fetchSuggestions = async (type, val) => {
    if (val.length < 1) {
      if (type === 'query') setQuerySuggestions([]);
      else setLocationSuggestions([]);
      return;
    }
    try {
      const res = await api.get('/professionnels/suggestions', { params: { type, val } });
      if (type === 'query') setQuerySuggestions(res.data);
      else setLocationSuggestions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch professionals
  useEffect(() => {
    const fetchPros = async () => {
      try {
        const [prosRes, specRes] = await Promise.all([
          api.get('/patient/professionnels'),
          api.get('/specialites')
        ]);
        if (prosRes.data.success) {
          setDoctorsList(prosRes.data.data);
        }
        setSpecialites(specRes.data);
      } catch (err) {
        console.error("Erreur chargement pro/spec:", err);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchPros();
  }, []);

  // Use dynamic doctors list instead of mock
  const doctors = doctorsList;

  // We fetch slots for the next 4 weeks
  const fetchDoctorSlots = async (proId) => {
    setLoadingSlots(true);
    setDoctorSlots([]); // clear old
    try {
      // Get current week Monday
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);

      let allSlots = [];

      // Fetch 4 consecutive weeks
      for (let i = 0; i < 4; i++) {
        const mStr = monday.toLocaleDateString('en-CA');
        const res = await api.get(`/plages-horaires/${proId}?date=${mStr}`);
        if (res.data.success) {
          allSlots = [...allSlots, ...res.data.data];
        }
        monday.setDate(monday.getDate() + 7);
      }

      setDoctorSlots(allSlots);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Group slots by date and morning/afternoon dynamically
  const availableDates = [...new Set(doctorSlots.map(s => s.date.substring(0, 10)))].sort();

  const getSlotsForDate = (date) => {
    const daySlots = doctorSlots.filter(s => s.date.substring(0, 10) === date);
    daySlots.sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));

    // Matin = avant 13h, Après-midi = après 13h
    const morning = daySlots.filter(s => parseInt(s.heure_debut.substring(0, 2)) < 13);
    const afternoon = daySlots.filter(s => parseInt(s.heure_debut.substring(0, 2)) >= 13);

    return { morning, afternoon };
  };

  const handleBookDirect = (pro, slot) => {
    setSelectedDoctor(pro);
    setSelectedTime(slot);
    setSelectedDate(slot.date || new Date().toISOString().split('T')[0]);
    setStep(3); // Aller à la sélection de l'acte/service
  };

  const currentDaySlots = selectedDate ? getSlotsForDate(selectedDate) : { morning: [], afternoon: [] };

  const goTo = (s) => {
    setStep(s);
    // Reset following steps if going back
    if (s < 4) setConfirmed(false);
    if (s < 3) setSelectedServices([]);
    if (s < 2) { setSelectedTime(''); setSelectedDoctor(null); }
  };

  const toggleService = (service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.nom === service.nom);
      if (exists) return prev.filter(s => s.nom !== service.nom);
      return [...prev, service];
    });
  };

  // Fallback if needed for the old step flow
  const handleConfirm = async () => {
    try {
      const customMotifInput = document.querySelector('.prv-note-input')?.value || '';
      const servicesNames = selectedServices.map(s => s.nom).join(', ');
      const finalMotif = [servicesNames, customMotifInput].filter(Boolean).join(' - ');

      const payload = {
        professionnel_id: selectedDoctor.id,
        plage_horaire_id: selectedTime.id,
        service_ids: selectedServices.map(s => s.id),
        motif: finalMotif || 'Consultation'
      };

      const res = rescheduleAptId 
        ? await api.put(`/patient/rendez-vous/${rescheduleAptId}/reschedule`, payload)
        : await api.post('/patient/rendez-vous', payload);
      if (res.data.success) {
        setConfirmed(true);
        setTimeout(() => {
          setConfirmed(false);
          setStep(1);
          setSelectedSpecialty('');
          setSelectedDoctor(null);
          setSelectedDate('');
          setSelectedTime(null);
          setSelectedServices([]);
          setRescheduleAptId(null);
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Erreur', message: "Erreur lors de la réservation du créneau.", type: 'error' });
    }
  };

  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  };
  const nextDays = getNextDays();

  const isPastSlot = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return false;
    const now = new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Create Date object using local time components
    const slotDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return slotDate < now;
  };

  const filteredDoctors = doctors.filter(d => {
    const q = searchTerm.toLowerCase();
    const l = locationValue.toLowerCase();

    const matchesQuery = !searchTerm ||
      d.name.toLowerCase().includes(q) ||
      (d.specialty && d.specialty.toLowerCase().includes(q)) ||
      (d.cabinet_name && d.cabinet_name.toLowerCase().includes(q));

    const matchesLoc = !locationValue ||
      (d.cabinet_city && d.cabinet_city.toLowerCase().includes(l)) ||
      (d.location && d.location.toLowerCase().includes(l));

    const matchesMaxPrice = !filterMaxPrice || 
      (d.services && d.services.some(s => parseFloat(s.prix) <= parseFloat(filterMaxPrice))) ||
      (parseFloat(d.price) <= parseFloat(filterMaxPrice));

    const matchesService = !filterService || 
      (d.services && d.services.some(s => s.nom.toLowerCase().includes(filterService.toLowerCase())));

    const matchesDate = !filterDate || (d.prochaines_dispos && d.prochaines_dispos[filterDate] && d.prochaines_dispos[filterDate].length > 0);

    return matchesQuery && matchesLoc && matchesMaxPrice && matchesService && matchesDate;
  });

  const stepsConfig = [
    { n: 1, label: 'Recherche' },
    { n: 2, label: 'Praticien' },
    { n: 3, label: 'Service' },
    { n: 4, label: 'Confirmation' },
  ];

  /* ── Success Screen ─────────────────────────── */
  if (confirmed) return (
    <div className="prv-layout">
      <Sidebar links={sidebarLinks} />
      <main className="prv-main">
        <div className="prv-success">
          <div className="prv-success-circle">
            <CheckCircle size={56} />
          </div>
          <h2>Rendez-vous confirmé !</h2>
          <p>Vous recevrez une confirmation par email et SMS.</p>
          <div className="prv-success-recap">
            <div className="prv-sr-row"><span>Médecin</span><strong>{selectedDoctor?.name}</strong></div>
            <div className="prv-sr-row"><span>Acte</span><strong>{selectedServices.map(s => s.nom).join(', ') || 'Consultation'}</strong></div>
            <div className="prv-sr-row"><span>Date</span><strong>{new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></div>
            <div className="prv-sr-row"><span>Heure</span><strong>{(selectedTime?.heure_debut || selectedTime?.time)?.substring(0, 5)}</strong></div>
          </div>
        </div>
      </main>
    </div>
  );

  /* ── Block Screen ─────────────────────────────── */
  if (!checkingBlock && isBlocked) return (
    <div className="prv-layout">
      <Sidebar links={sidebarLinks} />
      <main className="prv-main">
        <div className="prv-success" style={{ background: '#FEF2F2', borderColor: '#FCA5A5' }}>
          <div className="prv-success-circle" style={{ background: '#FEE2E2', color: '#EF4444' }}>
            <AlertTriangle size={56} />
          </div>
          <h2 style={{ color: '#991B1B' }}>Accès restreint</h2>
          <p style={{ color: '#7F1D1D', maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
            Vous avez une ou plusieurs consultations impayées datant de <strong>plus de 3 jours</strong>. 
            Veuillez régulariser votre situation pour pouvoir prendre de nouveaux rendez-vous.
          </p>
          <button 
            className="prv-next-btn" 
            style={{ margin: '0 auto', display: 'flex', background: '#EF4444' }}
            onClick={() => navigate('/patient/paiement')}
          >
            Régler mes impayés <ArrowRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );

  if (checkingBlock) return (
    <div className="prv-layout">
      <Sidebar links={sidebarLinks} />
      <main className="prv-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="auth-spinner" style={{ width: '40px', height: '40px', borderTopColor: '#6366f1' }}></div>
      </main>
    </div>
  );

  return (
    <div className="prv-layout">
      <Sidebar links={sidebarLinks} />

      <main className="prv-main">

        {/* ── Header ──────────────────────────────── */}
        <div className="prv-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div>
            <span className="prv-tag">Nouveau rendez-vous</span>
            <h1 className="prv-title">Prendre un rendez-vous</h1>
            <p className="prv-subtitle">Réservez votre consultation en quelques clics</p>
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

            <Link to="/patient/profil" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 9px', border: '1px solid #e2e8f0', borderRadius: '50px', textDecoration: 'none', cursor: 'pointer', background: '#ffffff', transition: 'all 0.2s' }}>
              <User size={18} color="#334155" />
              <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#0369a1' }}>
                {user?.prenom} {user?.nom}
              </span>
            </Link>
          </div>
        </div>

        {/* ── Stepper ─────────────────────────────── */}
        <div className="prv-stepper">
          {stepsConfig.map((s, i) => (
            <div key={s.n} className="prv-stepper-item">
              <div className={`prv-step-circle ${step > s.n ? 'done' : ''} ${step === s.n ? 'active' : ''}`}>
                {step > s.n ? <CheckCircle size={20} /> : s.n}
              </div>
              <div className="prv-step-text">
                <span className={`prv-step-label ${step === s.n ? 'active' : ''}`}>
                  Étape {s.n}
                </span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: step === s.n ? '#0f172a' : '#64748b' }}>
                  {s.label}
                </span>
              </div>
              {i < stepsConfig.length - 1 && (
                <div className={`prv-step-line ${step > s.n ? 'done' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            STEP 1 — Spécialité
           ══════════════════════════════════════════ */}
        {step === 1 && (
          <div className="prv-content prv-animate" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div className="prv-content-header" style={{ justifyContent: 'center', border: 'none' }}>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem' }}>Trouvez votre praticien</h2>
                <p>Recherchez par nom, spécialité ou établissement pour commencer</p>
              </div>
            </div>

            {/* Large Dual Search */}
            <div className="prv-large-search">
              <div className="prv-search-inner-dual">
                <div className="prv-search-group main">
                  <Search size={24} className="prv-search-icon-large" />
                  <input
                    className="prv-search-input-large"
                    type="text"
                    placeholder="Nom, spécialité, établissement..."
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      fetchSuggestions('query', e.target.value);
                    }}
                    onFocus={() => setActiveInput('query')}
                  />
                  {activeInput === 'query' && querySuggestions.length > 0 && (
                    <div className="prv-suggestion-dropdown">
                      {querySuggestions.map((s, i) => (
                        <div
                          key={i}
                          className="prv-suggestion-item"
                          onClick={() => {
                            setSearchTerm(s.text);
                            setQuerySuggestions([]);
                            setActiveInput(null);
                          }}
                        >
                          {s.type === 'specialty' ? <Stethoscope size={16} /> : <User size={16} />}
                          <span>{s.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="prv-search-divider-v"></div>

                <div className="prv-search-group loc">
                  <MapPin size={24} className="prv-search-icon-large" />
                  <input
                    className="prv-search-input-large"
                    type="text"
                    placeholder="Où ?"
                    value={locationValue}
                    onChange={e => {
                      setLocationValue(e.target.value);
                      fetchSuggestions('location', e.target.value);
                    }}
                    onFocus={() => setActiveInput('location')}
                  />
                  {activeInput === 'location' && (
                    <div className="prv-suggestion-dropdown">
                      <div className="prv-suggestion-item auto-loc" onClick={() => {
                        setLocationValue('Autour de moi');
                        setLocationSuggestions([]);
                        setActiveInput(null);
                      }}>
                        <Navigation size={16} />
                        <strong>Autour de moi</strong>
                      </div>
                      {locationSuggestions.map((s, i) => (
                        <div
                          key={i}
                          className="prv-suggestion-item"
                          onClick={() => {
                            setLocationValue(s.text);
                            setLocationSuggestions([]);
                            setActiveInput(null);
                          }}
                        >
                          <MapPin size={16} />
                          <span>{s.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button className="prv-search-btn-purple" onClick={() => goTo(2)}>
                  Rechercher <ChevronRight size={20} />
                </button>
              </div>

              {/* Advanced Filters Bar */}
              <div className="prv-filters-bar" style={{ flexWrap: 'wrap' }}>
                <div className="prv-filter-item">
                  <label><Briefcase size={14} /> Acte / Service</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Détartrage" 
                    value={filterService} 
                    onChange={e => setFilterService(e.target.value)} 
                  />
                </div>
                <div className="prv-filter-item">
                  <label><CreditCard size={14} /> Prix Max (€)</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 50 €" 
                    value={filterMaxPrice} 
                    onChange={e => setFilterMaxPrice(e.target.value)} 
                  />
                </div>
                <div className="prv-filter-item">
                  <label><Calendar size={14} /> Date souhaitée</label>
                  <input 
                    type="date" 
                    value={filterDate} 
                    onChange={e => setFilterDate(e.target.value)} 
                  />
                </div>

                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                  <button className="prv-filter-reset" onClick={() => {
                    setFilterService('');
                    setFilterMaxPrice('');
                    setFilterDate('');
                  }}>
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>




            <div className="prv-quick-tips">
              <p>Suggestions :
                <span onClick={() => { setSearchTerm('Dentiste'); goTo(2); }}>Dentiste</span>,
                <span onClick={() => { setSearchTerm('Ophtalmologue'); goTo(2); }}>Ophtalmologue</span>,
                <span onClick={() => { setSearchTerm('Généraliste'); goTo(2); }}>Généraliste</span>
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP 2 — Praticien
           ══════════════════════════════════════════ */}
        {step === 2 && (
          <div className="prv-content prv-animate">
            <div className="prv-content-header">
              <div>
                <h2>Choisissez un praticien</h2>
                <p>{filteredDoctors.length} praticien(s) trouvé(s) {searchTerm ? `pour "${searchTerm}"` : ''}</p>
              </div>
              <button className="prv-back-btn" onClick={() => goTo(1)}>
                <ChevronLeft size={18} /> Retour
              </button>
            </div>

            <div className="prv-doctors-list">
              {filteredDoctors.length === 0 ? (
                <div className="prv-empty" style={{ gridColumn: '1 / -1' }}>
                  <User size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                  <p>Aucun praticien trouvé pour cette spécialité.</p>
                </div>
              ) : (
                filteredDoctors.map(doc => (
                  <div key={doc.id} className="sr-card" style={{ marginBottom: '1rem' }}>
                    <div className="sr-card-info">
                      <div className="sr-pro-header">
                        <div className="sr-pro-avatar">
                          {doc.photo ? (
                            <img
                              src={getPhotoUrl(doc.photo)}
                              alt={doc.name}
                              className="pro-photo-img"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="sr-avatar-placeholder" style={{
                            display: doc.photo ? 'none' : 'flex',
                            background: `linear-gradient(135deg, ${doc.color || '#0284c7'}, #3b82f6)`
                          }}>
                            {doc.initials}
                          </div>
                        </div>
                        <div className="sr-pro-identity">
                          <h3 onClick={() => setSelectedPro(doc)} style={{ cursor: 'pointer' }}>{doc.name}</h3>
                          <span className="sr-specialty">{doc.specialty}</span>
                        </div>
                      </div>

                      <div className="sr-pro-details">
                        <div className="sr-detail-row">
                          <MapPin size={16} />
                          <div>
                            <div>{doc.cabinet_name || doc.location}</div>
                            <div>{doc.cabinet_address} {doc.cabinet_city}</div>
                          </div>
                        </div>

                        {/* Services Section */}
                        {doc.services && doc.services.length > 0 && (
                          <div className="sr-pro-services">
                            <div className="services-title">Actes et tarifs :</div>
                            <div className="services-list">
                              {(expandedServices[doc.id] ? doc.services : doc.services.slice(0, 3)).map((service, sIndex) => (
                                <div key={sIndex} className="service-item">
                                  <span className="service-name">{service.nom}</span>
                                  <span className="service-price">{Number(service.prix).toFixed(2)}€</span>
                                </div>
                              ))}
                              {doc.services.length > 3 && (
                                <button
                                  className="service-more-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedServices(prev => ({
                                      ...prev,
                                      [doc.id]: !prev[doc.id]
                                    }));
                                  }}
                                >
                                  {expandedServices[doc.id] ? 'Voir moins' : `+${doc.services.length - 3} autres services`}
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="sr-detail-row" style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#16a34a' }}>
                          <CheckCircle size={16} />
                          <span>{(doc.price && !isNaN(doc.price)) ? `${Number(doc.price).toFixed(2)}€` : (doc.price || 'Conventionné Secteur 1')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="sr-card-slots">
                      <button className="sr-nav-btn sr-nav-left">
                        <ChevronLeft size={20} />
                      </button>

                      <div className="sr-slots-grid">
                        {nextDays.map((date, idx) => {
                          const dateStr = date.toISOString().split('T')[0];
                          const daySlots = (doc.prochaines_dispos && doc.prochaines_dispos[dateStr]) || [];
                          const displaySlots = daySlots.slice(0, 4);

                          return (
                            <div key={idx} className="sr-day-column">
                              <div className="sr-day-header">
                                <strong>{date.toLocaleDateString('fr-FR', { weekday: 'short' })}</strong>
                                <span>{date.getDate()} {date.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                              </div>
                              <div className="sr-day-slots">
                                {displaySlots.length > 0 ? (
                                  displaySlots.map((slot, sIdx) => {
                                    const isPast = isPastSlot(dateStr, slot.time);
                                    const isReserved = slot.statut === 'reserve' || slot.statut === 'en_attente';
                                    return (
                                      <button
                                        key={sIdx}
                                        className={`sr-time-btn ${isPast || isReserved ? 'is-past' : ''}`}
                                        disabled={isPast || isReserved}
                                        onClick={() => handleBookDirect(doc, slot)}
                                      >
                                        {slot.time}
                                      </button>
                                    );
                                  })
                                ) : (
                                  <span className="sr-no-slots">-</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button className="sr-nav-btn sr-nav-right">
                        <ChevronRight size={20} />
                      </button>

                      <div className="sr-more-slots">
                        <button onClick={() => {
                          setExpandedDoctorId(doc.id);
                          fetchDoctorSlots(doc.id);
                        }}>
                          Voir plus d'horaires
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP 3 — Sélection du Service (Acte)
           ══════════════════════════════════════════ */}
        {step === 3 && selectedDoctor && (
          <div className="prv-content prv-animate">
            <div className="prv-content-header">
              <div>
                <h2>Quel est le motif de votre visite ?</h2>
                <p>Sélectionnez un ou plusieurs actes pour lesquels vous souhaitez consulter <strong>{selectedDoctor.name}</strong></p>
              </div>
              <button className="prv-back-btn" onClick={() => goTo(2)}>
                <ChevronLeft size={18} /> Retour
              </button>
            </div>

            <div className="prv-services-selection">
              {selectedDoctor.services && selectedDoctor.services.length > 0 ? (
                <div className="prv-services-grid">
                  {selectedDoctor.services.map((service, idx) => {
                    const isSelected = selectedServices.some(s => s.nom === service.nom);
                    return (
                      <button
                        key={idx}
                        className={`prv-service-card ${isSelected ? 'active' : ''}`}
                        onClick={() => toggleService(service)}
                      >
                        <div className="prv-service-info">
                          <span className="prv-service-name">{service.nom}</span>
                          <span className="prv-service-desc">Consultation standard</span>
                        </div>
                        <div className="prv-service-price-tag">
                          {Number(service.prix).toFixed(2)}€
                        </div>
                        <div className="prv-service-check">
                          {isSelected && <CheckCircle size={20} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="prv-empty">
                  <FileText size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                  <p>Aucun service répertorié pour ce praticien.</p>
                  <button className="prv-confirm-btn" style={{ marginTop: '1.5rem' }} onClick={() => {
                    toggleService({ id: null, nom: 'Consultation standard', prix: selectedDoctor.price || 0 });
                  }}>
                    Utiliser une consultation standard
                  </button>
                </div>
              )}
            </div>

            {selectedServices.length > 0 && (
              <button
                className="prv-next-btn prv-animate"
                onClick={() => goTo(4)}
              >
                Confirmer les détails <ArrowRight size={18} />
              </button>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            STEP 4 — Confirmation
           ══════════════════════════════════════════ */}
        {step === 4 && (
          <div className="prv-content prv-animate">
            <div className="prv-content-header">
              <div>
                <h2>Confirmer le rendez-vous</h2>
                <p>Vérifiez les détails avant de confirmer</p>
              </div>
              <button className="prv-back-btn" onClick={() => goTo(3)}>
                <ChevronLeft size={18} /> Retour
              </button>
            </div>

            <div className="prv-recap-container">
              <div className="prv-recap-main">
                <div className="prv-recap-box">
                  <h3><FileText size={18} /> Détails de la consultation</h3>
                  <div className="prv-recap-list">
                    <div className="prv-rl-item">
                      <span className="prv-rl-label"><Calendar size={16} /> Date</span>
                      <span className="prv-rl-value">
                        {new Date(selectedDate).toLocaleDateString('fr-FR', {
                          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="prv-rl-item">
                      <span className="prv-rl-label"><Clock size={16} /> Heure</span>
                      <span className="prv-rl-value">{(selectedTime?.heure_debut || selectedTime?.time)?.substring(0, 5)}</span>
                    </div>
                    <div className="prv-rl-item">
                      <span className="prv-rl-label"><Activity size={16} /> Acte / Motif</span>
                      <span className="prv-rl-value">{selectedServices.map(s => s.nom).join(', ') || 'Consultation'}</span>
                    </div>
                  </div>
                </div>

                <div className="prv-recap-box">
                  <div className="prv-note-container">
                    <label>Motif de consultation (optionnel)</label>
                    <textarea
                      className="prv-note-input"
                      placeholder="Précisez la raison de votre visite ou ajoutez des informations pour le praticien..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="prv-recap-box" style={{ marginBottom: '1.5rem' }}>
                  <h3><User size={18} /> Praticien</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <div className="prv-doc-avatar" style={{ width: '48px', height: '48px', fontSize: '1rem', background: `linear-gradient(135deg, ${selectedDoctor.color}, ${selectedDoctor.color}99)` }}>
                      {selectedDoctor.initials}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{selectedDoctor.name}</h4>
                      <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{selectedDoctor.specialty}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>Tarif estimé</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7', whiteSpace: 'nowrap' }}>
                      {(selectedServices.length > 0
                        ? selectedServices.reduce((sum, s) => sum + (parseFloat(s.prix) || 0), 0)
                        : (selectedDoctor.price || 0)).toFixed(2)}€
                    </span>
                  </div>
                </div>

                <button className="prv-confirm-btn" onClick={handleConfirm}>
                  <CheckCircle size={20} />
                  Confirmer le rendez-vous
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Availability Modal ──────────────────────── */}
      {expandedDoctorId && (
        <div className="prv-modal-overlay prv-animate" onClick={() => setExpandedDoctorId(null)}>
          <div className="prv-modal-container" onClick={e => e.stopPropagation()}>
            <div className="prv-modal-header">
              <h2>Disponibilités de {doctorsList.find(d => d.id === expandedDoctorId)?.name}</h2>
              <button className="prv-modal-close" onClick={() => setExpandedDoctorId(null)}>
                <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            <div className="prv-modal-content">
              {loadingSlots ? (
                <div className="prv-modal-loading">Chargement des disponibilités...</div>
              ) : (
                <div className="prv-modal-grid">
                  {nextDays.map((date, idx) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const { morning, afternoon } = getSlotsForDate(dateStr);
                    const allDaySlots = [...morning, ...afternoon];

                    return (
                      <div key={idx} className="prv-modal-col">
                        <div className="prv-modal-col-header">
                          <strong style={{ textTransform: 'capitalize' }}>
                            {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </strong>
                        </div>
                        <div className="prv-modal-slots-list">
                          {allDaySlots.length > 0 ? (
                            allDaySlots.map((slot, sIdx) => {
                              const sTime = slot.heure_debut.substring(0, 5);
                              const isPast = isPastSlot(dateStr, sTime);
                              const isReserved = slot.statut === 'reserve' || slot.statut === 'en_attente';
                              return (
                                <button
                                  key={sIdx}
                                  className={`prv-modal-time-btn ${isPast || isReserved ? 'is-past' : ''}`}
                                  disabled={isPast || isReserved}
                                  onClick={() => {
                                    handleBookDirect(doctorsList.find(d => d.id === expandedDoctorId), { ...slot, date: dateStr, time: sTime });
                                    setExpandedDoctorId(null);
                                  }}
                                >
                                  {sTime}
                                </button>
                              );
                            })
                          ) : (
                            <div className="prv-modal-no-slots">—</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails Professionnel */}
      {selectedPro && (
        <div className="sr-modal-overlay" onClick={() => setSelectedPro(null)}>
          <div className="sr-modal-content pro-details-modal" onClick={e => e.stopPropagation()}>
            <button className="sr-modal-close" onClick={() => setSelectedPro(null)}>&times;</button>
            <div className="modal-body">
              <div className="modal-pro-header">
                <div className="modal-pro-avatar">
                  {selectedPro.photo ? (
                    <img src={getPhotoUrl(selectedPro.photo)} alt={selectedPro.name} />
                  ) : (
                    <div className="avatar-placeholder" style={{ background: `linear-gradient(135deg, ${selectedPro.color || '#0284c7'}, #3b82f6)` }}>
                      {selectedPro.initials}
                    </div>
                  )}
                </div>
                <div className="modal-pro-info">
                  <h2>{selectedPro.name}</h2>
                  <p className="modal-specialty">{selectedPro.specialty}</p>
                </div>
              </div>

              <div className="modal-section">
                <h3><MapPin size={18} /> Coordonnées</h3>
                <p><strong>{selectedPro.cabinet_name}</strong></p>
                <p>{selectedPro.cabinet_address}</p>
                <p>{selectedPro.cabinet_city}</p>
                {selectedPro.cabinet_tel && (
                  <p style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={14} /> {selectedPro.cabinet_tel}
                  </p>
                )}
                {selectedPro.cabinet_email && (
                  <p style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={14} /> {selectedPro.cabinet_email}
                  </p>
                )}
              </div>

              <div className="modal-section">
                <h3><FileText size={18} /> À propos</h3>
                <p>{selectedPro.bio || "Ce professionnel n'a pas encore renseigné de description."}</p>
              </div>

              <div className="modal-section">
                <h3><CreditCard size={18} /> Tarifs et remboursements</h3>
                <div className="modal-services-list">
                  {selectedPro.services?.map((s, idx) => (
                    <div key={idx} className="modal-service-item">
                      <span>{s.nom}</span>
                      <span>{s.prix} €</span>
                    </div>
                  ))}
                </div>
                <p className="modal-convention" style={{ marginTop: '1rem', color: '#16a34a', fontWeight: 600 }}>
                  {(selectedPro.price && !isNaN(selectedPro.price)) ? `${selectedPro.price}\u00A0€` : (selectedPro.price || 'Conventionné Secteur 1')}
                </p>
              </div>

              <button className="modal-book-btn" onClick={() => {
                setSelectedDoctor(selectedPro);
                fetchDoctorSlots(selectedPro.id);
                setStep(3);
                setSelectedPro(null);
              }}>
                Prendre rendez-vous
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrendreRendezVous;
