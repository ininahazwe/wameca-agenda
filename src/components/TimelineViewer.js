import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';

function TimelineViewer() {
  const { t, language } = useLanguage();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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

    // Détection du redimensionnement
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);

    // Nettoyage
    return () => {
      unsubscribe();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fonction pour formater la date selon la langue
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const localeMap = {
      en: 'en-US',
      fr: 'fr-FR',
      pt: 'pt-PT'
    };
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(localeMap[language] || 'fr-FR', options);
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

  // Fonction pour obtenir le texte dans la langue appropriée
  const getLocalizedText = (textObj) => {
    if (!textObj) return '';
    
    // Si c'est un objet avec des traductions
    if (typeof textObj === 'object' && textObj !== null) {
      return textObj[language] || textObj.fr || textObj.en || textObj.pt || '';
    }
    
    // Si c'est juste une chaîne
    return textObj;
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
          <div style={{ background: 'rgb(253 253 253)' }}></div>
          <div style={{ background: 'rgb(253 253 253)' }}></div>
          <div style={{ background: 'rgb(253 253 253)' }}></div>
          <div style={{ background: 'rgb(253 253 253)' }}></div>
          <div style={{ background: 'rgb(253 253 253)' }}></div>
        </div>
        <div style={{ fontSize: '1.125rem', color: '#666', position: 'relative', zIndex: 1 }}>
          {t('loading')}
        </div>
      </div>
    );
  }

  const groupedEvents = groupEventsByDate(events);
  const dates = Object.keys(groupedEvents).sort();

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: isMobile ? '2rem 1rem' : '3rem 1rem',
      backgroundColor: '#ffffff',
      position: 'relative'
    }}>
      {/* Sélecteur de langue */}
      <div style={{ 
        position: 'fixed', 
        top: '1rem', 
        right: '1rem', 
        zIndex: 1000 
      }}>
        <LanguageSelector />
      </div>

      {/* Grille de fond */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        display: isMobile ? 'none' : 'grid',
        gridTemplateColumns: '16vw 16vw 16vw 16vw 16vw',
        gridColumnGap: '5vw',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0
      }}>
        <div style={{ background: 'rgb(253 253 253)' }}></div>
        <div style={{ background: 'rgb(253 253 253)' }}></div>
        <div style={{ background: 'rgb(253 253 253)' }}></div>
        <div style={{ background: 'rgb(253 253 253)' }}></div>
        <div style={{ background: 'rgb(253 253 253)' }}></div> 
      </div>

      <div style={{ 
        maxWidth: '960px', 
        margin: '0 auto', 
        position: 'relative', 
        zIndex: 1,
        paddingLeft: isMobile ? '0' : '0'
      }}>
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '3rem' }}>
          <h1 style={{ 
            fontSize: isMobile ? '2rem' : '2.5rem', 
            fontWeight: 'bold', 
            marginBottom: '0.5rem',
            color: '#1a1a1a',
            fontFamily: 'Georgia, serif'
          }}>
            {t('title')}
          </h1>
          <p style={{ 
            fontSize: isMobile ? '0.875rem' : '1rem', 
            color: '#666',
            marginBottom: '0.25rem',
            padding: isMobile ? '0 1rem' : '0'
          }}>
            {t('subtitle')}
          </p>
          <p style={{ 
            fontSize: '0.875rem', 
            color: '#999'
          }}>
            — {t('edition')}
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
            {t('noEventsScheduled')}
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Ligne verticale */}
            <div style={{ 
              position: 'absolute',
              left: isMobile ? '0.5rem' : '0',
              top: '0',
              bottom: '0',
              width: '3px',
              backgroundColor: 'rgb(159, 159, 237)',
              marginLeft: isMobile ? '0' : '1.3rem'
            }}></div>

            {/* Événements groupés par date */}
            {dates.map((date) => (
              <div key={date} style={{ marginBottom: '2rem' }}>
                {/* Marqueur de date */}
                <div style={{ position: 'relative', marginBottom: isMobile ? '1.5rem' : '2rem' }}>
                  <div style={{ 
                    position: 'absolute',
                    left: isMobile ? '0' : '0',
                    width: isMobile ? '2rem' : '2.5rem',
                    height: isMobile ? '2rem' : '2.5rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgb(159, 159, 237)',
                    marginLeft: isMobile ? '0' : '0.15rem'
                  }}>
                    <svg 
                      style={{ 
                        width: isMobile ? '1rem' : '1.25rem', 
                        height: isMobile ? '1rem' : '1.25rem', 
                        color: 'white' 
                      }}
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
                    marginLeft: isMobile ? '3rem' : '4.5rem',
                    backgroundColor: 'rgb(242, 223, 215)',
                    borderRadius: '8px',
                    padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
                    borderLeft: '4px solid #8b9dc3'
                  }}>
                    <h2 style={{ 
                      fontSize: isMobile ? '0.875rem' : '1.125rem', 
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.5rem' }}>
                  {groupedEvents[date].map((event) => (
                    <div key={event.id} style={{ position: 'relative' }}>
                      {/* Point sur la ligne */}
                      <div style={{ 
                        position: 'absolute',
                        left: isMobile ? '0.25rem' : '0',
                        width: isMobile ? '0.75rem' : '1rem',
                        height: isMobile ? '0.75rem' : '1rem',
                        borderRadius: '50%',
                        backgroundColor: event.type === 'break' ? '#c9a9e0' : 'rgb(212, 193, 236)',
                        marginLeft: isMobile ? '0' : '0.9rem',
                        marginTop: isMobile ? '0.5rem' : '0.5rem'
                      }}></div>

                      {/* Conteneur événement */}
                      <div style={{ 
                        marginLeft: isMobile ? '3rem' : '4.5rem',
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? '0.5rem' : '1rem',
                        alignItems: isMobile ? 'stretch' : 'flex-start'
                      }}>
                        {/* Timestamp */}
                        <div style={{
                          flexShrink: 0,
                          minWidth: isMobile ? 'auto' : '120px',
                          paddingTop: isMobile ? '0' : '0.5rem'
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
                          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                          boxShadow: '0px 17px 39px -8px rgba(0,0,0,0.1)'
                        }}>
                          {/* Titre */}
                          <h3 style={{ 
                            fontSize: isMobile ? '0.9375rem' : '1rem', 
                            fontWeight: '500',
                            marginBottom: '0.75rem',
                            color: 'rgb(85 85 85)',
                            margin: '0 0 0.75rem 0'
                          }}>
                            {getLocalizedText(event.title)}
                          </h3>

                          {/* Détails pour les sessions */}
                          {event.type === 'session' && (event.moderator || event.speakers) && (
                            <div style={{ 
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem',
                              fontSize: isMobile ? '0.8125rem' : '0.875rem',
                              color: '#555'
                            }}>
                              {event.moderator && (
                                <p style={{ margin: 0 }}>
                                  <span style={{ fontWeight: '600', color: '#e9967a', borderBottom: '1px solid #e9967a'}}>
                                    {t('moderator')}:
                                  </span>{' '}
                                  {getLocalizedText(event.moderator)}
                                </p>
                              )}
                              {event.speakers && (
                                <p style={{ margin: 0 }}>
                                  <span style={{ fontWeight: '600', color: '#5f9ea0', borderBottom: '1px solid #5f9ea0'}}>
                                    {t('speakers')}:
                                  </span>{' '}
                                  {getLocalizedText(event.speakers)}
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
                                ☕ {t('breakBadge')}
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