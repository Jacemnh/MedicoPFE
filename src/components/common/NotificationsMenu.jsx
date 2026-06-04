import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Info, AlertTriangle, CheckCircle, BellRing } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import './NotificationsMenu.css';

const NotificationsMenu = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRespond = async (id, status) => {
    try {
      await notificationService.respondToReschedule(id, status);
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue lors du traitement.');
    }
  };

  const getIconData = (type) => {
    if (type === 'action_required') return { icon: <AlertTriangle size={18} />, cls: 'notif-icon-action' };
    if (type === 'warning') return { icon: <X size={18} />, cls: 'notif-icon-warning' };
    if (type === 'success') return { icon: <CheckCircle size={18} />, cls: 'notif-icon-success' };
    return { icon: <Info size={18} />, cls: 'notif-icon-info' };
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const today = new Date();
    
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="notif-menu-wrapper" ref={menuRef}>
      <button 
        className="notif-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="notif-badge-top">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown-panel" onClick={(e) => e.stopPropagation()}>
          <div className="notif-header">
            <h3><BellRing size={16} /> Notifications {unreadCount > 0 && `(${unreadCount})`}</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="notif-mark-all">
                Tout marquer comme lu
              </button>
            )}
          </div>
          
          <div className="notif-body">
             {loading ? (
               <div className="notif-empty">
                 <div className="auth-spinner" style={{width: '24px', height: '24px', borderColor: '#6366F1', borderTopColor: 'transparent'}}></div>
                 <p>Chargement...</p>
               </div>
             ) : notifications.length === 0 ? (
               <div className="notif-empty">
                 <Bell size={32} color="#cbd5e1" opacity={0.6} />
                 <p>Vous n'avez aucune notification.</p>
               </div>
             ) : (
               notifications.map(notif => {
                 const { icon, cls } = getIconData(notif.type);
                 return (
                   <div 
                     key={notif.id} 
                     className={`notif-item ${!notif.read ? 'unread' : ''}`}
                     onClick={() => !notif.read && notif.type !== 'action_required' && handleMarkAsRead(notif.id)}
                     style={{ cursor: !notif.read && notif.type !== 'action_required' ? 'pointer' : 'default' }}
                   >
                     <div className={`notif-icon-circle ${cls}`}>
                       {icon}
                     </div>
                     <div className="notif-content">
                        <div className="notif-title-row">
                          <h4>{notif.titre}</h4>
                          <span className="notif-time">{formatDate(notif.created_at)}</span>
                        </div>
                        <p className="notif-desc">{notif.message}</p>
                        
                        {notif.type === 'action_required' && notif.action_type === 'reschedule_response' && (
                          <div className="notif-actions">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleRespond(notif.id, 'accept'); }}
                              className="notif-btn notif-btn-accept"
                            >
                              <Check size={16}/> Accepter
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleRespond(notif.id, 'refuse'); }}
                              className="notif-btn notif-btn-refuse"
                            >
                              <X size={16}/> Refuser
                            </button>
                          </div>
                        )}
                     </div>
                   </div>
                 )
               })
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsMenu;
