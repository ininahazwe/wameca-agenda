import { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from '../firebase';

function AdminPanel({ onLogout }) {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Fonction pour obtenir la date du jour au format YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // État du formulaire avec valeurs par défaut
  const [formData, setFormData] = useState({
    date: getTodayDate(),
    startTime: '09:00',
    endTime: '17:00',
    title: '',
    moderator: '',
    speakers: '',
    type: 'session',
    published: true
  });

  // Charger les événements en temps réel
  useEffect(() => {
    const eventsRef = ref(database, 'events');
    
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        const eventsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        eventsArray.sort((a, b) => {
          if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
          }
          return a.startTime.localeCompare(b.startTime);
        });
        
        setEvents(eventsArray);
      } else {
        setEvents([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Gérer les changements du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Réinitialiser le formulaire avec valeurs par défaut
  const resetForm = () => {
    setFormData({
      date: getTodayDate(),
      startTime: '09:00',
      endTime: '17:00',
      title: '',
      moderator: '',
      speakers: '',
      type: 'session',
      published: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Ajouter un événement
  const handleAdd = async (e) => {
    e.preventDefault();
    
    if (!formData.date || !formData.startTime || !formData.endTime || !formData.title) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const eventsRef = ref(database, 'events');
      await push(eventsRef, formData);
      resetForm();
      alert(`Événement ${formData.published ? 'publié' : 'enregistré en brouillon'} avec succès !`);
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      alert('Erreur lors de l\'ajout de l\'événement');
    }
  };

  // Modifier un événement
  const handleEdit = (event) => {
    setFormData({
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      title: event.title,
      moderator: event.moderator || '',
      speakers: event.speakers || '',
      type: event.type,
      published: event.published !== false
    });
    setEditingId(event.id);
    setShowForm(true);
  };

  // Mettre à jour un événement
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!formData.date || !formData.startTime || !formData.endTime || !formData.title) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const eventRef = ref(database, `events/${editingId}`);
      await update(eventRef, formData);
      resetForm();
      alert('Événement modifié avec succès !');
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert('Erreur lors de la modification de l\'événement');
    }
  };

  // Supprimer un événement
  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      try {
        const eventRef = ref(database, `events/${id}`);
        await remove(eventRef);
        alert('Événement supprimé avec succès !');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'événement');
      }
    }
  };

  // Dupliquer un événement (non publié par défaut)
  const handleDuplicate = (event) => {
    setFormData({
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      title: `${event.title} (copie)`,
      moderator: event.moderator || '',
      speakers: event.speakers || '',
      type: event.type,
      published: false
    });
    setEditingId(null);
    setShowForm(true);
  };

  // Basculer le statut publié/brouillon
  const togglePublished = async (id, currentStatus) => {
    try {
      const eventRef = ref(database, `events/${id}`);
      await update(eventRef, { published: !currentStatus });
      alert(`Événement ${!currentStatus ? 'publié' : 'mis en brouillon'} !`);
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            🔧 Panneau d'Administration
          </h1>
          <button
            onClick={onLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Se déconnecter
          </button>
        </div>

        {/* Bouton Ajouter */}
        <div className="mb-6">
          <button
            onClick={() => {
              if (showForm && editingId) {
                // Si on était en mode édition, on réinitialise
                resetForm();
              } else if (showForm) {
                // Si on annule la création
                resetForm();
              } else {
                // Si on ouvre le formulaire
                resetForm();
                setShowForm(true);
              }
            }}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            {showForm ? '❌ Annuler' : '➕ Ajouter un événement'}
          </button>
        </div>

        {/* Formulaire */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 flex justify-between items-center">
              <span>{editingId ? '✏️ Modifier l\'événement' : '➕ Nouvel événement'}</span>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                  className="text-sm bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  ➕ Créer un nouvel événement
                </button>
              )}
            </h2>
            
            <form onSubmit={editingId ? handleUpdate : handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Type d'événement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'événement *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="session">Session (avec intervenants)</option>
                    <option value="break">Pause (Lunch, Coffee, etc.)</option>
                  </select>
                </div>

                {/* Statut de publication */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut de publication *
                  </label>
                  <select
                    name="published"
                    value={formData.published}
                    onChange={(e) => setFormData(prev => ({...prev, published: e.target.value === 'true'}))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="true">✅ Publié (visible par les spectateurs)</option>
                    <option value="false">📝 Brouillon (visible uniquement en admin)</option>
                  </select>
                </div>
              </div>  

              <div className="grid grid-cols-3 gap-4">

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                {/* Heures */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure de début *
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure de fin *
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
              </div>

              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Session d'ouverture, Lunch, Keynote..."
                  required
                />
              </div>

              {/* Champs conditionnels pour les sessions */}
              {formData.type === 'session' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modérateur
                    </label>
                    <input
                      type="text"
                      name="moderator"
                      value={formData.moderator}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Jean Dupont"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Intervenants
                    </label>
                    <input
                      type="text"
                      name="speakers"
                      value={formData.speakers}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Marie Martin, Paul Durand, Sophie Bernard"
                    />
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  {editingId ? '💾 Mettre à jour' : '➕ Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des événements */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            📅 Événements programmés ({events.length})
          </h2>

          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aucun événement. Cliquez sur "Ajouter un événement" pour commencer.
            </p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`border-2 rounded-lg p-4 ${
                    event.type === 'break' 
                      ? 'border-orange-300 bg-orange-50' 
                      : 'border-blue-300 bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="bg-gray-700 text-white px-3 py-1 rounded text-sm font-semibold">
                          {event.startTime} - {event.endTime}
                        </span>
                        <span className="bg-gray-200 px-3 py-1 rounded text-sm">
                          {event.date}
                        </span>
                        <span className={`${
                          event.published !== false
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-gray-300 text-gray-700'
                        } px-3 py-1 rounded text-sm font-semibold`}>
                          {event.published !== false ? '✅ Publié' : '📝 Brouillon'}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {event.title}
                      </h3>

                      {event.type === 'session' && (
                        <div className="text-gray-700 space-y-1">
                          {event.moderator && (
                            <p><span className="font-semibold">Modérateur:</span> {event.moderator}</p>
                          )}
                          {event.speakers && (
                            <p><span className="font-semibold">Intervenants:</span> {event.speakers}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4 flex-wrap">
                      <button
                        onClick={() => handleEdit(event)}
                        className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors text-sm"
                      >
                        ✏️ Modifier
                      </button>
                      
                      <button
                        onClick={() => handleDuplicate(event)}
                        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors text-sm"
                      >
                        📋 Dupliquer
                      </button>
                      
                      <button
                        onClick={() => togglePublished(event.id, event.published !== false)}
                        className={`${
                          event.published !== false
                            ? 'bg-orange-500 hover:bg-orange-600' 
                            : 'bg-green-500 hover:bg-green-600'
                        } text-white px-4 py-2 rounded transition-colors text-sm`}
                      >
                        {event.published !== false ? '📝 Mettre en brouillon' : '✅ Publier'}
                      </button>
                      
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;