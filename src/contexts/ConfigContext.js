import React, { createContext, useContext } from 'react';
import eventConfig from '../config/eventConfig';
import translations from '../config/translations';

const ConfigContext = createContext(null);

export const ConfigProvider = ({ children }) => {
    const config = {
        ...eventConfig,
        translations
    };

    return (
        <ConfigContext.Provider value={config}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within ConfigProvider');
    }
    return context;
};

export default ConfigContext;