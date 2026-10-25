import React, { createContext, useContext, useState, ReactNode } from 'react';
import { apiClient } from '../services/apiClient';

interface ApiConfigContextType {
  isMockMode: boolean;
  apiBaseUrl: string;
  setMockMode: (enabled: boolean) => void;
  setApiBaseUrl: (url: string) => void;
  resetMockData: () => void;
  testBackendConnection: () => Promise<{ ok: boolean; message: string }>;
  isApiGuideOpen: boolean;
  openApiGuide: () => void;
  closeApiGuide: () => void;
}

const ApiConfigContext = createContext<ApiConfigContextType | undefined>(undefined);

export const ApiConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMockMode, setIsMockModeState] = useState<boolean>(apiClient.isMock());
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(apiClient.getBaseUrl());
  const [isApiGuideOpen, setIsApiGuideOpen] = useState<boolean>(false);

  const setMockMode = (enabled: boolean) => {
    apiClient.setMockMode(enabled);
    setIsMockModeState(enabled);
  };

  const setApiBaseUrl = (url: string) => {
    apiClient.setBaseUrl(url);
    setApiBaseUrlState(url);
  };

  const resetMockData = () => {
    apiClient.resetMockData();
  };

  const testBackendConnection = async (): Promise<{ ok: boolean; message: string }> => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/dashboard/summary`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        return { ok: true, message: `Connected successfully to Spring Boot at ${apiBaseUrl}!` };
      }
      return { ok: false, message: `Spring Boot responded with HTTP status ${response.status}.` };
    } catch (err: any) {
      return {
        ok: false,
        message: `Connection failed: Backend not reachable at ${apiBaseUrl}. Ensure Spring Boot application is running on port 8080.`,
      };
    }
  };

  const openApiGuide = () => setIsApiGuideOpen(true);
  const closeApiGuide = () => setIsApiGuideOpen(false);

  return (
    <ApiConfigContext.Provider
      value={{
        isMockMode,
        apiBaseUrl,
        setMockMode,
        setApiBaseUrl,
        resetMockData,
        testBackendConnection,
        isApiGuideOpen,
        openApiGuide,
        closeApiGuide,
      }}
    >
      {children}
    </ApiConfigContext.Provider>
  );
};

export const useApiConfig = (): ApiConfigContextType => {
  const context = useContext(ApiConfigContext);
  if (!context) {
    throw new Error('useApiConfig must be used within an ApiConfigProvider');
  }
  return context;
};
