"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User as UserIcon, LogIn, Key, ShieldCheck, ArrowLeft } from "lucide-react";
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
import { doc, setDoc, getDoc } from "firebase/firestore";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
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


  const handleClose = async () => {
    // If they cancel in the middle of Google invitation verification, sign them out
    if (step === "verify-code" && newGoogleUser && auth) {
      await signOut(auth);
    }
    setNewGoogleUser(null);
    setStep("auth");
    setInviteCode("");
    setError("");
    onClose();
  };

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
        onClose();
      } else {
        // Enforce invitation code on Email/Password registration - Server-side check
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
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: name });
        
        // Create user doc
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: name,
          email: user.email,
          photoURL: null,
          points: 0,
          correctResults: 0,
          correctPredictions: 0,
          exactScores: 0,
          createdAt: new Date()
        });

        setInviteCode("");
        onClose();
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
      const user = userCredential.user;

      // Check if user profile already exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Brand new Google user! Prompt for invitation code.
        setNewGoogleUser(user);
        setStep("verify-code");
      } else {
        // Existing user, log in successfully!
        onClose();
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
      // Create user profile doc
      await setDoc(doc(db, "users", newGoogleUser.uid), {
        uid: newGoogleUser.uid,
        name: newGoogleUser.displayName || "Usuario de Google",
        email: newGoogleUser.email,
        photoURL: newGoogleUser.photoURL,
        points: 0,
        correctResults: 0,
        correctPredictions: 0,
        exactScores: 0,
        createdAt: new Date()
      });

      // Reset and close modal
      setNewGoogleUser(null);
      setStep("auth");
      setInviteCode("");
      onClose();
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md glass-panel p-8 rounded-2xl border border-dark-border shadow-2xl overflow-hidden"
          >
            {/* Background glow orb */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {step === "auth" ? (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-wide">
                    {isLogin ? "Iniciar Sesión" : "Registrarse"}
                  </h2>
                  <p className="text-gray-400 text-sm font-semibold">
                    {isLogin 
                      ? "Ingresa para continuar tus pronósticos de Colombia" 
                      : "Únete al grupo selecto y compite por el podio"}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm text-center font-bold">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Nombre completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-dark-surface border border-dark-border rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-sm"
                        required
                      />
                    </div>
                  )}
                  
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-dark-surface border border-dark-border rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-sm"
                      required
                    />
                  </div>
                  
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-dark-surface border border-dark-border rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-sm"
                      required
                    />
                  </div>

                  {!isLogin && (
                    <div className="relative">
                      <Key className="absolute left-3.5 top-3.5 w-5 h-5 text-primary" />
                      <input
                        type="text"
                        placeholder="Código de Invitación Secreto"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        className="w-full bg-primary/5 border border-primary/20 rounded-xl py-3.5 pl-11 pr-4 text-primary placeholder-primary/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-bold text-sm tracking-wider"
                        required
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-black bg-primary hover:bg-primary-dark transition-all transform active:scale-[0.98] glow-primary disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-6"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        {isLogin ? "Ingresar" : "Registrarse"}
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 flex items-center justify-center gap-4">
                  <div className="h-px bg-dark-border flex-1" />
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">O ingresa con</span>
                  <div className="h-px bg-dark-border flex-1" />
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  type="button"
                  className="mt-4 w-full py-3.5 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 border border-dark-border transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] cursor-pointer"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  Google
                </button>

                <div className="mt-8 text-center text-gray-400 text-sm font-semibold">
                  {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError("");
                    }}
                    className="text-primary hover:text-primary-dark font-black transition-colors"
                  >
                    {isLogin ? "Regístrate" : "Ingresa"}
                  </button>
                </div>
              </>
            ) : (
              // Verification Step for new Google Users
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col"
              >
                <div className="flex items-center gap-2 mb-6">
                  <button 
                    onClick={handleBackToAuth}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-extrabold">Paso de verificación</span>
                </div>

                <div className="text-center mb-8 flex flex-col items-center">
                  <div className="p-4 rounded-full bg-primary/10 text-primary border border-primary/20 glow-primary/5 mb-4 animate-bounce">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">
                    ¡Hola, {newGoogleUser?.displayName?.split(" ")[0]}!
                  </h2>
                  <p className="text-gray-400 text-sm font-semibold max-w-xs mx-auto">
                    Para activar tu cuenta en el grupo cerrado, ingresa el **código de invitación secreto**.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm text-center font-bold">
                    {error}
                  </div>
                )}

                <form onSubmit={handleVerifyGoogleInviteCode} className="space-y-4">
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3.5 w-5 h-5 text-primary" />
                    <input
                      type="text"
                      placeholder="Ingresa el código secreto"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="w-full bg-primary/5 border border-primary/20 rounded-xl py-3.5 pl-11 pr-4 text-primary placeholder-primary/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-bold text-center text-lg tracking-widest uppercase"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-black bg-primary hover:bg-primary-dark transition-all glow-primary disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-6"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        Validar y Activar Cuenta
                      </>
                    )}
                  </button>
                </form>

                <button
                  onClick={handleClose}
                  className="mt-4 text-xs font-bold text-gray-500 hover:text-gray-400 uppercase tracking-widest text-center cursor-pointer py-2"
                >
                  Cancelar registro
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
