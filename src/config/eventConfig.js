// Configuration de l'événement WAMECA
const eventConfig = {
    // Identité de l'événement
    event: {
        name: "WAMECA",
        subtitle: {
            en: "Journalism and Digital Public Infrastructure in Africa",
            fr: "Journalisme et infrastructures publiques numériques en Afrique",
            pt: "Jornalismo e Infraestruturas Públicas Digitais em África"
        },
        edition: "2025",
        logo: null // optionnel
    },

    // Langues disponibles
    languages: {
        default: "en",
        available: ["en", "fr", "pt"]
    },

    // Types d'événements configurables
    eventTypes: [
        {
            id: "session",
            label: {
                en: "Session (with speakers)",
                fr: "Session (avec intervenants)",
                pt: "Sessão (com palestrantes)"
            },
            color: "#d4c1ec",
            dotColor: "rgb(212, 193, 236)",
            hasModeratorField: true,
            hasSpeakersField: true
        },
        {
            id: "break",
            label: {
                en: "Break (Lunch, Coffee, etc.)",
                fr: "Pause (Déjeuner, Café, etc.)",
                pt: "Intervalo (Almoço, Café, etc.)"
            },
            color: "#f3e8ff",
            dotColor: "#c9a9e0",
            hasModeratorField: false,
            hasSpeakersField: false
        }
    ],

    // Réseaux sociaux
    social: {
        enabled: true,
        links: [
            { platform: "facebook", url: "https://facebook.com/wameca", icon: "facebook" },
            { platform: "instagram", url: "https://instagram.com/wameca", icon: "instagram" },
            { platform: "twitter", url: "https://twitter.com/wameca", icon: "twitter" }
        ]
    },

    // Thème visuel
    theme: {
        colors: {
            primary: "#9f9fed",
            secondary: "#8b9dc3",
            accent: "#e9967a",
            speakersAccent: "#5f9ea0",
            background: "#ffffff",
            cardBackground: "#ffffff",
            dateMarkerBg: "rgb(242, 223, 215)"
        },
        typography: {
            fontFamily: "Georgia, serif",
            titleSize: "2.5rem",
            titleSizeMobile: "2rem"
        },
        layout: {
            maxWidth: "960px"
        }
    },
    logo: {
        url: "https://wameca.mfwa.org/wp-content/uploads/2017/07/wmc-logo.png", // ou "/logo.png" si local
        alt: "WAMECA Logo",
        width: 150
    }
};

export default eventConfig;