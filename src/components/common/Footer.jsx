import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Send,
  Calendar,
  FileText,
  Users,
  Shield,
  Clock,
  Award,
  ArrowRight
} from 'lucide-react';
import api from '../../api/axios';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({ email: '', message: '' });
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.message) return;

    setLoading(true);
    setStatus({ type: '', msg: '' });

    try {
      const response = await api.post('/contact', formData);

      setStatus({ type: 'success', msg: response.data.message || 'Votre message a été envoyé avec succès.' });
      setFormData({ email: '', message: '' });

      // Masquer le message après 4 secondes
      setTimeout(() => setStatus({ type: '', msg: '' }), 4000);

    } catch (error) {
      setStatus({ type: 'error', msg: error.response?.data?.message || 'Une erreur est survenue.' });

      // Masquer le message d'erreur après 4 secondes
      setTimeout(() => setStatus({ type: '', msg: '' }), 4000);
    } finally {
      setLoading(false);
    }
  };
  /*const isAuthPage = location.pathname === '/login' || 
                     location.pathname === '/register';

  if (isAuthPage) return null;*/

  const quickLinks = [
    { label: 'Accueil', path: '/', icon: <Heart size={16} /> },
    { label: 'Services', path: '#services', icon: <FileText size={16} /> },
    { label: 'À propos', path: '#about', icon: <Users size={16} /> },
    { label: 'Contact', path: '#contact', icon: <Mail size={16} /> },
  ];

  const services = [
    { label: 'Prise de rendez-vous' },
    { label: 'Suivi des ordonnances' },
    { label: 'Dossier médical' },
    { label: 'Assistant IA' },
  ];

  const legal = [
    { label: 'Mentions légales' },
    { label: 'Conditions d\'utilisation' },
    { label: 'Politique de confidentialité' },
    { label: 'Droits du patient' },
  ];

  const socialLinks = [
    { icon: <Facebook size={20} />, url: '#', label: 'Facebook', color: '#1877F2' },
    { icon: <Twitter size={20} />, url: '#', label: 'Twitter', color: '#1DA1F2' },
    { icon: <Instagram size={20} />, url: '#', label: 'Instagram', color: '#E4405F' },
    { icon: <Linkedin size={20} />, url: '#', label: 'LinkedIn', color: '#0A66C2' },
    { icon: <Youtube size={20} />, url: '#', label: 'YouTube', color: '#FF0000' },
  ];

  const features = [
    { icon: <Shield size={24} />, text: 'Données 100% sécurisées' },
    { icon: <Clock size={24} />, text: 'Service 24h/24, 7j/7' },
  ];

  return (
    <footer id="contact" className="footer">
      {/* Contact Section */}
      <div className="newsletter-section">
        <div className="newsletter-container">
          <div className="newsletter-content contact-modern-content">
            <div className="newsletter-info contact-modern-info">
              <h3>Contactez-nous</h3>
              <p>Envoyez-nous un message, une suggestion, une réclamation ou un rapport. Nous vous répondrons dans les plus brefs délais.</p>
              <div className="contact-status-container">
                {status.msg && (
                  <div className={`contact-status-alert ${status.type}`}>
                    {status.msg}
                  </div>
                )}
              </div>
            </div>
            <form className="newsletter-form contact-modern-form" onSubmit={handleSubmit}>
              <div className="newsletter-input-wrapper contact-input-wrapper">
                <Mail size={20} className="input-icon" />
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  className="newsletter-input contact-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="newsletter-input-wrapper contact-textarea-wrapper">
                <FileText size={20} className="input-icon textarea-icon" />
                <textarea
                  placeholder="Votre message"
                  className="newsletter-input contact-textarea"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows="4"
                ></textarea>
              </div>
              <button type="submit" className="newsletter-btn contact-submit-btn" disabled={loading}>
                <span>{loading ? 'Envoi...' : 'Envoyer'}</span>
                {!loading && <Send size={18} />}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="footer-main">
        <div className="footer-container">
          <div className="footer-grid">
            {/* Company Info */}
            <div className="footer-column footer-brand">
              <Link to="/" className="footer-logo">
                <div className="footer-logo-icon">
                  <Heart size={28} />
                </div>
                <div className="footer-logo-text">
                  <span className="footer-logo-title">Medico</span>
                  <span className="footer-logo-subtitle">Healthcare</span>
                </div>
              </Link>
              <p className="footer-description">
                Votre plateforme médicale de confiance. Nous connectons patients et professionnels
                de santé pour une expérience de soins moderne et efficace.
              </p>

              {/* Contact Info */}
              <div className="footer-contact">
                <a href="tel:+33123456789" className="contact-item">
                  <Phone size={18} />
                  <span>+33 1 23 45 67 89</span>
                </a>
                <a href="mailto:medicoplateforme@gmail.com" className="contact-item">
                  <Mail size={18} />
                  <span>medicoplateforme@gmail.com</span>
                </a>
                <div className="contact-item">
                  <MapPin size={18} />
                  <span>Paris, France</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="footer-social">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    className="social-link"
                    aria-label={social.label}
                    style={{ '--hover-color': social.color }}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-column">
              <h4 className="footer-title">Liens rapides</h4>
              <ul className="footer-links">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    {link.path.startsWith('#') ? (
                      <a href={link.path} className="footer-link">
                        {link.icon}
                        <span>{link.label}</span>
                        <ArrowRight size={16} className="link-arrow" />
                      </a>
                    ) : (
                      <Link to={link.path} className="footer-link">
                        {link.icon}
                        <span>{link.label}</span>
                        <ArrowRight size={16} className="link-arrow" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div className="footer-column">
              <h4 className="footer-title">Nos services</h4>
              <ul className="footer-links">
                {services.map((service, index) => (
                  <li key={index}>
                    <div className="footer-link" style={{ cursor: 'default' }}>
                      <Calendar size={16} />
                      <span>{service.label}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div className="footer-column">
              <h4 className="footer-title">Informations légales</h4>
              <ul className="footer-links">
                {legal.map((item, index) => (
                  <li key={index}>
                    <div className="footer-link" style={{ cursor: 'default' }}>
                      <FileText size={16} />
                      <span>{item.label}</span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Trust Badges */}
              <div className="trust-badges">
                {features.map((feature, index) => (
                  <div key={index} className="trust-badge">
                    {feature.icon}
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-container">
          <div className="footer-bottom-content">
            <p className="copyright">
              &copy; {currentYear} <strong>Medico Healthcare</strong>. Tous droits réservés.
            </p>
            <div className="footer-bottom-links">
              <span>Plan du site</span>
              <span className="separator">•</span>
              <span>Accessibilité</span>
              <span className="separator">•</span>
              <span>Support</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;