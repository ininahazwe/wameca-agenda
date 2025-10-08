import { useState } from 'react';

function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Mot de passe admin (à changer selon vos besoins)
  const ADMIN_PASSWORD = 'admin2025';

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (password === ADMIN_PASSWORD) {
      onLogin(true);
      setError('');
    } else {
      setError('Wrong password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Admin Timeline
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe admin
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Entrez le mot de passe"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Se connecter
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-500 text-center">
          Mode admin pour modifier la timeline
        </p>
      </div>
    </div>
  );
}

export default Login;