import { Link, useLocation } from 'react-router-dom';
import Button from '../../components/common/Button';
import {
  Heart,
  Phone,
  Calendar,
  MessageCircle,
  Star,
  Play,
  CheckCircle,
  Users,
  Clock,
  Shield,
  Video,
  ChevronRight
} from 'lucide-react';
import './Home.css';
import { useEffect } from 'react';
import SearchBar from '../../components/common/SearchBar';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleProtectedAction = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      if (user?.role === 'patient') navigate('/patient/dashboard');
      else if (user?.role === 'professionnel') navigate('/professionnel/dashboard');
      else if (user?.role === 'secretaire') navigate('/secretaire/dashboard');
      else if (user?.role === 'admin') navigate('/admin/dashboard');
      else navigate('/');
    }
  };

  const stats = [
    { icon: '', label: 'Medecins experts' },
    { icon: '', label: 'Réservation simplifiée' },
    { icon: '', label: 'diagnostics médicaux' },
    { icon: '', label: 'Tests medicaux' },
  ];
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [hash]);

  const features = [
    {
      icon: <Calendar size={24} />,
      title: 'Rendez-vous faciles',
      description: 'Reservez votre consultation en quelques clics seulement',
      color: '#8B5CF6'
    },
    {
      icon: <Shield size={24} />,
      title: 'Securise et confidentiel',
      description: 'Vos donnees sont protegees et restent confidentielles',
      color: '#10B981'
    },
  ];

  const testimonials = [
    { name: 'Sarah Johnson', avatar: '', rating: 5 },
    { name: 'Mike Davis', avatar: '', rating: 5 },
    { name: 'Emily Wilson', avatar: '', rating: 5 },
    { name: 'John Smith', avatar: '', rating: 5 },
  ];

  return (
    <div className="modern-home">
      {/* Section Hero */}
      <section className="modern-hero">
        <div className="hero-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>

        <div className="modern-hero-container">
          {/* Contenu gauche */}
          <div className="modern-hero-content">

            <h1 className="modern-hero-title">
              Nous vous offrons un soutien<br />
              <span className="gradient-text">medical professionnel.</span>
            </h1>

            {/* Barre de recherche (visible pour visiteurs ou patients) */}
            {(!isAuthenticated || user?.role === 'patient') && (
              <SearchBar />
            )}

            <p className="modern-hero-description">
              Disposer d'un reseau de soignants et de specialistes est indispensable
              pour prendre en charge votre sante mentale et votre bien-etre.
            </p>

            <div className="modern-hero-actions">
              <button className="btn-primary-modern" onClick={handleProtectedAction}>
                Commencer
              </button>
              <button className="btn-secondary-modern" onClick={handleProtectedAction}>
                <Play size={18} />
                Prendre un RDV
              </button>
            </div>

            {/* Section de confiance */}
            <div className="trusted-section">
              <div className="trusted-avatars">
                {testimonials.map((person, index) => (
                  <div key={index} className="trusted-avatar" style={{ zIndex: 4 - index }}>
                    <span>{person.avatar}</span>
                  </div>
                ))}
                <div className="trusted-count">+</div>
              </div>
              <div className="trusted-text">
                <strong>Nos patients satisfaits</strong>
                <p>Des personnes que nous avons aidees</p>
              </div>
            </div>
          </div>

          {/* Contenu droit - Medecin */}
          <div className="modern-hero-visual">
            {/* Carte principale */}
            <div className="doctor-main-card">
              <div className="doctor-image-wrapper">
                <div className="doctor-placeholder">
                  <div className="doctor-icon-large">
                    <Heart size={80} color="#8B5CF6" />
                  </div>
                </div>

                {/* Cartes flottantes de statistiques */}
                <div className="stat-float stat-1">
                  <div className="stat-icon">
                    <Users size={20} />
                  </div>
                  <div className="stat-info">
                    <strong>120+</strong>
                    <span>Medecins experts</span>
                  </div>
                </div>

                <div className="stat-float stat-2">
                  <div className="stat-icon-circle">
                    <Phone size={24} color="white" />
                  </div>
                  <div className="stat-contact">
                    <span>Besoin d'aide ?</span>
                    <strong>(302) 555-0107</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Elements flottants */}
            <div className="float-element element-1">
              <div className="element-icon">
                <Calendar size={20} />
              </div>
              <div className="element-content">
                <strong>Reservation</strong>
                <p>Planifier un rendez-vous</p>
              </div>
            </div>

            <div className="float-element element-2">
              <div className="element-icon success">
                <CheckCircle size={20} />
              </div>
              <div className="element-content">
                <strong>Confirme</strong>
                <p>Rendez-vous confirme</p>
              </div>
            </div>

            <div className="float-element element-3">
              <div className="pulse-wrapper">
                <div className="pulse-icon">
                  <Heart size={24} color="#EF4444" />
                </div>
                <div className="pulse-ring"></div>
                <div className="pulse-ring pulse-ring-2"></div>
              </div>
            </div>

            {/* Points decoratifs */}
            <div className="decorative-dots dots-top"></div>
            <div className="decorative-dots dots-bottom"></div>
          </div>
        </div>

        {/* Indicateur de defilement */}
        <div className="scroll-indicator">
          <span>Comment ca marche</span>
          <div className="scroll-mouse">
            <div className="scroll-wheel"></div>
          </div>
        </div>
      </section>

      {/* Section Services */}
      <section id="services" className="features-modern-section">
        <div className="features-modern-container">
          <div className="section-header-modern">
            <span className="section-label">Nos Services</span>
            <h2>Des solutions de sante completes</h2>
            <p>Nous proposons une large gamme de services medicaux pour repondre a vos besoins de sante</p>
          </div>

          <div className="features-modern-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-modern-card">
                <div className="feature-icon-wrapper" style={{ background: `${feature.color}20` }}>
                  <div style={{ color: feature.color }}>
                    {feature.icon}
                  </div>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <button className="feature-link">
                  En savoir plus <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Statistiques */}
      <section id="about" className="stats-modern-section">
        <div className="stats-modern-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-modern-item">
              <div className="stat-modern-icon">{stat.icon}</div>
              <span className="stat-modern-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section Appel a l'action */}
      <section id="appointment" className="cta-modern-section">
        <div className="cta-modern-container">
          <div className="cta-modern-content">
            <h2>Pret a passer a l'etape suivante ?</h2>
            <p>Rejoignez des milliers de patients qui nous font confiance pour leur sante</p>
            <div className="cta-modern-actions">
              <button className="cta-btn-primary" onClick={handleProtectedAction}>
                Commencer maintenant
              </button>
              <button className="cta-btn-secondary">
                <Phone size={18} />
                Nous contacter
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;