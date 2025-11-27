import { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from '../firebase';

function AdminPanel({ onLogout }) {
  // State
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState('list'); // 'list', 'event-form', 'event-detail', 'session-form'
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingSession, setEditingSession] = useState(null);

  // Event Form Data
  const [eventForm, setEventForm] = useState({
    name: { en: '', fr: '', pt: '' },
    subtitle: { en: '', fr: '', pt: '' },
    logo: '',
    startDate: '',
    endDate: '',
    type: 'conference',
    status: 'draft'
  });

  // Session Form Data
  const [sessionForm, setSessionForm] = useState({
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    title: { en: '', fr: '', pt: '' },
    moderator: '',
    speakers: '',
    type: 'session',
    published: true
  });

  // Load events from Firebase
  useEffect(() => {
    const eventsRef = ref(database, 'conferences');

    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const eventsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        eventsArray.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
        setEvents(eventsArray);
        
        // Update selectedEvent if it exists
        if (selectedEvent) {
          const updated = eventsArray.find(e => e.id === selectedEvent.id);
          if (updated) setSelectedEvent(updated);
        }
      } else {
        setEvents([]);
      }
    });

    return () => unsubscribe();
  }, [selectedEvent?.id]);

  // Helper functions
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDateRange = (start, end) => {
    if (!start) return 'No dates set';
    if (start === end || !end) return formatDisplayDate(start);
    return `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`;
  };

  const isEventPast = (event) => {
    if (!event.endDate) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const endDate = new Date(event.endDate);
    endDate.setHours(23, 59, 59);
    return endDate < now;
  };

  const isSessionPast = (session) => {
    if (!session.date || !session.endTime) return false;
    const now = new Date();
    const sessionEnd = new Date(`${session.date}T${session.endTime}`);
    return sessionEnd < now;
  };

  const getSessionsForEvent = (event) => {
    if (!event.sessions) return [];
    return Object.keys(event.sessions).map(key => ({
      id: key,
      ...event.sessions[key]
    })).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  };

  const getSessionsByDate = (sessions) => {
    const grouped = {};
    sessions.forEach(session => {
      if (!grouped[session.date]) {
        grouped[session.date] = [];
      }
      grouped[session.date].push(session);
    });
    return grouped;
  };

  // Event CRUD
  const resetEventForm = () => {
    setEventForm({
      name: { en: '', fr: '', pt: '' },
      subtitle: { en: '', fr: '', pt: '' },
      logo: '',
      startDate: getTodayDate(),
      endDate: getTodayDate(),
      type: 'conference',
      status: 'draft'
    });
    setEditingEvent(null);
  };

  const handleCreateEvent = async () => {
    if (!eventForm.name.en || !eventForm.startDate || !eventForm.endDate) {
      alert('Please fill in: Name (English), Start Date, and End Date');
      return;
    }

    try {
      if (editingEvent) {
        const eventRef = ref(database, `conferences/${editingEvent.id}`);
        await update(eventRef, {
          name: eventForm.name,
          subtitle: eventForm.subtitle,
          logo: eventForm.logo,
          startDate: eventForm.startDate,
          endDate: eventForm.endDate,
          type: eventForm.type,
          status: eventForm.status
        });
      } else {
        const eventsRef = ref(database, 'conferences');
        await push(eventsRef, {
          ...eventForm,
          createdAt: new Date().toISOString()
        });
      }
      resetEventForm();
      setView('list');
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event');
    }
  };

  const handleEditEvent = (event) => {
    setEventForm({
      name: event.name || { en: '', fr: '', pt: '' },
      subtitle: event.subtitle || { en: '', fr: '', pt: '' },
      logo: event.logo || '',
      startDate: event.startDate || '',
      endDate: event.endDate || '',
      type: event.type || 'conference',
      status: event.status || 'draft'
    });
    setEditingEvent(event);
    setView('event-form');
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Delete this event and all its sessions? This cannot be undone.')) {
      try {
        await remove(ref(database, `conferences/${eventId}`));
        setSelectedEvent(null);
        setView('list');
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event');
      }
    }
  };

  // Session CRUD
  const resetSessionForm = () => {
    const defaultDate = selectedEvent?.startDate || getTodayDate();
    setSessionForm({
      date: defaultDate,
      startTime: '09:00',
      endTime: '10:00',
      title: { en: '', fr: '', pt: '' },
      moderator: '',
      speakers: '',
      type: 'session',
      published: true
    });
    setEditingSession(null);
  };

  const handleCreateSession = async () => {
    if (!sessionForm.title.en || !sessionForm.date || !sessionForm.startTime || !sessionForm.endTime) {
      alert('Please fill in: Title (English), Date, Start Time, and End Time');
      return;
    }

    try {
      if (editingSession) {
        const sessionRef = ref(database, `conferences/${selectedEvent.id}/sessions/${editingSession.id}`);
        await update(sessionRef, sessionForm);
      } else {
        const sessionsRef = ref(database, `conferences/${selectedEvent.id}/sessions`);
        await push(sessionsRef, sessionForm);
      }
      resetSessionForm();
      setView('event-detail');
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Error saving session');
    }
  };

  const handleEditSession = (session) => {
    setSessionForm({
      date: session.date || '',
      startTime: session.startTime || '09:00',
      endTime: session.endTime || '10:00',
      title: session.title || { en: '', fr: '', pt: '' },
      moderator: session.moderator || '',
      speakers: session.speakers || '',
      type: session.type || 'session',
      published: session.published !== false
    });
    setEditingSession(session);
    setView('session-form');
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm('Delete this session?')) {
      try {
        await remove(ref(database, `conferences/${selectedEvent.id}/sessions/${sessionId}`));
      } catch (error) {
        console.error('Error deleting session:', error);
        alert('Error deleting session');
      }
    }
  };

  const handleDuplicateSession = (session) => {
    setSessionForm({
      date: session.date || selectedEvent?.startDate || getTodayDate(),
      startTime: session.startTime || '09:00',
      endTime: session.endTime || '10:00',
      title: { 
        en: `${session.title?.en || ''} (copy)`,
        fr: session.title?.fr ? `${session.title.fr} (copie)` : '',
        pt: session.title?.pt ? `${session.title.pt} (cópia)` : ''
      },
      moderator: session.moderator || '',
      speakers: session.speakers || '',
      type: session.type || 'session',
      published: false
    });
    setEditingSession(null);
    setView('session-form');
  };

  const toggleSessionPublished = async (session) => {
    try {
      const sessionRef = ref(database, `conferences/${selectedEvent.id}/sessions/${session.id}`);
      await update(sessionRef, { published: !session.published });
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  // Stats
  const upcomingEvents = events.filter(e => !isEventPast(e)).length;
  const completedEvents = events.filter(e => isEventPast(e)).length;

  // Render Events List
  const renderEventsList = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Events</h2>
          <p className="text-gray-500 mt-1">Manage your conferences and schedules</p>
        </div>
        <button
          onClick={() => {
            resetEventForm();
            setView('event-form');
          }}
          className="flex items-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium shadow-lg shadow-violet-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Events</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{events.length}</p>
            </div>
            <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Upcoming</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{upcomingEvents}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completed</p>
              <p className="text-3xl font-bold text-gray-400 mt-1">{completedEvents}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-500 mb-6">Create your first event to get started</p>
          <button
            onClick={() => {
              resetEventForm();
              setView('event-form');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => {
            const isPast = isEventPast(event);
            const sessions = getSessionsForEvent(event);
            
            return (
              <div 
                key={event.id}
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${isPast ? 'opacity-70' : ''}`}
                onClick={() => {
                  setSelectedEvent(event);
                  setView('event-detail');
                }}
              >
                {/* Event Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {event.logo ? (
                        <img src={event.logo} alt="" className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {(event.name?.en || 'E')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{event.name?.en || 'Untitled'}</h3>
                        {event.subtitle?.en && (
                          <p className="text-sm text-gray-500 line-clamp-1">{event.subtitle.en}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {getDateRange(event.startDate, event.endDate)}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                    isPast 
                      ? 'bg-gray-200 text-gray-600' 
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isPast ? 'bg-gray-400' : 'bg-emerald-500'}`}></span>
                    {isPast ? 'Completed' : 'Upcoming'}
                  </span>
                  
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                    event.status === 'published' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {event.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  // Render Event Form (Step 1)
  const renderEventForm = () => (
    <>
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => {
            resetEventForm();
            setView('list');
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </h2>
          <p className="text-gray-500 mt-1">Step 1: Event details</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-2xl">
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Name <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">EN</span>
                  <span className="text-xs text-red-500">Required</span>
                </div>
                <input
                  type="text"
                  value={eventForm.name.en}
                  onChange={(e) => setEventForm(prev => ({
                    ...prev,
                    name: { ...prev.name, en: e.target.value }
                  }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="e.g., WAMECA 2025"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">FR</span>
                  <span className="text-xs text-gray-400">Optional</span>
                </div>
                <input
                  type="text"
                  value={eventForm.name.fr}
                  onChange={(e) => setEventForm(prev => ({
                    ...prev,
                    name: { ...prev.name, fr: e.target.value }
                  }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="French name (optional)"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">PT</span>
                  <span className="text-xs text-gray-400">Optional</span>
                </div>
                <input
                  type="text"
                  value={eventForm.name.pt}
                  onChange={(e) => setEventForm(prev => ({
                    ...prev,
                    name: { ...prev.name, pt: e.target.value }
                  }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Portuguese name (optional)"
                />
              </div>
            </div>
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtitle <span className="text-gray-400">(optional)</span>
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-8 text-center">EN</span>
                <input
                  type="text"
                  value={eventForm.subtitle.en}
                  onChange={(e) => setEventForm(prev => ({
                    ...prev,
                    subtitle: { ...prev.subtitle, en: e.target.value }
                  }))}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="e.g., Journalism and Digital Infrastructure in Africa"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-8 text-center">FR</span>
                <input
                  type="text"
                  value={eventForm.subtitle.fr}
                  onChange={(e) => setEventForm(prev => ({
                    ...prev,
                    subtitle: { ...prev.subtitle, fr: e.target.value }
                  }))}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="French subtitle"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-8 text-center">PT</span>
                <input
                  type="text"
                  value={eventForm.subtitle.pt}
                  onChange={(e) => setEventForm(prev => ({
                    ...prev,
                    subtitle: { ...prev.subtitle, pt: e.target.value }
                  }))}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Portuguese subtitle"
                />
              </div>
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo URL <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="url"
              value={eventForm.logo}
              onChange={(e) => setEventForm(prev => ({ ...prev, logo: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="https://example.com/logo.png"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={eventForm.startDate}
                onChange={(e) => setEventForm(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={eventForm.endDate}
                onChange={(e) => setEventForm(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                value={eventForm.type}
                onChange={(e) => setEventForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
              >
                <option value="conference">Conference</option>
                <option value="workshop">Workshop</option>
                <option value="seminar">Seminar</option>
                <option value="summit">Summit</option>
                <option value="forum">Forum</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={eventForm.status}
                onChange={(e) => setEventForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                resetEventForm();
                setView('list');
              }}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateEvent}
              className="flex-1 px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium shadow-lg shadow-violet-200"
            >
              {editingEvent ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // Render Event Detail (Step 2 - Sessions)
  const renderEventDetail = () => {
    if (!selectedEvent) return null;
    
    const sessions = getSessionsForEvent(selectedEvent);
    const sessionsByDate = getSessionsByDate(sessions);
    const dates = Object.keys(sessionsByDate).sort();
    const isPast = isEventPast(selectedEvent);

    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSelectedEvent(null);
                setView('list');
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              {selectedEvent.logo ? (
                <img src={selectedEvent.logo} alt="" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {(selectedEvent.name?.en || 'E')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedEvent.name?.en}</h2>
                <p className="text-gray-500">{getDateRange(selectedEvent.startDate, selectedEvent.endDate)}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isPast && (
              <>
                <button
                  onClick={() => handleEditEvent(selectedEvent)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </>
            )}
            {!isPast && (
              <button
                onClick={() => {
                  resetSessionForm();
                  setView('session-form');
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium shadow-lg shadow-violet-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Session
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
            <p className="text-gray-500 mb-6">Add sessions to build your event schedule</p>
            {!isPast && (
              <button
                onClick={() => {
                  resetSessionForm();
                  setView('session-form');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Session
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {dates.map(date => (
              <div key={date} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">{formatDisplayDate(date)}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {sessionsByDate[date].map(session => {
                    const sessionPast = isSessionPast(session);
                    
                    return (
                      <div key={session.id} className={`p-6 ${sessionPast ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-violet-100 text-violet-700">
                                {session.startTime} - {session.endTime}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                                session.type === 'break' 
                                  ? 'bg-amber-50 text-amber-700'
                                  : session.type === 'keynote'
                                  ? 'bg-purple-50 text-purple-700'
                                  : session.type === 'panel'
                                  ? 'bg-teal-50 text-teal-700'
                                  : session.type === 'workshop'
                                  ? 'bg-orange-50 text-orange-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}>
                                {session.type === 'break' ? 'Break' : 
                                 session.type === 'keynote' ? 'Keynote' :
                                 session.type === 'panel' ? 'Panel' :
                                 session.type === 'workshop' ? 'Workshop' : 'Session'}
                              </span>
                              {session.published ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                                  Published
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                  Draft
                                </span>
                              )}
                            </div>
                            <h4 className="text-lg font-medium text-gray-900 mb-1">
                              {session.title?.en || 'Untitled'}
                            </h4>
                            {session.title?.fr && (
                              <p className="text-sm text-gray-500">FR: {session.title.fr}</p>
                            )}
                            {session.title?.pt && (
                              <p className="text-sm text-gray-500">PT: {session.title.pt}</p>
                            )}
                            {(session.moderator || session.speakers) && (
                              <div className="mt-3 space-y-1 text-sm">
                                {session.moderator && (
                                  <p className="text-gray-600">
                                    <span className="font-medium text-orange-600">Moderator:</span> {session.moderator}
                                  </p>
                                )}
                                {session.speakers && (
                                  <p className="text-gray-600">
                                    <span className="font-medium text-teal-600">Speakers:</span> {session.speakers}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {!sessionPast && (
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditSession(session); }}
                                className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDuplicateSession(session); }}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Duplicate"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleSessionPublished(session); }}
                                className={`p-2 rounded-lg transition-colors ${
                                  session.published
                                    ? 'text-gray-500 hover:text-amber-600 hover:bg-amber-50'
                                    : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={session.published ? 'Unpublish' : 'Publish'}
                              >
                                {session.published ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                )}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  // Render Session Form
  const renderSessionForm = () => (
    <>
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => {
            resetSessionForm();
            setView('event-detail');
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {editingSession ? 'Edit Session' : 'Add New Session'}
          </h2>
          <p className="text-gray-500 mt-1">{selectedEvent?.name?.en}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-2xl">
        <div className="space-y-6">
          {/* Date & Time */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={sessionForm.date}
                min={selectedEvent?.startDate}
                max={selectedEvent?.endDate}
                onChange={(e) => setSessionForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={sessionForm.startTime}
                onChange={(e) => setSessionForm(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={sessionForm.endTime}
                onChange={(e) => setSessionForm(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
              <select
                value={sessionForm.type}
                onChange={(e) => setSessionForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
              >
                <option value="session">Session</option>
                <option value="break">Break</option>
                <option value="keynote">Keynote</option>
                <option value="panel">Panel Discussion</option>
                <option value="workshop">Workshop</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={sessionForm.published}
                onChange={(e) => setSessionForm(prev => ({ ...prev, published: e.target.value === 'true' }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
              >
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">EN</span>
                  <span className="text-xs text-red-500">Required</span>
                </div>
                <input
                  type="text"
                  value={sessionForm.title.en}
                  onChange={(e) => setSessionForm(prev => ({
                    ...prev,
                    title: { ...prev.title, en: e.target.value }
                  }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Session title in English"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">FR</span>
                  <span className="text-xs text-gray-400">Optional</span>
                </div>
                <input
                  type="text"
                  value={sessionForm.title.fr}
                  onChange={(e) => setSessionForm(prev => ({
                    ...prev,
                    title: { ...prev.title, fr: e.target.value }
                  }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="French title (optional)"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">PT</span>
                  <span className="text-xs text-gray-400">Optional</span>
                </div>
                <input
                  type="text"
                  value={sessionForm.title.pt}
                  onChange={(e) => setSessionForm(prev => ({
                    ...prev,
                    title: { ...prev.title, pt: e.target.value }
                  }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Portuguese title (optional)"
                />
              </div>
            </div>
          </div>

          {/* Moderator & Speakers (only for non-break sessions) */}
          {sessionForm.type !== 'break' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Moderator</label>
                <input
                  type="text"
                  value={sessionForm.moderator}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, moderator: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Moderator name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Speakers</label>
                <input
                  type="text"
                  value={sessionForm.speakers}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, speakers: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Speaker names (comma separated)"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                resetSessionForm();
                setView('event-detail');
              }}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateSession}
              className="flex-1 px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium shadow-lg shadow-violet-200"
            >
              {editingSession ? 'Update Session' : 'Add Session'}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Event Manager</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <button 
              onClick={() => {
                setSelectedEvent(null);
                setView('list');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                view === 'list' ? 'bg-violet-50 text-violet-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Events
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {view === 'list' && renderEventsList()}
        {view === 'event-form' && renderEventForm()}
        {view === 'event-detail' && renderEventDetail()}
        {view === 'session-form' && renderSessionForm()}
      </main>
    </div>
  );
}

export default AdminPanel;