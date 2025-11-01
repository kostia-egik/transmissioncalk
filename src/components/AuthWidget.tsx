import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from './Button';
import { useNetworkStatus } from '../contexts/NetworkContext';
import { useLanguage } from '../contexts/LanguageContext';

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const SignInIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
);


interface AuthWidgetProps {
    displayMode?: 'full' | 'icon';
}

export const AuthWidget: React.FC<AuthWidgetProps> = ({ displayMode = 'full' }) => {
    const { user, signInWithGoogle, signOut } = useAuth();
    const { isOnline } = useNetworkStatus();
    const { t } = useLanguage();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const offlineTitle = t('project_modal_offline_tooltip');

    if (!user) {
        if (displayMode === 'icon') {
            return (
                <button
                    onClick={signInWithGoogle}
                    disabled={!isOnline}
                    className="p-2 bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-300 rounded-full shadow-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                    title={isOnline ? t('auth_widget_signin_icon_tooltip') : offlineTitle}
                    aria-label={t('auth_widget_signin_aria_label')}
                >
                    <SignInIcon />
                </button>
            );
        }
        return (
            <Button onClick={signInWithGoogle} variant="secondary" className="!px-4 !py-2 text-sm shadow-md shadow-slate-900/40 h-10" disabled={!isOnline} title={isOnline ? t('auth_widget_signin_tooltip') : offlineTitle}>
                {t('auth_widget_signin_button')}
            </Button>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title={t('auth_widget_profile_tooltip')}
            >
                {user.photoURL ? (
                    <img src={user.photoURL} alt={t('auth_widget_avatar_alt')} className="w-full h-full rounded-full" />
                ) : (
                    <UserIcon />
                )}
            </button>
            {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-60 bg-white rounded-md shadow-lg border z-40 animate-fade-in">
                    <div className="p-4 border-b">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user.displayName || t('auth_widget_user_placeholder')}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                        <button
                            onClick={signOut}
                            disabled={!isOnline}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 rounded-md hover:bg-slate-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                            title={isOnline ? "" : offlineTitle}
                        >
                            {t('auth_widget_signout_button')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};