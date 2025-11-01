import React, { createContext, useContext, useEffect, useState } from 'react';
// FIX: Обновляем импорты Firebase для использования v9 compat-библиотек, чтобы исправить ошибку отсутствия 'default' экспорта.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth } from '../firebase';

interface AuthContextType {
  // FIX: Update User type to use the v8-compatible type from the 'firebase' namespace.
  user: firebase.User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // FIX: Update User type to use the v8-compatible type from the 'firebase' namespace.
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // FIX: Use the onAuthStateChanged method from the auth instance, which is the v8-compatible API.
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    // FIX: Use the v8-compatible API for GoogleAuthProvider and signInWithPopup.
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
    } catch (error) {
      console.error("Ошибка входа через Google:", error);
    }
  };

  const signOut = async () => {
    try {
      // FIX: Use the signOut method from the auth instance, which is the v8-compatible API.
      await auth.signOut();
    } catch (error) {
      console.error("Ошибка выхода:", error);
    }
  };

  const value = { user, loading, signInWithGoogle, signOut };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};