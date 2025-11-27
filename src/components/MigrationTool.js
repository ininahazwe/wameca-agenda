import { useState, useEffect } from 'react';
import { ref, onValue, set, get } from 'firebase/database';
import { database } from '../firebase';

function MigrationTool() {
  const [oldEvents, setOldEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrated, setMigrated] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Charger les anciennes données
  useEffect(() => {
    const eventsRef = ref(database, 'events');

    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const eventsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setOldEvents(eventsArray);
      } else {
        setOldEvents([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Vérifier si déjà migré
  useEffect(() => {
    const checkMigration = async () => {
      const conferencesRef = ref(database, 'conferences');
      const snapshot = await get(conferencesRef);
      if (snapshot.exists()) {
        setMigrated(true);
      }
    };
    checkMigration();
  }, []);

  const handleMigrate = async () => {
    if (oldEvents.length === 0) {
      setError('No events to migrate');
      return;
    }

    setMigrating(true);
    setError(null);

    try {
      // Trouver les dates min et max
      let minDate = null;
      let maxDate = null;

      oldEvents.forEach(event => {
        if (event.date) {
          if (!minDate || event.date < minDate) minDate = event.date;
          if (!maxDate || event.date > maxDate) maxDate = event.date;
        }
      });

      // Créer la structure sessions
      const sessions = {};
      oldEvents.forEach(event => {
        sessions[event.id] = {
          date: event.date || minDate,
          startTime: event.startTime || '09:00',
          endTime: event.endTime || '10:00',
          title: {
            en: event.title?.en || (typeof event.title === 'string' ? event.title : ''),
            fr: event.title?.fr || '',
            pt: event.title?.pt || ''
          },
          moderator: event.moderator || '',
          speakers: event.speakers || '',
          type: event.type || 'session',
          published: event.published !== false
        };
      });

      // Créer la nouvelle conférence
      const newConference = {
        name: {
          en: 'WAMECA',
          fr: 'WAMECA',
          pt: 'WAMECA'
        },
        subtitle: {
          en: 'Journalism and Digital Public Infrastructure in Africa',
          fr: 'Journalisme et infrastructures publiques numériques en Afrique',
          pt: 'Jornalismo e Infraestruturas Públicas Digitais em África'
        },
        logo: '',
        startDate: minDate || new Date().toISOString().split('T')[0],
        endDate: maxDate || new Date().toISOString().split('T')[0],
        type: 'conference',
        status: 'published',
        createdAt: new Date().toISOString(),
        sessions: sessions
      };

      // Sauvegarder dans Firebase
      const conferenceRef = ref(database, 'conferences/wameca-2025');
      await set(conferenceRef, newConference);

      setStats({
        sessionsCount: Object.keys(sessions).length,
        startDate: newConference.startDate,
        endDate: newConference.endDate
      });

      setMigrated(true);
      setMigrating(false);

    } catch (err) {
      console.error('Migration error:', err);
      setError(err.message);
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Data Migration Tool</h1>
              <p className="text-gray-500">Migrate from events/ to conferences/</p>
            </div>
          </div>

          {/* Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-medium text-gray-900 mb-3">Current Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Old events (events/)</span>
                <span className={`font-medium ${oldEvents.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                  {oldEvents.length} found
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Migration status</span>
                <span className={`font-medium ${migrated ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {migrated ? '✓ Migrated' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Preview */}
          {oldEvents.length > 0 && !migrated && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Preview (first 5 events)</h3>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Date</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Time</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Title (EN)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {oldEvents.slice(0, 5).map(event => (
                      <tr key={event.id}>
                        <td className="px-4 py-2 text-gray-900">{event.date}</td>
                        <td className="px-4 py-2 text-gray-600">{event.startTime} - {event.endTime}</td>
                        <td className="px-4 py-2 text-gray-900 truncate max-w-[200px]">
                          {event.title?.en || event.title || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {oldEvents.length > 5 && (
                  <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500">
                    ... and {oldEvents.length - 5} more events
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Migration Result */}
          {stats && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <h3 className="font-medium text-emerald-800 mb-2">✓ Migration Successful!</h3>
              <div className="text-sm text-emerald-700 space-y-1">
                <p>• {stats.sessionsCount} sessions migrated</p>
                <p>• Event period: {stats.startDate} to {stats.endDate}</p>
                <p>• Conference ID: wameca-2025</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <h3 className="font-medium text-red-800 mb-1">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <a
              href="/"
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-center"
            >
              Back to App
            </a>
            
            {!migrated ? (
              <button
                onClick={handleMigrate}
                disabled={migrating || oldEvents.length === 0}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors ${
                  migrating || oldEvents.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-200'
                }`}
              >
                {migrating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Migrating...
                  </span>
                ) : (
                  'Migrate Data'
                )}
              </button>
            ) : (
              <a
                href="/?admin"
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium text-center shadow-lg shadow-emerald-200"
              >
                Go to Admin Panel
              </a>
            )}
          </div>

          {/* Warning */}
          {!migrated && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Before migrating:</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700">
                    <li>This will create a new 'conferences/' node in Firebase</li>
                    <li>The old 'events/' data will NOT be deleted automatically</li>
                    <li>You can delete 'events/' manually after verifying the migration</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">After Migration</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Go to the Admin Panel to verify all sessions are there</li>
            <li>Update the event name, subtitle, and logo if needed</li>
            <li>Remove this migration tool from your code</li>
            <li>Optionally delete the old 'events/' node from Firebase Console</li>
            <li>Update TimelineViewer.js to read from 'conferences/' (see next step)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default MigrationTool;