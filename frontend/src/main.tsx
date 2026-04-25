import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { LanguageProvider } from './context/LanguageContext';

// Default to dark mode is now handled by store initialization


// Suppress noisy browser violations and Vite HMR logs
if (typeof window !== 'undefined') {
  const silentStrings = ['[Violation]', '[vite] connected', '[vite] connecting', 'dev-server-test'];
  const originalConsole = { ...console };

  ['log', 'debug', 'warn', 'info'].forEach((method) => {
    (console as any)[method] = (...args: any[]) => {
      const msg = args[0]?.toString() || '';
      if (silentStrings.some(s => msg.includes(s))) return;
      (originalConsole as any)[method].apply(console, args);
    };
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </QueryClientProvider>
  </StrictMode>,
);
