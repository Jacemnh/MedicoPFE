import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut,
  User,
  Menu,
  X,
  ChevronDown,
  Home,
  MessageCircle,
  Settings,
  Heart
} from 'lucide-react';
import NotificationsMenu from './NotificationsMenu';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Déterminer le type de page
  const isHomePage = location.pathname === '/';
  const isDashboard = location.pathname.includes('/dashboard') ||
    location.pathname.includes('/patient') ||
    location.pathname.includes('/professionnel') ||
    location.pathname.includes('/secretaire') ||
    location.pathname.includes('/admin');

  // Gestion du scroll (uniquement pour la homepage)
  useEffect(() => {
    if (!isHomePage || isDashboard) return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage, isDashboard]);

  // Ajouter/retirer les classes du body
  useEffect(() => {
    if (isDashboard) {
      document.body.classList.add('dashboard-page');
      document.body.classList.remove('has-fixed-navbar');
    } else {
      document.body.classList.remove('dashboard-page');
      document.body.classList.add('has-fixed-navbar');
    }

    return () => {
      document.body.classList.remove('dashboard-page', 'has-fixed-navbar');
    };
  }, [isDashboard]);

  // Fermer les menus lors du changement de route
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  // NE PAS AFFICHER LA NAVBAR DANS LE DASHBOARD
  if (isDashboard) {
    return null;
  }

  // Déterminer les classes de la navbar
  const getNavbarClasses = () => {
    let classes = 'modern-navbar';

    if (isHomePage) {
      // Homepage: navbar transparente avec effet scroll
      classes += isScrolled ? ' navbar-scrolled' : ' navbar-transparent';
    } else {
      // Autres pages: navbar fixe et solide
      classes += ' navbar-solid';
    }

    return classes;
  };

  const getDashboardLink = () => {
    if (!user) return '/';

    switch (user.role) {
      case 'patient':
        return '/patient/dashboard';
      case 'professionnel':
        return '/professionnel/dashboard';
      case 'secretaire':
        return '/secretaire/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  const navigationLinks = [
    { path: '/', label: 'Accueil' },
    { path: '/#services', label: 'Services' },
    { path: '/#about', label: 'A propos' },
    { path: '/#appointment', label: 'Rendez-vous' },
    { path: '/#contact', label: 'Contact' },
  ];

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  return (
    <nav className={getNavbarClasses()}>
      <div className="modern-navbar-container">
        {/* Logo */}
        <Link to="/" className="modern-navbar-logo">
          <div className="modern-logo-icon">
            <Heart size={20} />
          </div>
          <span className="modern-logo-text">Medico</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="modern-navbar-nav">
          {navigationLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`modern-nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="modern-navbar-actions">
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <NotificationsMenu />

              {/* Messages */}
              <button className="modern-icon-btn" aria-label="Messages">
                <MessageCircle size={20} />
              </button>

              {/* User Menu */}
              <div className="modern-user-menu-wrapper">
                <button
                  className="modern-user-trigger"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-label="User menu"
                >
                  <div className="modern-user-avatar">
                    <User size={18} />
                  </div>
                  <span className="modern-user-name">{user.nom}</span>
                  <ChevronDown
                    size={16}
                    className={`modern-chevron ${isUserMenuOpen ? 'rotated' : ''}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="modern-menu-overlay"
                      onClick={() => setIsUserMenuOpen(false)}
                    ></div>
                    <div className="modern-user-dropdown">
                      <Link to={getDashboardLink()} className="modern-dropdown-item">
                        <Home size={18} />
                        <span>Tableau de bord</span>
                      </Link>
                      {/*<Link to="/profile" className="modern-dropdown-item">
                        <User size={18} />
                        <span>Profile</span>
                      </Link>
                      <Link to="/settings" className="modern-dropdown-item">
                        <Settings size={18} />
                        <span>Settings</span>
                      </Link> */}
                      <div className="modern-dropdown-divider"></div>
                      <button onClick={handleLogout} className="modern-dropdown-item logout">
                        <LogOut size={18} />
                        <span>Deconnexion</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="modern-btn-login">
                Connexion
              </Link>
              <Link to="/register" className="modern-btn-register">
                Prendre un RDV
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="modern-mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          <div
            className="modern-mobile-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="modern-mobile-menu">
            <div className="modern-mobile-nav-links">
              {navigationLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`modern-mobile-link ${location.pathname === link.path ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {isAuthenticated ? (
              <div className="modern-mobile-user-section">
                <Link to={getDashboardLink()} className="modern-mobile-link">
                  <Home size={18} />
                  Tableau de bord
                </Link>
                <Link to="/profile" className="modern-mobile-link">
                  <User size={18} />
                  Profil
                </Link>
                <Link to="/settings" className="modern-mobile-link">
                  <Settings size={18} />
                  Parametres
                </Link>
                <div className="modern-dropdown-divider"></div>
                <button onClick={handleLogout} className="modern-mobile-link logout">
                  <LogOut size={18} />
                  Deconnexion
                </button>
              </div>
            ) : (
              <div className="modern-mobile-auth">
                <Link to="/login" className="modern-mobile-btn-login">
                  Connexion
                </Link>
                <Link to="/register" className="modern-mobile-btn-register">
                  Prendre un RDV
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;