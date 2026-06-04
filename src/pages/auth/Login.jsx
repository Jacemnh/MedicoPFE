// ============================================================
//  LOGIN.JSX
// ============================================================
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Mail, Lock, LogIn, Eye, EyeOff,
  Heart, ArrowRight, CheckCircle, ShieldAlert, X
} from 'lucide-react';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [blockedAlert, setBlockedAlert] = useState('');
  const { login, errors: serverErrors } = useAuth();
  const navigate = useNavigate();

  const handleChange = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const response = await login({ ...formData, remember });
      const role = response.user.role;

      const routes = {
        patient: '/patient/dashboard',
        professionnel: '/professionnel/dashboard',
        secretaire: '/secretaire/dashboard',
        admin: '/admin/dashboard'
      };

      navigate(routes[role] || '/');
    } catch (err) {
      if (err.response?.status === 422) {
        const emailErr = err.response.data.errors?.email?.[0];
        if (emailErr) {
          setBlockedAlert(emailErr);
        }
      } else {
        setBlockedAlert('Une erreur est survenue lors de la connexion. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Accès à votre dossier médical',
    'Prise de rendez-vous en ligne',
    'Téléconsultation disponible',
    'Suivi de vos paiements',
  ];

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
            <h2>Votre santé,<br />notre priorité.</h2>
            <p>
              Rejoignez des milliers de patients qui font confiance
              à notre plateforme pour gérer leur santé en toute simplicité.
            </p>
          </div>

          <ul className="auth-features">
            {features.map((f, i) => (
              <li key={i} className="auth-feature-item">
                <CheckCircle size={18} />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="auth-left-avatars">
            <div className="auth-av-stack">
              {['JD', 'ML', 'SR', 'PB'].map((initials, i) => (
                <div key={i} className="auth-av" style={{ zIndex: 4 - i }}>
                  {initials}
                </div>
              ))}
            </div>
            <div className="auth-av-text">
              <strong>+15 000 patients</strong>
              <span>nous font déjà confiance</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel ────────────────────────── */}
      <div className="auth-right">
        <div className="auth-form-card">

          <div className="auth-form-header">
            <h1>Connexion</h1>
            <p>Accédez à votre espace personnel</p>
          </div>

          {error && (
            <div className="auth-error-box">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-inner">

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="email">Adresse email</label>
              <div className="auth-input-wrap">
                <Mail size={18} className="auth-input-ico" />
                <input
                  id="email" name="email" type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
              {serverErrors.email && <span className="auth-error-msg">{serverErrors.email[0]}</span>}
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="password">Mot de passe</label>
              <div className="auth-input-wrap">
                <Lock size={18} className="auth-input-ico" />
                <input
                  id="password" name="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPwd(v => !v)}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {serverErrors.password && <span className="auth-error-msg">{serverErrors.password[0]}</span>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              {/* Remember */}
              <label className="auth-checkbox-label" style={{ margin: 0 }}>
                <div
                  className={`auth-checkbox ${remember ? 'checked' : ''}`}
                  onClick={() => setRemember(v => !v)}
                >
                  {remember && <CheckCircle size={14} />}
                </div>
                <span>Se souvenir de moi</span>
              </label>

              <Link to="/forgot-password" className="auth-forgot">Mot de passe oublié ?</Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={`auth-submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading
                ? <span className="auth-spinner" />
                : <><LogIn size={20} /> Se connecter</>
              }
            </button>

          </form>

          <div className="auth-divider"><span>ou continuer avec</span></div>

          <div className="auth-social-btns">
            <button className="auth-social-btn">
              <span>G</span> Google
            </button>
            <button className="auth-social-btn">
              <span>f</span> Facebook
            </button>
          </div>

          <p className="auth-switch">
            Pas encore de compte ?{' '}
            <Link to="/register">S'inscrire <ArrowRight size={15} /></Link>
          </p>

        </div>
      </div>

      {/* ── Blocked Account Modal ─────────────────── */}
      {blockedAlert && (
        <div className="auth-modal-overlay">
          <div className="auth-modal-card">
            <button className="auth-modal-close" onClick={() => setBlockedAlert('')}>
              <X size={20} />
            </button>
            <div className="auth-modal-icon-container">
              <div className="auth-modal-icon-bg">
                <ShieldAlert size={36} className="auth-modal-icon" />
              </div>
            </div>
            <h2 className="auth-modal-title">
              {blockedAlert.includes('suspendu') ? 'Compte Suspendu' : 
               blockedAlert.includes('validation') ? 'Validation en cours' : 
               blockedAlert.includes('refusée') ? 'Inscription refusée' :
               'Erreur de connexion'}
            </h2>
            <p className="auth-modal-message">{blockedAlert}</p>
            <div className="auth-modal-action">
              <button className="auth-modal-btn" onClick={() => setBlockedAlert('')}>
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;