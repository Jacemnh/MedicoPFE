import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AbonnementModal from './AbonnementModal';
import './SubscriptionGuard.css';

const SubscriptionGuard = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return null;

    if (!user || user.role !== 'professionnel') {
        return children;
    }

    const pro = user.professionnel;
    if (!pro) return children;

    // Skip check for the subscription page itself if they access it directly
    if (location.pathname === '/professionnel/abonnement') {
        return children;
    }

    const now = new Date();
    
    // Check trial
    let isTrialActive = false;
    if (pro.trial_ends_at) {
        const trialEnd = new Date(pro.trial_ends_at);
        isTrialActive = trialEnd > now;
    }

    // Check subscription
    let isSubActive = false;
    if (pro.subscription_ends_at) {
        const subEnd = new Date(pro.subscription_ends_at);
        isSubActive = subEnd > now;
    }

    if (!isTrialActive && !isSubActive) {
        return (
            <>
                <div className="subscription-guard-blocked-content">
                    {children}
                </div>
                <AbonnementModal />
            </>
        );
    }

    return children;
};

export default SubscriptionGuard;
