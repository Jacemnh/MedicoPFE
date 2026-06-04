import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Eye, EyeOff, Heart, CheckCircle } from 'lucide-react';
import './Auth.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [formData, setFormData] = useState({
    password: '',
    password_confirmation: '',
  });
  
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const { resetPassword, errors: serverErrors } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !email) {
      setError('Le lien de réinitialisation est invalide ou expiré.');
    }
  }, [token, email]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        token,
        email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      if (err.response?.status !== 422) {
        setError('Une erreur est survenue lors de la réinitialisation.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="auth-page">
        <div className="auth-right" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div className="auth-form-card" style={{ maxWidth: '500px' }}>
            <div className="auth-error-box" style={{ marginTop: '0' }}>
              <span>Le lien de réinitialisation est invalide ou expiré.</span>
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/forgot-password" style={{ color: '#6366F1', fontWeight: 'bold' }}>
                Demander un nouveau lien
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" className="auth-brand">
            <div className="auth-brand-icon"><Heart size={22} /></div>
            <span>Medico</span>
          </Link>

          <div className="auth-left-hero">
            <h2>Nouveau mot de passe</h2>
            <p>
              Veuillez choisir un mot de passe fort avec au moins 8 caractères,
              comprenant des lettres et des chiffres.
            </p>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h1>Créer un mot de passe</h1>
            <p>Sécurisez à nouveau votre compte</p>
          </div>

          {error && (
            <div className="auth-error-box">
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="auth-success-box" style={{ padding: '20px', textAlign: 'center', backgroundColor: '#ecfdf5', borderRadius: '12px', border: '1px solid #10b981', marginBottom: '24px' }}>
              <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ color: '#065f46', marginBottom: '8px', fontSize: '18px' }}>Réinitialisation réussie !</h3>
              <p style={{ color: '#047857', fontSize: '14px', lineHeight: '1.5' }}>
                Votre mot de passe a été mis à jour. Vous allez être redirigé vers la page de connexion...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form-inner">
              <div className="auth-field">
                <label>Email</label>
                <div className="auth-input-wrap" style={{ backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', color: '#64748b', fontSize: '14px' }}>
                  {email}
                </div>
              </div>

              {/* Password */}
              <div className="auth-field">
                <label htmlFor="password">Nouveau mot de passe</label>
                <div className="auth-input-wrap">
                  <Lock size={18} className="auth-input-ico" />
                  <input
                    id="password" name="password"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="8"
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
                {serverErrors?.password && <span className="auth-error-msg">{serverErrors.password[0]}</span>}
              </div>

              {/* Confirm Password */}
              <div className="auth-field">
                <label htmlFor="password_confirmation">Confirmer le mot de passe</label>
                <div className="auth-input-wrap">
                  <Lock size={18} className="auth-input-ico" />
                  <input
                    id="password_confirmation" name="password_confirmation"
                    type={showConfirmPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    required
                    minLength="8"
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowConfirmPwd(v => !v)}
                    tabIndex={-1}
                  >
                    {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading
                  ? <span className="auth-spinner" />
                  : <>Enregistrer le mot de passe</>
                }
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
