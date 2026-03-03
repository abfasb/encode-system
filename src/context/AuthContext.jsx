import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import ProfileSelectionModal from '../components/ProfileSelectionModal';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserDoc(data);
          const savedProfileId = localStorage.getItem(`profile_${user.uid}`);
          if (savedProfileId) {
            const profile = data.profiles?.find(p => p.id === savedProfileId);
            if (profile) {
              setCurrentProfile(profile);
            } else {
              setShowProfileModal(true);
            }
          } else {
            setShowProfileModal(true);
          }
        } else {
          const newUserDoc = {
            email: user.email,
            name: 'Department of Agriculture',
            createdAt: new Date().toISOString(),
            profiles: []
          };
          await setDoc(userRef, newUserDoc);
          setUserDoc(newUserDoc);
          setShowProfileModal(true);
        }
      } else {
        setCurrentUser(null);
        setUserDoc(null);
        setCurrentProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const addProfile = async (profileName) => {
    if (!currentUser) return;
    const profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newProfile = { id: profileId, name: profileName, createdAt: new Date().toISOString() };
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      profiles: arrayUnion(newProfile)
    });
    setUserDoc(prev => ({ ...prev, profiles: [...(prev.profiles || []), newProfile] }));
    return newProfile;
  };

  const selectProfile = (profile) => {
    setCurrentProfile(profile);
    localStorage.setItem(`profile_${currentUser.uid}`, profile.id);
    setShowProfileModal(false);
  };

  const value = {
    currentUser,
    userDoc,
    currentProfile,
    loading,
    showProfileModal,
    setShowProfileModal,
    addProfile,
    selectProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showProfileModal && <ProfileSelectionModal />}
    </AuthContext.Provider>
  );
};