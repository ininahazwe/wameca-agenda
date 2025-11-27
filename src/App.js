import { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import TimelineViewer from './components/viewer/TimelineViewer';
import {ConfigProvider} from "./contexts/ConfigContext";
import MigrationTool from './components/MigrationTool';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showMigration, setShowMigration] = useState(false);

  // Vérifier si l'URL contient le paramètre admin
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('admin')) {
      setShowAdminLogin(true);
    }
    if (urlParams.has('migrate')) {
      setShowMigration(true);
    }
  }, []);

  const handleLogin = (success) => {
    if (success) {
      setIsAdmin(true);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setShowAdminLogin(false);
    // Retirer le paramètre admin de l'URL
    window.history.replaceState({}, document.title, '/');
  };

  if (showMigration) {
    return <MigrationTool />;
  }

  return (
      <ConfigProvider>
        <div className="App">
          {/* Écran de connexion admin */}
          {showAdminLogin && !isAdmin && <Login onLogin={handleLogin} />}

          {/* Panel admin (après connexion) */}
          {isAdmin && <AdminPanel onLogout={handleLogout} />}

          {/* Timeline publique (mode normal) */}
          {!showAdminLogin && !isAdmin && <TimelineViewer />}
        </div>
      </ConfigProvider>
  );
}

export default App;