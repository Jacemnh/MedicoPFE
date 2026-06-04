import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import AppRouter from './router/AppRouter';
import './assets/styles/theme.css';
import './assets/styles/global.css';

function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <AppRouter />
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;