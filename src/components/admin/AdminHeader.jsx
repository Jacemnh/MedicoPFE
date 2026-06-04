import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, CircleDollarSign, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationsMenu from '../common/NotificationsMenu';
import './AdminHeader.css';

const AdminHeader = ({ title, subtitle }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Get user photo path
    const getPhotoUrl = (photo) => {
        if (!photo) return null;
        if (photo.startsWith('http')) return photo;
        return `http://localhost:8000${photo.startsWith('/') ? '' : (photo.startsWith('storage') ? '/' : '/storage/')}${photo}`;
    };

    const photoUrl = getPhotoUrl(user?.photo);

    return (
        <header className="shared-admin-header">
            <div className="admin-header-titles">
                <h1>{title}</h1>
                <p>{subtitle}</p>
            </div>
            
            <div className="admin-header-actions">
                <button className="admin-action-btn" onClick={() => navigate('/admin/subscriptions')} title="Abonnements">
                    <Plus size={20} />
                </button>
                <button className="admin-action-btn" onClick={() => navigate('/admin/finances')} title="Finance">
                    <CircleDollarSign size={20} />
                </button>
                <NotificationsMenu />
                
                <div className="admin-header-divider"></div>
                
                <div className="admin-header-profile" onClick={() => navigate('/admin/profil')} style={{ cursor: 'pointer' }}>
                    <div className="admin-profile-avatar">
                        {photoUrl ? (
                            <img src={photoUrl} alt="Profil" />
                        ) : (
                            <User size={20} color="#64748b" />
                        )}
                    </div>
                    <div className="admin-profile-name">
                        {user?.prenom} {user?.nom}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
