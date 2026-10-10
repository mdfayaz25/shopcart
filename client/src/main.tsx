import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { store } from './store';
import { DemoBanner } from './demo/DemoBanner';
import { IS_DEMO } from './demo/kernel';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthProvider>
            {IS_DEMO && <DemoBanner repo="shopcart" onReset={async () => { const { store: demo } = await import('./demo/server'); demo.reset(); localStorage.removeItem('shopcart.cart'); localStorage.removeItem('shopcart.token'); location.reload(); }} />}
            <App />
            <Toaster position="bottom-center" richColors closeButton toastOptions={{ style: { borderRadius: 14 } }} />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
);
