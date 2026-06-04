import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ScrollToTop from '../components/common/ScrollToTop';

// Pages publiques
import Index from '../pages/home/Index';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import SearchResults from '../pages/Search/SearchResults';

// Pages Patient
import DashboardPatient from '../pages/patient/DashboardPatient';
import MesRendezVous from '../pages/patient/RendezVous/MesRendezVous';
import PrendreRendezVous from '../pages/patient/RendezVous/PrendreRendezVous';
import DossierMedical from '../pages/patient/DossierMedical/DossierMedical';
import Paiement from '../pages/patient/Paiement/Paiement';
import AiDiagnostic from '../pages/patient/AiAgent/AiDiagnostic';

// Pages Professionnel
import DashboardPro from '../pages/professionnel/DashboardPro';
import Creneaux from '../pages/professionnel/Creneaux/Creneaux';
import Consultation from '../pages/professionnel/Consultation/Consultation';
import ListePatients from '../pages/professionnel/Patients/ListePatients';
import ProfilSettings from '../pages/professionnel/Profil/ProfilSettings';
import ServiceManagement from '../pages/professionnel/Services/ServiceManagement';
import SecretairesList from '../pages/professionnel/Secretaires/SecretairesList';
import Finances from '../pages/professionnel/Finances/Finances';
import Abonnement from '../pages/professionnel/Abonnement/Abonnement';

// Components
import SubscriptionGuard from '../components/common/SubscriptionGuard';

// Pages Patient (profil)
import PatientProfil from '../pages/patient/Profil/PatientProfil';

// Pages Secrétaire
import DashboardSecretaire from '../pages/secretaire/DashboardSecretaire';
import GestionRendezVous from '../pages/secretaire/GestionRendezVous/GestionRendezVous';
import GestionPatients from '../pages/secretaire/GestionPatient/GestionPatients';
import SecretaireProfil from '../pages/secretaire/Profil/SecretaireProfil';
import GestionCabinet from '../pages/secretaire/GestionCabinet/GestionCabinet';

// Pages Admin
import DashboardAdmin from '../pages/admin/DashboardAdmin/DashboardAdmin';
import AdminPatients from '../pages/admin/AdminPatients/AdminPatients';
import AdminProfessionals from '../pages/admin/AdminProfessionals/AdminProfessionals';
import ValidationProfessionnels from '../pages/admin/ValidationProfessionnels/ValidationProfessionnels';
import AdminSecretaries from '../pages/admin/AdminSecretaries/AdminSecretaries';
import AdminFinances from '../pages/admin/AdminFinances/AdminFinances';
import AdminSubscriptions from '../pages/admin/AdminSubscriptions/AdminSubscriptions';
import AdminProfil from '../pages/admin/AdminProfil/AdminProfil';

// Composant de protection des routes
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="auth-spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Composant pour rediriger les utilisateurs déjà connectés
const GuestRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    const routes = {
      patient: '/patient/dashboard',
      professionnel: '/professionnel/dashboard',
      secretaire: '/secretaire/dashboard',
      admin: '/admin/dashboard'
    };
    return <Navigate to={routes[user.role] || '/'} replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
          <Route path="/recherche" element={<SearchResults />} />

          {/* Routes Patient */}
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardPatient />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/rendez-vous"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <MesRendezVous />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/prendre-rendez-vous"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PrendreRendezVous />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/dossier-medical"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DossierMedical />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/paiement"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Paiement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/profil"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientProfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/diagnostic-ia"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <AiDiagnostic />
              </ProtectedRoute>
            }
          />

          {/* Routes Professionnel */}
          <Route
            path="/professionnel/dashboard"
            element={
              <ProtectedRoute allowedRoles={['professionnel']}>
                <SubscriptionGuard>
                  <DashboardPro />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/professionnel/creneaux"
            element={
              <ProtectedRoute allowedRoles={['professionnel']}>
                <SubscriptionGuard>
                  <Creneaux />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/professionnel/consultations"
            element={
              <ProtectedRoute allowedRoles={['professionnel']}>
                <SubscriptionGuard>
                  <Consultation />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/professionnel/patients"
            element={
              <ProtectedRoute allowedRoles={['professionnel']}>
                <SubscriptionGuard>
                  <ListePatients />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/professionnel/profil"
            element={
              <ProtectedRoute allowedRoles={['professionnel']}>
                <SubscriptionGuard>
                  <ProfilSettings />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/professionnel/services"
            element={
              <ProtectedRoute allowedRoles={['professionnel']}>
                <SubscriptionGuard>
                  <ServiceManagement />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/professionnel/secretaires"
            element={
              <ProtectedRoute allowedRoles={['professionnel']}>
                <SubscriptionGuard>
                  <SecretairesList />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/professionnel/finances"
            element={
              <ProtectedRoute allowedRoles={['professionnel']}>
                <SubscriptionGuard>
                  <Finances />
                </SubscriptionGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/professionnel/abonnement"
            element={
              <ProtectedRoute allowedRoles={['professionnel']}>
                <Abonnement />
              </ProtectedRoute>
            }
          />

          {/* Routes Secrétaire */}
          <Route
            path="/secretaire/dashboard"
            element={
              <ProtectedRoute allowedRoles={['secretaire']}>
                <DashboardSecretaire />
              </ProtectedRoute>
            }
          />
          <Route
            path="/secretaire/rendez-vous"
            element={
              <ProtectedRoute allowedRoles={['secretaire']}>
                <GestionRendezVous />
              </ProtectedRoute>
            }
          />
          <Route
            path="/secretaire/patients"
            element={
              <ProtectedRoute allowedRoles={['secretaire']}>
                <GestionPatients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/secretaire/profil"
            element={
              <ProtectedRoute allowedRoles={['secretaire']}>
                <SecretaireProfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/secretaire/cabinet"
            element={
              <ProtectedRoute allowedRoles={['secretaire']}>
                <GestionCabinet />
              </ProtectedRoute>
            }
          />
          
          {/* Routes Admin */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/patients"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPatients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/professionals"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminProfessionals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/validation-professionnels"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ValidationProfessionnels />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/secretaries"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSecretaries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/finances"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminFinances />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subscriptions"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSubscriptions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profil"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminProfil />
              </ProtectedRoute>
            }
          />

          {/* Route 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default AppRouter;