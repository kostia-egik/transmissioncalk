import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface NetworkContextType {
  isOnline: boolean;
}

const NetworkContext = createContext<NetworkContextType>({ isOnline: true });

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetworkStatus = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetworkStatus must be used within a NetworkProvider');
  }
  return context;
};
