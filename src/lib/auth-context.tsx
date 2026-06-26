"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { 
  User, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut 
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasProfile: boolean | null;
  refreshProfile: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  hasProfile: null,
  refreshProfile: async () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    // If auth is not initialized (e.g. missing config), just stop loading to avoid white screen
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && db) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          // First check if the document exists before trying to update
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            await updateDoc(userRef, { lastConnection: new Date() });
            setHasProfile(true);
          } else {
            // Document not created yet (mid-registration), don't kick them out yet
            setHasProfile(false);
          }
        } catch (error) {
          console.debug("Could not check user profile", error);
          setHasProfile(false);
        }
      } else {
        setHasProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db) return;
    const unsubMaintenance = onSnapshot(doc(db, "settings", "maintenance"), (docSnap) => {
      if (docSnap.exists()) {
        setMaintenanceMode(!!docSnap.data().active);
      } else {
        setMaintenanceMode(false);
      }
    }, (err) => {
      console.debug("Maintenance fetch failed", err);
    });
    return () => unsubMaintenance();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) {
      alert("Firebase no está configurado aún.");
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  // Called from the login page right after the profile is created,
  // so hasProfile goes from false -> true without waiting for next onAuthStateChanged
  const refreshProfile = async () => {
    if (!auth?.currentUser || !db) return;
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setHasProfile(true);
      }
    } catch (error) {
      console.debug("refreshProfile error", error);
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      setHasProfile(null);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const pathname = usePathname();
  const isAdmin = user && user.email === "yolfranllecastillo@gmail.com";

  if (maintenanceMode && !isAdmin && pathname !== "/login") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Glowing background details */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="relative z-10 max-w-md w-full glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#ff0055] to-[#ff3300] rounded-full flex items-center justify-center mb-8 animate-pulse shadow-[0_0_30px_rgba(255,0,85,0.4)]">
            <span className="text-4xl">🚧</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 uppercase tracking-tight leading-tight">
            Plataforma<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff0055] to-primary text-glow">
              Fuera de Servicio
            </span>
          </h1>
          
          <p className="text-gray-300 text-sm sm:text-base font-semibold mb-8 leading-relaxed">
            Estamos realizando mejoras en el servidor para ofrecerte una experiencia increíble. Volveremos muy pronto. ¡Gracias por tu paciencia! ⚽🇨🇴
          </p>
          
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
            <div className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-[#ff0055] to-primary rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, hasProfile, refreshProfile, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
