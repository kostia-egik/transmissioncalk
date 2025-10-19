import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import Workbench from './pages/Workbench';

const App: React.FC = () => {
    const [path, setPath] = useState(window.location.pathname);

    useEffect(() => {
        const handlePopState = () => {
            setPath(window.location.pathname);
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const navigate = (newPath: string) => {
        if (window.location.pathname !== newPath) {
            window.history.pushState({}, '', newPath);
        }
        setPath(newPath);
    };

    const navigateToWorkbench = () => {
        navigate('/workbench');
    };

    const navigateToHome = () => {
        navigate('/');
    };

    if (path.startsWith('/workbench') || path.startsWith('/scheme')) {
        return <Workbench onNavigateToHome={navigateToHome} navigate={navigate} currentPath={path} />;
    }

    return <LandingPage onNavigateToWorkbench={navigateToWorkbench} />;
};

export default App;
