import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        console.log('Auth state changed. User:', currentUser?.email);
        setLoading(true);

        if (currentUser) {
          setUser(currentUser);
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);

            console.log('Checking Firestore for user:', currentUser.uid);
            console.log('User document exists:', userDoc.exists());

            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log('User data:', userData);
              const role = userData.role;
              console.log('Setting role to:', role);
              setUserRole(role);
            } else {
              console.warn('⚠️ User document does not exist in Firestore');
              console.warn('Creating user document for:', currentUser.uid);

              // Check if user is an admin (in admins collection)
              const adminDocRef = doc(db, 'admins', currentUser.uid);
              const adminDoc = await getDoc(adminDocRef);
              const isAdmin = adminDoc.exists();

              const userRole = isAdmin ? 'admin' : 'employee';

              // Create user document with proper role
              await setDoc(userDocRef, {
                email: currentUser.email,
                role: userRole,
                createdAt: new Date(),
                updatedAt: new Date()
              });

              console.log('Setting role to:', userRole);
              setUserRole(userRole);
            }
          } catch (err) {
            console.error('❌ Error fetching user role:', err);
            setError(err.message);
            setUserRole('employee'); // Default to employee if error
          }
        } else {
          console.log('No user logged in');
          setUser(null);
          setUserRole(null);
          setError(null);
        }

        setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err) {
      setError(err.message);
    }
  };

  const value = {
    user,
    userRole,
    loading,
    error,
    login,
    logout,
    isAdmin: userRole === 'admin',
    isEmployee: userRole === 'employee',
    isCreatingEmployee,
    setIsCreatingEmployee
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
