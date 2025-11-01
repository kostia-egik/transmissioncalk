import React, { useState, useEffect, Suspense, lazy } from 'react';
import LandingPage from './pages/LandingPage';
import { useLanguage } from './contexts/LanguageContext';

const Workbench = lazy(() => import('./pages/Workbench'));

const App: React.FC = () => {
    const [path, setPath] = useState(window.location.pathname);
    const { t } = useLanguage();

    useEffect(() => {
        // Update title and preloader text on language change
        document.title = t('app_title');
        const preloaderText = document.querySelector('.preloader-text');
        if (preloaderText) {
            preloaderText.textContent = t('preloader_text');
        }
    }, [t]);


    useEffect(() => {
        const handlePopState = () => {
            setPath(window.location.pathname);
        };

        window.addEventListener('popstate', handlePopState);

        // Custom navigation event
        const handleNavigate = (e: Event) => {
            const { detail } = e as CustomEvent;
            if (window.location.pathname !== detail.path) {
                window.history.pushState({}, '', detail.path);
            }
            setPath(detail.path);
        };

        window.addEventListener('navigate', handleNavigate);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('navigate', handleNavigate);
        };
    }, []);

    useEffect(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('preloader-hidden');
            setTimeout(() => {
                if (preloader) {
                    preloader.style.display = 'none';
                }
            }, 500);
        }
    }, []);

    const navigate = (newPath: string) => {
        window.dispatchEvent(new CustomEvent('navigate', { detail: { path: newPath } }));
    };

    const navigateToWorkbench = () => {
        navigate('/workbench');
    };

    const navigateToHome = () => {
        navigate('/');
    };
    
    const LoadingFallback = () => (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999998,
        backgroundColor: '#e2e8f0',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2' stroke='%2394a3b8' stroke-opacity='0.4' stroke-width='0.5'/%3E%3C/svg%3E")`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: '#4a5568',
            fontFamily: 'Calibri, sans-serif'
          }}>
            {t('preloader_text')}
          </p>
        </div>
      </div>
    );

    if (path.startsWith('/workbench') || path.startsWith('/scheme')) {
        return (
            <Suspense fallback={<LoadingFallback />}>
                <Workbench onNavigateToHome={navigateToHome} navigate={navigate} currentPath={path} />
            </Suspense>
        );
    }

    return <LandingPage onNavigateToWorkbench={navigateToWorkbench} />;
};

export default App;