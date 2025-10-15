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

let firebaseApp: FirebaseApp;
let auth: Auth;
let db: Database | null = null;
let googleProvider: GoogleAuthProvider;

function initializeFirebase() {
  if (typeof window !== 'undefined') {
    if (!firebaseApp) {
      if (getApps().length > 0) {
        firebaseApp = getApp();
      } else {
        const configForInit = { ...firebaseConfig };
        if (!configForInit.databaseURL || !configForInit.databaseURL.startsWith('https://')) {
          delete (configForInit as Partial<typeof configForInit>).databaseURL;
        }
        firebaseApp = initializeApp(configForInit);
      }
      auth = getAuth(firebaseApp);
      if (firebaseConfig.databaseURL && firebaseConfig.databaseURL.startsWith('https://')) {
        db = getDatabase(firebaseApp);
      }
      googleProvider = new GoogleAuthProvider();
    }
  }
}

initializeFirebase();


interface FirebaseContextType {
    app: FirebaseApp | null;
    db: Database | null;
    auth: Auth | null;
    googleProvider: GoogleAuthProvider | null;
}

const FirebaseContext = createContext<FirebaseContextType>({ app: null, db: null, auth: null, googleProvider: null });

export const FirebaseProvider = ({ children }: { children: ReactNode}) => {
    
    const contextValue = {
        app: firebaseApp || null,
        db: db || null,
        auth: auth || null,
        googleProvider: googleProvider || null,
    };

    return (
        <FirebaseContext.Provider value={contextValue}>
            {children}
        </FirebaseContext.Provider>
    )
}

export const useFirebase = () => {
    return useContext(FirebaseContext);
}

export { FirebaseClientProvider };
