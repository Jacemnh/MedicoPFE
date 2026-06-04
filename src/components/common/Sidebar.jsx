import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Heart,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import './Sidebar.css';

const Sidebar = ({ links }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleLogoutClick = () => {
    showAlert({
      title: 'Déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      type: 'question',
      showCancel: true,
      confirmText: 'Se déconnecter',
      onConfirm: () => logout()
    });
  };

  const isLinkActive = (path) => {
    if (path === location.pathname) return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="pro-sidebar-overlay" onClick={toggleMobileSidebar}></div>
      )}

      {/* Sidebar */}
      <aside className={`pro-sidebar ${isCollapsed ? 'pro-sidebar-collapsed' : ''} ${isMobileOpen ? 'pro-sidebar-mobile-open' : ''}`}>
        {/* Header */}
        <div className="pro-sidebar-header">
          <Link to="/" className="pro-sidebar-logo">
            <div className="pro-sidebar-logo-icon">
              <Heart size={24} strokeWidth={2.5} />
            </div>
            {!isCollapsed && (
              <div className="pro-sidebar-logo-text">
                <span className="pro-sidebar-logo-title">Medico</span>
              </div>
            )}
          </Link>

          {/* Close button for mobile */}
          <button
            className="pro-sidebar-close-mobile"
            onClick={toggleMobileSidebar}
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="pro-sidebar-user">
            <div className="pro-sidebar-user-avatar">
              {getInitials(user.nom)}
            </div>
            {!isCollapsed && (
              <div className="pro-sidebar-user-info">
                <span className="pro-sidebar-user-name">{user.nom}</span>
                <span className="pro-sidebar-user-role">
                  {user.role === 'patient' ? 'Patient' :
                    user.role === 'professionnel' ? 'Professionnel' :
                      user.role === 'admin' ? 'Administrateur' :
                        'Secrétaire'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="pro-sidebar-nav">
          <div className="pro-sidebar-nav-group">
            <div className="pro-sidebar-nav-label">
              {!isCollapsed && <span>Menu principal</span>}
            </div>

            {links && links.length > 0 ? (
              links.map((link, index) => {
                const isActive = isLinkActive(link.path);
                return (
                  <Link
                    key={index}
                    to={link.path}
                    className={`pro-sidebar-link ${isActive ? 'pro-sidebar-link-active' : ''}`}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <span className="pro-sidebar-link-icon">
                      {link.icon}
                    </span>
                    {!isCollapsed && (
                      <>
                        <span className="pro-sidebar-link-text">{link.label}</span>
                        {link.badge && (
                          <span className={`pro-sidebar-badge pro-sidebar-badge-${link.badgeVariant || 'primary'}`}>
                            {link.badge}
                          </span>
                        )}
                      </>
                    )}
                    {isCollapsed && link.badge && (
                      <span className="pro-sidebar-badge-dot"></span>
                    )}
                  </Link>
                );
              })
            ) : null}
          </div>

          {/* Bottom Section */}
          <div className="pro-sidebar-nav-bottom">
            <div className="pro-sidebar-divider"></div>

            <button
              onClick={handleLogoutClick}
              className="pro-sidebar-link pro-sidebar-link-logout"
            >
              <span className="pro-sidebar-link-icon">
                <LogOut size={20} />
              </span>
              {!isCollapsed && <span className="pro-sidebar-link-text">Déconnexion</span>}
            </button>
          </div>
        </nav>

        {/* Toggle Button */}
        <button
          className="pro-sidebar-toggle"
          onClick={toggleSidebar}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;