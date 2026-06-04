// ============================================================
//  REGISTER.JSX
// ============================================================
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  User, Mail, Lock, Phone, UserPlus,
  Heart, Eye, EyeOff, CheckCircle,
  ArrowRight, ChevronLeft, Stethoscope,
  ClipboardList, Check, MapPin, Building2,
  Calendar, Globe, KeyRound, AlertCircle, Search,
  Upload, FileText, X as XIcon
} from 'lucide-react';
import './Auth.css';

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    role: '', nom: '', prenom: '',
    email: '', date_naissance: '',
    password: '', confirmPassword: '',
    // Professional cabinet fields
    cabinet_nom: '', cabinet_adresse: '',
    cabinet_ville: '', cabinet_telephone: '',
    cabinet_email: '', cabinet_pays: 'France',
    specialite_id: '',
    // Secretary field
    code_professionnel: '',
  });
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showCpwd, setShowCpwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, errors: serverErrors } = useAuth();
  const navigate = useNavigate();

  const [specialites, setSpecialites] = useState([]);
  const [codeStatus, setCodeStatus] = useState(null); // null | { valid, message, professionnel_name }
  const [checkingCode, setCheckingCode] = useState(false);
  const [isPendingValidation, setIsPendingValidation] = useState(false);
  const [diplomeFile, setDiplomeFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const specRes = await api.get('/specialites');
        setSpecialites(specRes.data);
      } catch (err) {
        console.error("Erreur lors du chargement des spécialités", err);
      }
    };
    fetchData();
  }, []);

  // Debounced code verification
  useEffect(() => {
    if (formData.role !== 'secretaire' || !formData.code_professionnel || formData.code_professionnel.length < 5) {
      setCodeStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingCode(true);
      try {
        await api.get('/../sanctum/csrf-cookie');
        const res = await api.post('/verify-professional-code', {
          code_professionnel: formData.code_professionnel,
        });
        setCodeStatus(res.data);
      } catch (err) {
        setCodeStatus({ valid: false, message: 'Erreur lors de la vérification.' });
      } finally {
        setCheckingCode(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.code_professionnel, formData.role]);

  const roles = [
    {
      value: 'patient',
      label: 'Patient',
      icon: <User size={32} />,
      description: 'Prenez rendez-vous et consultez votre dossier médical',
      color: '#8B5CF6',
      bg: '#F5F3FF',
    },
    {
      value: 'professionnel',
      label: 'Professionnel de santé',
      icon: <Stethoscope size={32} />,
      description: 'Gérez vos consultations et suivez vos patients',
      color: '#6366F1',
      bg: '#EEF2FF',
    },
    {
      value: 'secretaire',
      label: 'Secrétaire médical(e)',
      icon: <ClipboardList size={32} />,
      description: 'Administrez les rendez-vous et dossiers patients',
      color: '#3B82F6',
      bg: '#EFF6FF',
    },
  ];

  const handleChange = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRoleSelect = role => {
    setFormData(prev => ({ ...prev, role }));
    setStep(2);
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas'); return;
    }

    if (calculateAge(formData.date_naissance) < 18) {
      setError('Vous devez avoir au moins 18 ans pour vous inscrire.');
      return;
    }

    if (formData.role === 'secretaire' && (!codeStatus || !codeStatus.valid)) {
      setError('Veuillez entrer un code professionnel valide.'); return;
    }

    if (formData.role === 'professionnel' && !diplomeFile) {
      setError('Veuillez téléverser votre diplôme.'); return;
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        password_confirmation: formData.confirmPassword,
      };

      // Ajouter le fichier diplôme si présent
      if (diplomeFile) {
        data.diplome = diplomeFile;
      }

      const response = await register(data);
      const role = response.user.role;

      // If professionnel, handle differently
      if (role === 'professionnel') {
        if (response.code_professionnel) {
          sessionStorage.setItem('generated_code', response.code_professionnel);
        }
        setIsPendingValidation(true);
      } else {
        const routes = {
          patient: '/patient/dashboard',
          secretaire: '/secretaire/dashboard',
        };
        navigate(routes[role] || '/');
      }
    } catch (err) {
      if (err.response?.status !== 422) {
        setError("Une erreur est survenue lors de l'inscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = formData.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Faible', 'Moyen', 'Bien', 'Fort', 'Excellent'][strength] || '';
  const strengthColor = ['', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'][strength] || '';

  const selectedRole = roles.find(r => r.value === formData.role);

  return (
    <div className="auth-page">
      {/* ── Left Panel ─────────────────────────── */}
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" className="auth-brand">
            <div className="auth-brand-icon"><Heart size={22} /></div>
            <span>Medico</span>
          </Link>

          <div className="auth-left-hero">
            <h2>Rejoignez<br />notre réseau.</h2>
            <p>
              Créez votre compte en quelques étapes et accédez
              à tous nos services de santé en ligne.
            </p>
          </div>

          {/* Steps Progress */}
          <div className="auth-steps-visual">
            {[
              { n: 1, label: 'Votre profil' },
              { n: 2, label: 'Vos informations' },
            ].map((s, i) => (
              <div key={s.n} className="auth-sv-item">
                <div className={`auth-sv-circle ${step >= s.n ? 'active' : ''} ${step > s.n ? 'done' : ''}`}>
                  {step > s.n ? <Check size={16} /> : s.n}
                </div>
                <div className="auth-sv-info">
                  <strong>Étape {s.n}</strong>
                  <span>{s.label}</span>
                </div>
                {i === 0 && (
                  <div className={`auth-sv-line ${step > 1 ? 'done' : ''}`} />
                )}
              </div>
            ))}
          </div>

          {selectedRole && (
            <div
              className="auth-selected-role"
              style={{ background: selectedRole.bg, borderColor: `${selectedRole.color}30` }}
            >
              <div style={{ color: selectedRole.color }}>{selectedRole.icon}</div>
              <div>
                <strong style={{ color: selectedRole.color }}>{selectedRole.label}</strong>
                <span>{selectedRole.description}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel ────────────────────────── */}
      <div className="auth-right">
        <div className="auth-form-card auth-form-card-wide">

          {/* ── Pending Validation Screen ─────────────────────── */}
          {isPendingValidation && (
            <div className="auth-form-header" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <div style={{ background: '#ECFDF5', color: '#10B981', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={32} />
                </div>
              </div>
              <h1>Inscription réussie !</h1>
              <p style={{ marginTop: '1rem', marginBottom: '1.5rem', fontSize: '1.05rem', color: '#4B5563' }}>
                Votre compte a été créé avec succès. Il est actuellement <strong>en cours de validation</strong> par notre équipe médicale.
              </p>
              <div style={{ background: '#F3F4F6', padding: '1.5rem', borderRadius: '12px', fontSize: '0.95rem', color: '#374151', marginBottom: '2rem', textAlign: 'left' }}>
                <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <Mail size={20} style={{ color: '#6B7280', flexShrink: 0, marginTop: '2px' }} />
                  <span>Vous recevrez un email de confirmation dès que votre compte sera accepté. Vous pourrez alors vous connecter et commencer à utiliser Medico.</span>
                </p>
              </div>
              <Link to="/login" className="auth-submit-btn" style={{ textDecoration: 'none', display: 'inline-flex', justifyContent: 'center' }}>
                Aller à la page de connexion
              </Link>
            </div>
          )}

          {/* ── Step 1: Role ─────────────────────── */}
          {step === 1 && !isPendingValidation && (
            <>
              <div className="auth-form-header">
                <h1>Créer un compte</h1>
                <p>Choisissez votre profil pour commencer</p>
              </div>

              <div className="auth-roles-grid">
                {roles.map((role, i) => (
                  <button
                    key={role.value}
                    className={`auth-role-card ${formData.role === role.value ? 'selected' : ''}`}
                    style={{
                      '--role-color': role.color,
                      '--role-bg': role.bg,
                      '--delay': `${i * 0.08}s`
                    }}
                    onClick={() => handleRoleSelect(role.value)}
                    type="button"
                  >
                    <div
                      className="auth-role-icon"
                      style={{ background: role.bg, color: role.color }}
                    >
                      {role.icon}
                    </div>
                    <div className="auth-role-body">
                      <h3>{role.label}</h3>
                      <p>{role.description}</p>
                    </div>
                    <div className="auth-role-arrow">
                      <ArrowRight size={20} />
                    </div>
                    {formData.role === role.value && (
                      <div className="auth-role-check">
                        <CheckCircle size={20} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <p className="auth-switch">
                Déjà un compte ?{' '}
                <Link to="/login">Se connecter <ArrowRight size={15} /></Link>
              </p>
            </>
          )}

          {/* ── Step 2: Form ─────────────────────── */}
          {step === 2 && !isPendingValidation && (
            <>
              <div className="auth-form-header">
                <button
                  type="button"
                  className="auth-back-btn"
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft size={18} /> Retour
                </button>
                <h1>Vos informations</h1>
                <p>Renseignez vos coordonnées personnelles</p>
              </div>

              {error && (
                <div className="auth-error-box"><span>{error}</span></div>
              )}

              <form onSubmit={handleSubmit} className="auth-form-inner">

                {/* ── Section: Informations personnelles ── */}
                <div className="auth-section-title">
                  <User size={18} />
                  <span>Informations personnelles</span>
                </div>

                {/* Nom / Prénom */}
                <div className="auth-row-2">
                  <div className="auth-field">
                    <label htmlFor="nom">Nom</label>
                    <div className="auth-input-wrap">
                      <User size={17} className="auth-input-ico" />
                      <input
                        id="nom" name="nom" type="text"
                        placeholder="Dupont"
                        value={formData.nom}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    {serverErrors.name && <span className="auth-error-msg">{serverErrors.name[0]}</span>}
                  </div>
                  <div className="auth-field">
                    <label htmlFor="prenom">Prénom</label>
                    <div className="auth-input-wrap">
                      <User size={17} className="auth-input-ico" />
                      <input
                        id="prenom" name="prenom" type="text"
                        placeholder="Jean"
                        value={formData.prenom}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="auth-field">
                  <label htmlFor="email">Adresse email</label>
                  <div className="auth-input-wrap">
                    <Mail size={17} className="auth-input-ico" />
                    <input
                      id="email" name="email" type="email"
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {serverErrors.email && <span className="auth-error-msg">{serverErrors.email[0]}</span>}
                </div>

                {/* Date de naissance */}
                <div className="auth-field">
                  <label htmlFor="date_naissance">Date de naissance</label>
                  <div className="auth-input-wrap">
                    <Calendar size={17} className="auth-input-ico" />
                    <input
                      id="date_naissance" name="date_naissance" type="date"
                      value={formData.date_naissance}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {serverErrors.date_naissance && <span className="auth-error-msg">{serverErrors.date_naissance[0]}</span>}
                </div>

                {/* Password */}
                <div className="auth-field">
                  <label htmlFor="password">Mot de passe</label>
                  <div className="auth-input-wrap">
                    <Lock size={17} className="auth-input-ico" />
                    <input
                      id="password" name="password"
                      type={showPwd ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowPwd(v => !v)}
                      tabIndex={-1}
                    >
                      {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {serverErrors.password && <span className="auth-error-msg">{serverErrors.password[0]}</span>}
                  {formData.password && (
                    <div className="auth-strength">
                      <div className="auth-strength-bar">
                        {[1, 2, 3, 4, 5].map(n => (
                          <div
                            key={n}
                            className="auth-strength-seg"
                            style={{ background: strength >= n ? strengthColor : '#E5E7EB' }}
                          />
                        ))}
                      </div>
                      <span style={{ color: strengthColor }}>{strengthLabel}</span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="auth-field">
                  <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                  <div className="auth-input-wrap">
                    <Lock size={17} className="auth-input-ico" />
                    <input
                      id="confirmPassword" name="confirmPassword"
                      type={showCpwd ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowCpwd(v => !v)}
                      tabIndex={-1}
                    >
                      {showCpwd ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <div className={`auth-match ${formData.password === formData.confirmPassword ? 'ok' : 'no'}`}>
                      {formData.password === formData.confirmPassword
                        ? <><CheckCircle size={14} /> Les mots de passe correspondent</>
                        : '✗ Les mots de passe ne correspondent pas'
                      }
                    </div>
                  )}
                </div>

                {/* ── Section: Cabinet médical (professionnel only) ── */}
                {formData.role === 'professionnel' && (
                  <>
                    {/* Spécialité — shown first to determine if cabinet is needed */}
                    <div className="auth-section-title" style={{ marginTop: '1.5rem' }}>
                      <Stethoscope size={18} />
                      <span>Spécialité</span>
                    </div>
                    <div className="auth-field">
                      <label htmlFor="specialite_id">Spécialité</label>
                      <div className="auth-searchable-select" style={{ position: 'relative' }}>
                        <div className="auth-input-wrap">
                          <Search size={17} className="auth-input-ico" />
                          <input
                            type="text"
                            placeholder="Rechercher une spécialité..."
                            value={specialtySearch}
                            onChange={(e) => {
                              setSpecialtySearch(e.target.value);
                              setShowSpecialtyDropdown(true);
                              // Reset selection if typing manually unless it matches exactly
                              const match = specialites.find(s => s.nom.toLowerCase() === e.target.value.toLowerCase());
                              if (match) {
                                setFormData(prev => ({ ...prev, specialite_id: match.id }));
                              } else {
                                setFormData(prev => ({ ...prev, specialite_id: '' }));
                              }
                            }}
                            onFocus={() => setShowSpecialtyDropdown(true)}
                            onBlur={() => {
                              // Delay hiding to allow click on dropdown
                              setTimeout(() => setShowSpecialtyDropdown(false), 200);
                            }}
                          />
                        </div>
                        {showSpecialtyDropdown && (
                          <div className="auth-dropdown-list">
                            {specialites
                              .filter(s => s.nom.toLowerCase().includes(specialtySearch.toLowerCase()))
                              .map(s => (
                                <div
                                  key={s.id}
                                  className="auth-dropdown-item"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, specialite_id: s.id }));
                                    setSpecialtySearch(s.nom);
                                    setShowSpecialtyDropdown(false);
                                  }}
                                >
                                  {s.nom}
                                </div>
                              ))}
                            {specialites.filter(s => s.nom.toLowerCase().includes(specialtySearch.toLowerCase())).length === 0 && (
                              <div className="auth-dropdown-item empty">Aucune spécialité trouvée</div>
                            )}
                          </div>
                        )}
                      </div>
                      {serverErrors.specialite_id && <span className="auth-error-msg">{serverErrors.specialite_id[0]}</span>}
                    </div>

                    {/* Cabinet section — fields optional for Infirmier */}
                    {(() => {
                      const selectedSpec = specialites.find(s => String(s.id) === String(formData.specialite_id));
                      const isInfirmier = selectedSpec && selectedSpec.nom.toLowerCase() === 'infirmier';
                      const cabinetRequired = !isInfirmier;
                      return (
                        <>
                          <div className="auth-section-title" style={{ marginTop: '1.5rem' }}>
                            <Building2 size={18} />
                            <span>Informations du cabinet médical</span>
                          </div>

                          {isInfirmier && (
                            <div style={{ padding: '0.6rem 1rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <AlertCircle size={16} />
                              <span>Ces champs sont <strong>optionnels</strong> pour les infirmiers.</span>
                            </div>
                          )}

                          {/* Nom du cabinet */}
                          <div className="auth-field">
                            <label htmlFor="cabinet_nom">Nom du cabinet {isInfirmier && <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optionnel)</span>}</label>
                            <div className="auth-input-wrap">
                              <Building2 size={17} className="auth-input-ico" />
                              <input
                                id="cabinet_nom" name="cabinet_nom" type="text"
                                placeholder="Cabinet Médical du Centre"
                                value={formData.cabinet_nom}
                                onChange={handleChange}
                                required={cabinetRequired}
                              />
                            </div>
                            {serverErrors.cabinet_nom && <span className="auth-error-msg">{serverErrors.cabinet_nom[0]}</span>}
                          </div>

                          {/* Adresse / Ville */}
                          <div className="auth-row-2">
                            <div className="auth-field">
                              <label htmlFor="cabinet_adresse">Adresse {isInfirmier && <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optionnel)</span>}</label>
                              <div className="auth-input-wrap">
                                <MapPin size={17} className="auth-input-ico" />
                                <input
                                  id="cabinet_adresse" name="cabinet_adresse" type="text"
                                  placeholder="12 rue de la Santé"
                                  value={formData.cabinet_adresse}
                                  onChange={handleChange}
                                  required={cabinetRequired}
                                />
                              </div>
                              {serverErrors.cabinet_adresse && <span className="auth-error-msg">{serverErrors.cabinet_adresse[0]}</span>}
                            </div>
                            <div className="auth-field">
                              <label htmlFor="cabinet_ville">Ville {isInfirmier && <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optionnel)</span>}</label>
                              <div className="auth-input-wrap">
                                <MapPin size={17} className="auth-input-ico" />
                                <input
                                  id="cabinet_ville" name="cabinet_ville" type="text"
                                  placeholder="Paris"
                                  value={formData.cabinet_ville}
                                  onChange={handleChange}
                                  required={cabinetRequired}
                                />
                              </div>
                              {serverErrors.cabinet_ville && <span className="auth-error-msg">{serverErrors.cabinet_ville[0]}</span>}
                            </div>
                          </div>

                          {/* Téléphone / Email du cabinet */}
                          <div className="auth-row-2">
                            <div className="auth-field">
                              <label htmlFor="cabinet_telephone">Téléphone {isInfirmier && <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optionnel)</span>}</label>
                              <div className="auth-input-wrap">
                                <Phone size={17} className="auth-input-ico" />
                                <input
                                  id="cabinet_telephone" name="cabinet_telephone" type="tel"
                                  placeholder="+33 1 23 45 67 89"
                                  value={formData.cabinet_telephone}
                                  onChange={handleChange}
                                  required={cabinetRequired}
                                />
                              </div>
                              {serverErrors.cabinet_telephone && <span className="auth-error-msg">{serverErrors.cabinet_telephone[0]}</span>}
                            </div>
                            <div className="auth-field">
                              <label htmlFor="cabinet_email">Email du cabinet {isInfirmier && <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optionnel)</span>}</label>
                              <div className="auth-input-wrap">
                                <Mail size={17} className="auth-input-ico" />
                                <input
                                  id="cabinet_email" name="cabinet_email" type="email"
                                  placeholder="contact@cabinet.fr"
                                  value={formData.cabinet_email}
                                  onChange={handleChange}
                                  required={cabinetRequired}
                                />
                              </div>
                              {serverErrors.cabinet_email && <span className="auth-error-msg">{serverErrors.cabinet_email[0]}</span>}
                            </div>
                          </div>

                          {/* Pays (auto France, disabled) */}
                          <div className="auth-field">
                            <label htmlFor="cabinet_pays">Pays</label>
                            <div className="auth-input-wrap">
                              <Globe size={17} className="auth-input-ico" />
                              <input
                                id="cabinet_pays" name="cabinet_pays" type="text"
                                value="France"
                                disabled
                                style={{ cursor: 'not-allowed', opacity: 0.7 }}
                              />
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {/* Document justificatif (diplôme) */}
                    <div className="auth-section-title" style={{ marginTop: '1.5rem' }}>
                      <Upload size={18} />
                      <span>Document justificatif</span>
                    </div>

                    <div className="auth-field">
                      <label>Diplôme de médecine ou certificat équivalent <span style={{ color: '#EF4444' }}>*</span></label>
                      
                      {!diplomeFile ? (
                        <div
                          className={`auth-dropzone ${dragOver ? 'drag-over' : ''}`}
                          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={e => {
                            e.preventDefault();
                            setDragOver(false);
                            const file = e.dataTransfer.files[0];
                            if (file) {
                              const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
                              if (!validTypes.includes(file.type)) {
                                setError('Format non accepté. Utilisez PDF, JPG ou PNG.');
                                return;
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                setError('Le fichier ne doit pas dépasser 5 Mo.');
                                return;
                              }
                              setDiplomeFile(file);
                              setError('');
                            }
                          }}
                          onClick={() => document.getElementById('diplome-input').click()}
                        >
                          <input
                            id="diplome-input"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            style={{ display: 'none' }}
                            onChange={e => {
                              const file = e.target.files[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  setError('Le fichier ne doit pas dépasser 5 Mo.');
                                  return;
                                }
                                setDiplomeFile(file);
                                setError('');
                              }
                            }}
                          />
                          <div className="auth-dropzone-icon">
                            <Upload size={28} />
                          </div>
                          <p className="auth-dropzone-text">
                            <strong>Glissez-déposez</strong> votre fichier ici ou <strong>cliquez pour parcourir</strong>
                          </p>
                          <span className="auth-dropzone-hint">Formats acceptés : PDF, JPG, PNG — 5 Mo maximum</span>
                        </div>
                      ) : (
                        <div className="auth-file-preview">
                          <div className="auth-file-info">
                            <div className="auth-file-icon">
                              <FileText size={22} />
                            </div>
                            <div>
                              <p className="auth-file-name">{diplomeFile.name}</p>
                              <span className="auth-file-size">{(diplomeFile.size / 1024 / 1024).toFixed(2)} Mo</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="auth-file-remove"
                            onClick={() => setDiplomeFile(null)}
                          >
                            <XIcon size={18} />
                          </button>
                        </div>
                      )}
                      {serverErrors.diplome && <span className="auth-error-msg">{serverErrors.diplome[0]}</span>}
                    </div>
                  </>
                )}

                {/* ── Section: Association au professionnel (secrétaire only) ── */}
                {formData.role === 'secretaire' && (
                  <>
                    <div className="auth-section-title" style={{ marginTop: '1.5rem' }}>
                      <KeyRound size={18} />
                      <span>Association au professionnel</span>
                    </div>

                    <div className="auth-field">
                      <label htmlFor="code_professionnel">Code du professionnel de santé</label>
                      <div className="auth-input-wrap">
                        <KeyRound size={17} className="auth-input-ico" />
                        <input
                          id="code_professionnel" name="code_professionnel" type="text"
                          placeholder="MED-243Y"
                          value={formData.code_professionnel}
                          onChange={handleChange}
                          required
                          style={{ textTransform: 'uppercase' }}
                        />
                        {checkingCode && <span className="auth-spinner" style={{ width: 18, height: 18 }} />}
                      </div>
                      {serverErrors.code_professionnel && <span className="auth-error-msg">{serverErrors.code_professionnel[0]}</span>}
                      {codeStatus && !checkingCode && (
                        <div className={`auth-match ${codeStatus.valid ? 'ok' : 'no'}`}>
                          {codeStatus.valid
                            ? <><CheckCircle size={14} /> {codeStatus.message}</>
                            : <><AlertCircle size={14} /> {codeStatus.message}</>
                          }
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Terms */}
                <p className="auth-terms">
                  En vous inscrivant, vous acceptez nos{' '}
                  <a href="#">Conditions d'utilisation</a>{' '}
                  et notre{' '}
                  <a href="#">Politique de confidentialité</a>.
                </p>

                {/* Submit */}
                <button
                  type="submit"
                  className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                  disabled={loading || (formData.role === 'secretaire' && (!codeStatus || !codeStatus.valid))}
                >
                  {loading
                    ? <span className="auth-spinner" />
                    : <><UserPlus size={20} /> Créer mon compte</>
                  }
                </button>

              </form>

              <p className="auth-switch">
                Déjà un compte ?{' '}
                <Link to="/login">Se connecter <ArrowRight size={15} /></Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Register;