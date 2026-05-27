"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User as UserIcon, LogIn, Key, ShieldCheck, ArrowLeft, Trophy } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User as FirebaseUser
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // States for verification step (Option 3)
  const [step, setStep] = useState<"auth" | "verify-code">("auth");
  const [newGoogleUser, setNewGoogleUser] = useState<FirebaseUser | null>(null);

  // Redirect to home if already logged in AND has a profile
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (user && step !== "verify-code") {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            router.replace("/");
          }
          // If the doc doesn't exist, we wait for handleGoogleSignIn to set step="verify-code"
        } catch (e) {
          console.error("Error checking user profile", e);
        }
      }
    };
    checkAndRedirect();
  }, [user, step, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!auth) {
      setError("Firebase no está configurado.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        // Auth context will handle updating lastConnection and redirect
      } else {
        // Enforce invitation code on Email/Password registration
        const verifyRes = await fetch("/api/verify-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: inviteCode })
        });
        const verifyData = await verifyRes.json();
        
        if (!verifyRes.ok || !verifyData.valid) {
          setError("Código de invitación incorrecto.");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        
        await updateProfile(fbUser, { displayName: name });
        
        // Create user doc
        await setDoc(doc(db, "users", fbUser.uid), {
          uid: fbUser.uid,
          name: name,
          email: fbUser.email,
          photoURL: null,
          points: 0,
          correctResults: 0,
          correctPredictions: 0,
          exactScores: 0,
          createdAt: new Date(),
          lastConnection: new Date(),
          inviteCodeUsed: inviteCode
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("El correo electrónico ya está registrado.");
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      } else {
        setError(err.message || "Error en la autenticación");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    if (!auth) {
      setError("Firebase no está configurado.");
      setLoading(false);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const fbUser = userCredential.user;

      // Check if user profile already exists in Firestore
      const userRef = doc(db, "users", fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Brand new Google user! Prompt for invitation code and name.
        setNewGoogleUser(fbUser);
        setName(""); // Do not pre-fill so they are forced to type a nickname
        setStep("verify-code");
      } else {
        // Existing user, log in successfully!
        // lastConnection is updated by auth-context
      }
    } catch (err: any) {
      console.error("Error signing in with Google:", err);
      setError(err.message || "Error al iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyGoogleInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name.trim()) {
      setError("Debes ingresar un nombre completo.");
      setLoading(false);
      return;
    }

    // Verify invitation code via server-side API
    const verifyRes = await fetch("/api/verify-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: inviteCode })
    });
    const verifyData = await verifyRes.json();
    
    if (!verifyRes.ok || !verifyData.valid) {
      setError("Código de invitación incorrecto.");
      setLoading(false);
      return;
    }

    if (!newGoogleUser || !db) {
      setError("Error interno. Inténtalo de nuevo.");
      setLoading(false);
      return;
    }

    try {
      // Update profile with the new name if they changed it
      if (name !== newGoogleUser.displayName) {
        await updateProfile(newGoogleUser, { displayName: name });
      }

      // Create user profile doc
      await setDoc(doc(db, "users", newGoogleUser.uid), {
        uid: newGoogleUser.uid,
        name: name,
        email: newGoogleUser.email,
        photoURL: newGoogleUser.photoURL,
        points: 0,
        correctResults: 0,
        correctPredictions: 0,
        exactScores: 0,
        createdAt: new Date(),
        lastConnection: new Date(),
        inviteCodeUsed: inviteCode
      });

      // Reset
      setNewGoogleUser(null);
      setStep("auth");
      setInviteCode("");
      router.replace("/");
    } catch (err: any) {
      console.error("Error creating Google profile:", err);
      setError("Error al crear tu perfil en Firestore.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToAuth = async () => {
    if (auth && newGoogleUser) {
      await signOut(auth);
    }
    setNewGoogleUser(null);
    setStep("auth");
    setInviteCode("");
    setError("");
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-black">
      {/* Dynamic Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1518605368461-1ee7c532066d?q=80&w=2000&auto=format&fit=crop" 
          alt="Stadium Background" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-60" />
      </div>

      {/* Floating Elements for Premium Feel */}
      <motion.div 
        animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none z-0"
      />
      <motion.div 
        animate={{ y: [0, 30, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none z-0"
      />

      {/* Main Login Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md glass-panel p-8 sm:p-10 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
      >
        {step === "auth" ? (
          <div className="flex flex-col h-full">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,240,255,0.4)]"
              >
                <Trophy className="w-8 h-8 text-black" />
              </motion.div>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 uppercase tracking-tight">
                {isLogin ? "Bienvenido" : "Únete al Juego"}
              </h1>
              <p className="text-gray-400 text-sm font-medium">
                {isLogin 
                  ? "Ingresa a la plataforma oficial de pronósticos" 
                  : "Regístrate para competir en el Mundial 2026"}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm text-center font-bold"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4 flex-1">
              <AnimatePresence>
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative"
                  >
                    <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:bg-white/10 transition-all font-medium"
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:bg-white/10 transition-all font-medium"
                  required
                />
              </div>
              
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:bg-white/10 transition-all font-medium"
                  required
                />
              </div>

              <AnimatePresence>
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative pt-2"
                  >
                    <Key className="absolute left-4 top-5 w-5 h-5 text-primary" />
                    <input
                      type="text"
                      placeholder="Código de Invitación Secreto"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="w-full bg-primary/10 border border-primary/30 rounded-xl py-3.5 pl-12 pr-4 text-primary placeholder-primary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-bold tracking-widest uppercase"
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-6 rounded-xl font-bold text-black bg-primary hover:bg-white transition-all transform active:scale-[0.98] glow-primary disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden group"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]" />
                {loading ? (
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    {isLogin ? "INGRESAR" : "CREAR CUENTA"}
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">O continúa con</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              type="button"
              className="mt-6 w-full py-3.5 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98]"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Google
            </button>

            <div className="mt-8 text-center text-gray-400 text-sm font-medium">
              {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-white hover:text-primary font-bold transition-colors underline decoration-primary/50 underline-offset-4"
              >
                {isLogin ? "Regístrate aquí" : "Inicia sesión"}
              </button>
            </div>
          </div>
        ) : (
          // Verification Step for new Google Users
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-3 mb-8">
              <button 
                onClick={handleBackToAuth}
                className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-xs text-primary uppercase tracking-widest font-extrabold">Verificación de Invitación</span>
            </div>

            <div className="text-center mb-8">
              <div className="inline-flex p-4 rounded-full bg-primary/10 text-primary border border-primary/20 glow-primary/5 mb-6 animate-pulse">
                <ShieldCheck className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-black text-white mb-3 tracking-tight">
                COMPLETA TU PERFIL
              </h2>
              <p className="text-gray-400 text-sm font-medium max-w-[280px] mx-auto">
                Estás a un paso de entrar. Confirma tu nombre e ingresa el código secreto.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm text-center font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyGoogleInviteCode} className="space-y-4">
              <div className="relative">
                <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nombre de usuario o Nickname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:bg-white/10 transition-all font-medium"
                  required
                />
              </div>

              <div className="relative pt-2">
                <Key className="absolute left-4 top-5 w-5 h-5 text-primary" />
                <input
                  type="text"
                  placeholder="CÓDIGO SECRETO"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full bg-primary/10 border border-primary/30 rounded-xl py-3.5 pl-12 pr-4 text-primary placeholder-primary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-black text-center tracking-widest uppercase"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-8 rounded-xl font-bold text-black bg-primary hover:bg-white transition-all transform active:scale-[0.98] glow-primary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    ACTIVAR CUENTA
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
