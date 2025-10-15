'use client';

import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { createContext, useContext, ReactNode, useMemo } from 'react';

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
    const app = getApp();
    return app;
  }
  const app = initializeApp(firebaseConfig);
  return app;
}

interface FirebaseContextType {
    app: FirebaseApp | null;
    db: Database | null;
}

const FirebaseContext = createContext<FirebaseContextType>({ app: null, db: null });

export const FirebaseProvider = ({ children }: { children: ReactNode}) => {
    const app = useMemo(() => initializeFirebase(), []);
    const db = useMemo(() => {
        if (app && firebaseConfig.databaseURL) {
            try {
                return getDatabase(app);
            } catch (error) {
                console.error("Firebase Database initialization failed:", error);
                return null;
            }
        }
        return null;
    }, [app]);

    return (
        <FirebaseContext.Provider value={{ app, db }}>
            {children}
        </FirebaseContext.Provider>
    )
}

export const useFirebase = () => {
    return useContext(FirebaseContext);
}