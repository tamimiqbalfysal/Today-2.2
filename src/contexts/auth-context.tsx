
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot, getDoc, runTransaction } from 'firebase/firestore';
import type { User as AppUser } from '@/lib/types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password:string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (name: string, username: string, email: string, password: string, country: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
          setLoading(true);
          if (doc.exists()) {
            const firestoreData = doc.data();
            setUser({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firestoreData.name,
              username: firestoreData.username,
              email: firebaseUser.email || firestoreData.email,
              photoURL: firebaseUser.photoURL || firestoreData.photoURL,
              redeemedGiftCodes: firestoreData.redeemedGiftCodes || 0,
              redeemedThinkCodes: firestoreData.redeemedThinkCodes || 0,
              paymentCategory: firestoreData.paymentCategory,
              paymentAccountName: firestoreData.paymentAccountName,
              paymentAccountNumber: firestoreData.paymentAccountNumber,
              paymentNotes: firestoreData.paymentNotes,
              country: firestoreData.country,
            });
          } else {
            setUser({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Anonymous',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL,
              redeemedGiftCodes: 0,
              redeemedThinkCodes: 0,
            });
          }
          setLoading(false);
        }, (error) => {
            console.error("Error fetching user document:", error);
            setLoading(false);
        });

        return () => unsubscribeFirestore();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    if (!auth) {
        const error = new Error("Firebase is not configured. Please add your Firebase project configuration to a .env file.");
        (error as any).code = 'auth/firebase-not-configured';
        throw error;
    }
    await signInWithEmailAndPassword(auth, email, password);
    router.push('/');
  };

  const signup = async (name: string, username: string, email: string, password: string, country: string) => {
    if (!auth || !db) {
        const error = new Error("Firebase is not configured. Please add your Firebase project configuration to a .env file.");
        (error as any).code = 'auth/firebase-not-configured';
        throw error;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const photoURL = `https://placehold.co/100x100.png?text=${name.charAt(0)}`;
    
    await updateProfile(firebaseUser, { 
      displayName: name,
      photoURL: photoURL
    });

    try {
        await runTransaction(db, async (transaction) => {
            const lowerCaseUsername = username.toLowerCase();
            const usernameDocRef = doc(db, "usernames", lowerCaseUsername);
            const usernameDoc = await transaction.get(usernameDocRef);

            if (usernameDoc.exists()) {
                throw new Error("Username is already taken.");
            }
            
            const userDocRef = doc(db, "users", firebaseUser.uid);
            transaction.set(userDocRef, {
                uid: firebaseUser.uid,
                name: name,
                username: lowerCaseUsername,
                email: email,
                photoURL: photoURL,
                country: country,
                redeemedGiftCodes: 0,
                redeemedThinkCodes: 0,
            });
            transaction.set(usernameDocRef, { uid: firebaseUser.uid });
        });
    } catch (error: any) {
        console.error("CRITICAL: Failed to create user documents in transaction. Original error:", error);
        await deleteUser(firebaseUser).catch(deleteError => {
            console.error("CRITICAL: Failed to roll back user creation. Manual cleanup required for user:", firebaseUser.uid, deleteError);
        });

        if (error.message === "Username is already taken.") {
             const newError = new Error(error.message);
             (newError as any).code = 'auth/username-already-in-use';
             throw newError;
        } else {
            const newError = new Error("Your account was created, but we failed to save your profile. Please check your Firestore security rules to allow writes to the 'users' and 'usernames' collections.");
            (newError as any).code = 'auth/firestore-setup-failed';
            throw newError;
        }
    }
    
    router.push('/');
  };

  const logout = async () => {
    if (!auth) {
      setUser(null);
      router.push('/login');
      return;
    };
    await signOut(auth);
    router.push('/login');
  };

  const deleteAccount = async (password: string) => {
    const currentUser = auth?.currentUser;
    const currentUserData = user;
    if (!auth || !currentUser || !db || !currentUserData) {
      throw new Error("User not found or Firebase not configured.");
    }
    
    try {
      if (!currentUser.email) {
        throw new Error("Cannot re-authenticate user without an email address.");
      }
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);

      await runTransaction(db, async (transaction) => {
        const userDocRef = doc(db, 'users', currentUser.uid);
        transaction.delete(userDocRef);

        if (currentUserData.username) {
            const usernameDocRef = doc(db, 'usernames', currentUserData.username.toLowerCase());
            transaction.delete(usernameDocRef);
        }
      });
      
      await deleteUser(currentUser);
      router.push('/login');
    } catch (error: any) {
      console.error("Error deleting account:", error);
      if (error.code === 'auth/wrong-password') {
        throw new Error("The password you entered is incorrect. Please try again.");
      }
      throw error;
    }
  };


  const value = { user, loading, login, logout, signup, deleteAccount };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
