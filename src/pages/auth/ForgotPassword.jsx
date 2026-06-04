import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowLeft, Heart, CheckCircle } from 'lucide-react';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Veuillez renseigner votre adresse email');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      if (err.response?.status === 422) {
        setError(err.response.data.errors?.email?.[0] || 'Email invalide');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer plus tard.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" className="auth-brand">
            <div className="auth-brand-icon"><Heart size={22} /></div>
            <span>Medico</span>
          </Link>

          <div className="auth-left-hero">
            <h2>Mot de passe oublié ?</h2>
            <p>
              Pas de panique, ça arrive à tout le monde. Entrez votre email
              et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h1>Réinitialisation</h1>
            <p>Retrouvez l'accès à votre compte</p>
          </div>

          {error && (
            <div className="auth-error-box">
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="auth-success-box" style={{ padding: '20px', textAlign: 'center', backgroundColor: '#ecfdf5', borderRadius: '12px', border: '1px solid #10b981', marginBottom: '24px' }}>
              <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ color: '#065f46', marginBottom: '8px', fontSize: '18px' }}>Email envoyé !</h3>
              <p style={{ color: '#047857', fontSize: '14px', lineHeight: '1.5' }}>
                Si un compte est associé à <strong>{email}</strong>, vous recevrez un lien de réinitialisation d'ici quelques minutes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form-inner">
              <div className="auth-field">
                <label htmlFor="email">Adresse email</label>
                <div className="auth-input-wrap">
                  <Mail size={18} className="auth-input-ico" />
                  <input
                    id="email" type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading
                  ? <span className="auth-spinner" />
                  : <>Envoyer le lien</>
                }
              </button>
            </form>
          )}

          <p className="auth-switch" style={{ marginTop: '24px' }}>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ArrowLeft size={15} /> Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
