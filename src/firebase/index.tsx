'use client';

import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { createContext, useContext, ReactNode, useMemo } from 'react';
import { FirebaseClientProvider } from './client-provider';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function initializeFirebase() {
  if (getApps().length) {
    return getApp();
  }
  const configForInit = { ...firebaseConfig };
  if (!configForInit.databaseURL || !configForInit.databaseURL.startsWith('https://')) {
    delete (configForInit as Partial<typeof configForInit>).databaseURL;
  }
  return initializeApp(configForInit);
}

interface FirebaseContextType {
    app: FirebaseApp | null;
    db: Database | null;
    auth: Auth | null;
    googleProvider: GoogleAuthProvider | null;
}

const FirebaseContext = createContext<FirebaseContextType>({ app: null, db: null, auth: null, googleProvider: null });

export const FirebaseProvider = ({ children }: { children: ReactNode}) => {
    const app = useMemo(() => initializeFirebase(), []);
    const db = useMemo(() => {
        if (app && firebaseConfig.databaseURL && firebaseConfig.databaseURL.startsWith('https://')) {
            try {
                return getDatabase(app);
            } catch (error) {
                console.error("Firebase Database initialization failed:", error);
                return null;
            }
        }
        return null;
    }, [app]);
    const auth = useMemo(() => getAuth(app), [app]);
    const googleProvider = useMemo(() => new GoogleAuthProvider(), []);

    return (
        <FirebaseContext.Provider value={{ app, db, auth, googleProvider }}>
            {children}
        </FirebaseContext.Provider>
    )
}

export const useFirebase = () => {
    return useContext(FirebaseContext);
}

export { FirebaseClientProvider };
