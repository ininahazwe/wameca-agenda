import { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from '../firebase';
import { useConfig } from '../contexts/ConfigContext';

function AdminPanel({ onLogout }) {
  const config = useConfig();
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState(config.languages.default);

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialiser le formData avec les langues disponibles
  const getInitialFormData = () => {
    const titleObj = {};
    config.languages.available.forEach(lang => {
      titleObj[lang] = '';
    });

    return {
      date: getTodayDate(),
      startTime: '09:00',
      endTime: '17:00',
      title: titleObj,
      moderator: '',
      speakers: '',
      type: config.eventTypes[0].id,
      published: true
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

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

  const handleInputChange = (e, lang = null) => {
    const { name, value } = e.target;

    if (lang && name === 'title') {
      setFormData(prev => ({
        ...prev,
        title: {
          ...prev.title,
          [lang]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const resetForm = () => {
    setFormData(getInitialFormData());
    setEditingId(null);
    setShowForm(false);
    setActiveTab(config.languages.default);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérifier que tous les titres dans toutes les langues sont remplis
    const allTitlesFilled = config.languages.available.every(lang => formData.title[lang]);

    if (!formData.date || !formData.startTime || !formData.endTime || !allTitlesFilled) {
      alert(`Please fill all required fields in all languages (${config.languages.available.length} languages)`);
      return;
    }

    try {
      if (editingId) {
        const eventRef = ref(database, `events/${editingId}`);
        await update(eventRef, formData);
        alert('Event updated successfully!');
      } else {
        const eventsRef = ref(database, 'events');
        await push(eventsRef, formData);
        alert(`Event ${formData.published ? 'published' : 'saved as draft'} successfully!`);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event');
    }
  };

  const handleEdit = (event) => {
    const titleObj = {};
    config.languages.available.forEach(lang => {
      titleObj[lang] = event.title?.[lang] || '';
    });

    setFormData({
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      title: titleObj,
      moderator: event.moderator || '',
      speakers: event.speakers || '',
      type: event.type,
      published: event.published !== false
    });
    setEditingId(event.id);
    setShowForm(true);
    setActiveTab(config.languages.default);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const eventRef = ref(database, `events/${id}`);
        await remove(eventRef);
        alert('Event deleted successfully!');
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event');
      }
    }
  };

  const handleDuplicate = (event) => {
    const titleObj = {};
    config.languages.available.forEach(lang => {
      const copyText = lang === 'en' ? 'copy' : lang === 'fr' ? 'copie' : 'cópia';
      titleObj[lang] = `${event.title?.[lang] || ''} (${copyText})`;
    });

    setFormData({
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      title: titleObj,
      moderator: event.moderator || '',
      speakers: event.speakers || '',
      type: event.type,
      published: false
    });
    setEditingId(null);
    setShowForm(true);
    setActiveTab(config.languages.default);
  };

  const togglePublished = async (id, currentStatus) => {
    try {
      const eventRef = ref(database, `events/${id}`);
      await update(eventRef, { published: !currentStatus });
      alert(`Event ${!currentStatus ? 'published' : 'set to draft'}!`);
    } catch (error) {
      console.error('Error changing status:', error);
      alert('Error changing status');
    }
  };

  const getDisplayValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      return value[config.languages.default] || value[config.languages.available[0]] || '';
    }
    return value || '';
  };

  const getEventTypeConfig = (typeId) => {
    return config.eventTypes.find(type => type.id === typeId) || config.eventTypes[0];
  };

  const currentEventType = getEventTypeConfig(formData.type);

  return (
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">🔧 Admin Panel - {config.event.name}</h1>
            <button
                onClick={onLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="mb-6">
            <button
                onClick={() => {
                  if (showForm) {
                    resetForm();
                  } else {
                    resetForm();
                    setShowForm(true);
                  }
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              {showForm ? '✖ Cancel' : '➕ Add Event'}
            </button>
          </div>

          {showForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  {editingId ? '✏️ Edit Event' : '➕ New Event'}
                </h2>

                {/* Language Tabs */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    💡 Only the <strong>title</strong> needs to be translated in {config.languages.available.length} languages. Moderators and speakers remain the same.
                  </p>
                </div>

                <div className="flex gap-2 mb-6 border-b border-gray-200">
                  {config.languages.available.map(lang => (
                      <button
                          key={lang}
                          type="button"
                          onClick={() => setActiveTab(lang)}
                          className={`px-6 py-3 font-semibold transition-colors ${
                              activeTab === lang
                                  ? 'border-b-2 border-blue-600 text-blue-600'
                                  : 'text-gray-500 hover:text-gray-700'
                          }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Event Type *</label>
                      <select
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                      >
                        {config.eventTypes.map(type => (
                            <option key={type.id} value={type.id}>
                              {type.label[config.languages.default] || type.label.en}
                            </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Publication Status *</label>
                      <select
                          name="published"
                          value={formData.published}
                          onChange={(e) => setFormData(prev => ({...prev, published: e.target.value === 'true'}))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                      >
                        <option value="true">✅ Published (visible to viewers)</option>
                        <option value="false">📝 Draft (admin only)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                      <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
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

                  {/* Title - Multilingual */}
                  <div className="border-t pt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title * ({activeTab.toUpperCase()})
                      </label>
                      <input
                          type="text"
                          name="title"
                          value={formData.title[activeTab]}
                          onChange={(e) => handleInputChange(e, activeTab)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={`Enter title in ${activeTab.toUpperCase()}`}
                          required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Switch tabs to enter the title in all {config.languages.available.length} languages
                      </p>
                    </div>

                    {/* Moderator & Speakers - Conditional based on event type */}
                    {(currentEventType.hasModeratorField || currentEventType.hasSpeakersField) && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          {currentEventType.hasModeratorField && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Moderator <span className="text-gray-400">(same in all languages)</span>
                                </label>
                                <input
                                    type="text"
                                    name="moderator"
                                    value={formData.moderator}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: John Doe, Jean Dupont, João Silva"
                                />
                              </div>
                          )}

                          {currentEventType.hasSpeakersField && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Speakers <span className="text-gray-400">(same in all languages)</span>
                                </label>
                                <input
                                    type="text"
                                    name="speakers"
                                    value={formData.speakers}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: Jane Smith, Marie Martin, Maria Santos"
                                />
                              </div>
                          )}
                        </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      {editingId ? '💾 Update' : '➕ Add'}
                    </button>
                    <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              📅 Scheduled Events ({events.length})
            </h2>

            {events.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No events. Click "Add Event" to start.
                </p>
            ) : (
                <div className="space-y-4">
                  {events.map((event) => {
                    const eventTypeConfig = getEventTypeConfig(event.type);

                    return (
                        <div
                            key={event.id}
                            className="border-2 rounded-lg p-4"
                            style={{
                              borderColor: eventTypeConfig.color,
                              backgroundColor: `${eventTypeConfig.color}20`
                            }}
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
                          {event.published !== false ? '✅ Published' : '📝 Draft'}
                        </span>
                              </div>

                              {config.languages.available.map((lang, index) => (
                                  <div key={lang} className="mb-2">
                                    <span className="text-xs text-gray-500 uppercase">{lang}:</span>
                                    <h3 className="text-lg font-bold text-gray-800">
                                      {typeof event.title === 'object' ? event.title[lang] : event.title}
                                    </h3>
                                  </div>
                              ))}

                              {(eventTypeConfig.hasModeratorField || eventTypeConfig.hasSpeakersField) && (
                                  <div className="text-gray-700 space-y-1 text-sm mt-2">
                                    {eventTypeConfig.hasModeratorField && event.moderator && (
                                        <p><span className="font-semibold">Moderator:</span> {event.moderator}</p>
                                    )}
                                    {eventTypeConfig.hasSpeakersField && event.speakers && (
                                        <p><span className="font-semibold">Speakers:</span> {event.speakers}</p>
                                    )}
                                  </div>
                              )}
                            </div>

                            <div className="flex gap-2 ml-4 flex-wrap">
                              <button
                                  onClick={() => handleEdit(event)}
                                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors text-sm"
                              >
                                ✏️ Edit
                              </button>

                              <button
                                  onClick={() => handleDuplicate(event)}
                                  className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors text-sm"
                              >
                                📋 Duplicate
                              </button>

                              <button
                                  onClick={() => togglePublished(event.id, event.published !== false)}
                                  className={`${
                                      event.published !== false
                                          ? 'bg-orange-500 hover:bg-orange-600'
                                          : 'bg-green-500 hover:bg-green-600'
                                  } text-white px-4 py-2 rounded transition-colors text-sm`}
                              >
                                {event.published !== false ? '📝 Draft' : '✅ Publish'}
                              </button>

                              <button
                                  onClick={() => handleDelete(event.id)}
                                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        </div>
                    );
                  })}
                </div>
            )}
          </div>
        </div>
      </div>
  );
}

export default AdminPanel;