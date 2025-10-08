import { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import TimelineViewer from './components/TimelineViewer';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('admin')) {
      setShowAdminLogin(true);
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
    window.history.replaceState({}, document.title, '/');
  };

  return (
    <LanguageProvider>
      <div className="App">
        {showAdminLogin && !isAdmin && <Login onLogin={handleLogin} />}
        {isAdmin && <AdminPanel onLogout={handleLogout} />}
        {!showAdminLogin && !isAdmin && <TimelineViewer />}
      </div>
    </LanguageProvider>
  );
}

export default App;