import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';

function TimelineViewer() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const eventsRef = ref(database, 'events');
    
    // Écoute en temps réel des changements
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        // Convertir l'objet en tableau
        const eventsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        // Filtrer uniquement les événements publiés
        const publishedEvents = eventsArray.filter(event => event.published !== false);
        
        // Trier par date puis par heure de début
        publishedEvents.sort((a, b) => {
          if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
          }
          return a.startTime.localeCompare(b.startTime);
        });
        
        setEvents(publishedEvents);
      } else {
        setEvents([]);
      }
      
      setLoading(false);
    });

    // Nettoyage de l'écouteur
    return () => unsubscribe();
  }, []);

  // Fonction pour formater la date en français
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };

  // Grouper les événements par date
  const groupEventsByDate = (events) => {
    const grouped = {};
    events.forEach(event => {
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }
      grouped[event.date].push(event);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        position: 'relative'
      }}>
        {/* Grille de fond */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          display: 'grid',
          gridTemplateColumns: '16vw 16vw 16vw 16vw 16vw',
          gridColumnGap: '5vw',
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 0
        }}>
          <div style={{ background: '#f9f9f9' }}></div>
          <div style={{ background: '#f9f9f9' }}></div>
          <div style={{ background: '#f9f9f9' }}></div>
          <div style={{ background: '#f9f9f9' }}></div>
          <div style={{ background: '#f9f9f9' }}></div>
        </div>
        <div style={{ fontSize: '1.125rem', color: '#666', position: 'relative', zIndex: 1 }}>
          Chargement de la timeline...
        </div>
      </div>
    );
  }

  const groupedEvents = groupEventsByDate(events);
  const dates = Object.keys(groupedEvents).sort();

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '3rem 1rem',
      backgroundColor: '#ffffff',
      position: 'relative'
    }}>
      {/* Grille de fond */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        display: 'grid',
        gridTemplateColumns: '16vw 16vw 16vw 16vw 16vw',
        gridColumnGap: '5vw',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0
      }}>
        {/* <div style={{ background: '#f9f9f9' }}></div>
        <div style={{ background: '#f9f9f9' }}></div>
        <div style={{ background: '#f9f9f9' }}></div>
        <div style={{ background: '#f9f9f9' }}></div>
        <div style={{ background: '#f9f9f9' }}></div> */}
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            marginBottom: '0.5rem',
            color: '#1a1a1a',
            fontFamily: 'Georgia, serif'
          }}>
            WAMECA
          </h1>
          <p style={{ 
            fontSize: '1rem', 
            color: '#666',
            marginBottom: '0.25rem'
          }}>
            Journalism and Digital Public Infrastructure in Africa
          </p>
          <p style={{ 
            fontSize: '0.875rem', 
            color: '#999'
          }}>
            — 2025 Edition
          </p>
        </div>

        {events.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
            color: '#999',
            fontSize: '0.875rem'
          }}>
            Aucun événement programmé pour le moment
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Ligne verticale */}
            <div style={{ 
              position: 'absolute',
              left: '0',
              top: '0',
              bottom: '0',
              width: '3px',
              backgroundColor: 'rgb(159, 159, 237)',
              marginLeft: '1.3rem'
            }}></div>

            {/* Événements groupés par date */}
            {dates.map((date) => (
              <div key={date} style={{ marginBottom: '2rem' }}>
                {/* Marqueur de date */}
                <div style={{ position: 'relative', marginBottom: '2rem' }}>
                  <div style={{ 
                    position: 'absolute',
                    left: '0',
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgb(159, 159, 237)',
                    marginLeft: '0.15rem'
                  }}>
                    <svg 
                      style={{ width: '1.25rem', height: '1.25rem', color: 'white' }}
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </div>
                  <div style={{
                    marginLeft: '4.5rem',
                    backgroundColor: 'rgb(242, 223, 215)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    borderLeft: '4px solid #8b9dc3'
                  }}>
                    <h2 style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: 'bold',
                      color: '#1a1a1a',
                      textTransform: 'capitalize',
                      margin: 0
                    }}>
                      {formatDate(date)}
                    </h2>
                  </div>
                </div>

                {/* Événements de cette date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {groupedEvents[date].map((event) => (
                    <div key={event.id} style={{ position: 'relative' }}>
                      {/* Point sur la ligne */}
                      <div style={{ 
                        position: 'absolute',
                        left: '0',
                        width: '1rem',
                        height: '1rem',
                        borderRadius: '50%',
                        backgroundColor: event.type === 'break' ? '#c9a9e0' : 'rgb(212, 193, 236)',
                        marginLeft: '0.9rem',
                        marginTop: '0.5rem'
                      }}></div>

                      {/* Conteneur événement */}
                      <div style={{ 
                        marginLeft: '4.5rem',
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'flex-start'
                      }}>
                        {/* Timestamp */}
                        <div style={{
                          flexShrink: 0,
                          minWidth: '120px',
                          paddingTop: '0.5rem'
                        }}>
                          <div style={{
                            display: 'inline-block',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: event.type === 'break' ? '#f3e8ff' : '#d4c1ec',
                            color: event.type === 'break' ? '#7c3aed' : '#0c0c0c'
                          }}>
                            {event.startTime} - {event.endTime}
                          </div>
                        </div>

                        {/* Carte d'événement */}
                        <div style={{
                          flex: 1,
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          padding: '1rem 1.25rem',
                          boxShadow: '0px 17px 39px -8px rgba(0,0,0,0.1)',
                          // borderLeft: event.type === 'break' ? '4px solid #c9a9e0' : '4px solid #8b9dc3'
                        }}>
                          {/* Titre */}
                          <h3 style={{ 
                            fontSize: '1rem', 
                            fontWeight: 'bold',
                            marginBottom: '0.75rem',
                            color: '#1a1a1a',
                            margin: '0 0 0.75rem 0'
                          }}>
                            {event.title}
                          </h3>

                          {/* Détails pour les sessions */}
                          {event.type === 'session' && (event.moderator || event.speakers) && (
                            <div style={{ 
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem',
                              fontSize: '0.875rem',
                              color: '#555'
                            }}>
                              {event.moderator && (
                                <p style={{ margin: 0 }}>
                                  <span style={{ fontWeight: '600', color: '#e9967a', borderBottom: '1px solid #e9967a'}}>
                                    Modérateur:
                                  </span>{' '}
                                  {event.moderator}
                                </p>
                              )}
                              {event.speakers && (
                                <p style={{ margin: 0 }}>
                                  <span style={{ fontWeight: '600', color: '#5f9ea0', borderBottom: '1px solid #5f9ea0'}}>
                                    Intervenants:
                                  </span>{' '}
                                  {event.speakers}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Badge pour les pauses */}
                          {event.type === 'break' && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                backgroundColor: '#f3e8ff',
                                color: '#7c3aed'
                              }}>
                                ☕ Pause
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TimelineViewer;