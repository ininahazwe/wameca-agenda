import { useState } from 'react';
import { useConfig } from '../contexts/ConfigContext';

export const useTranslation = () => {
    const config = useConfig();
    const [language, setLanguage] = useState(config.languages.default);

    // Traductions statiques
    const staticTranslations = config.translations[language];

    // Traductions dynamiques depuis config.event
    const dynamicTranslations = {
        title: config.event.name,
        subtitle: config.event.subtitle[language] || config.event.subtitle[config.languages.default],
        edition: `— ${config.event.edition} ${language === 'en' ? 'Edition' : language === 'fr' ? 'Édition' : 'Edição'}`
    };

    // Fusionner les traductions statiques et dynamiques
    const t = {
        ...staticTranslations,
        ...dynamicTranslations
    };

    const changeLanguage = (lang) => {
        if (config.languages.available.includes(lang)) {
            setLanguage(lang);
        }
    };

    return {
        t,
        language,
        changeLanguage,
        availableLanguages: config.languages.available
    };
};

export default useTranslation;