"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { Trophy, Star, Target, Flame, Share2, Award, LogIn } from "lucide-react";
import { clsx } from "clsx";
import { db } from "@/lib/firebase";
import { doc, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [rank, setRank] = useState<number | string>("...");
  const [hasPredictions, setHasPredictions] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !user) {
      setLoading(false);
      return;
    }

    // 1. Listen to user profile document
    const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfileData(docSnap.data());
      }
    });

    // 2. Fetch predictions count to check for "Primer Pronóstico" achievement
    const qPreds = query(collection(db, "predictions"), where("userId", "==", user.uid));
    const unsubPreds = onSnapshot(qPreds, (snapshot) => {
      setHasPredictions(!snapshot.empty);
    });

    // 3. Listen to all users ordered by points to calculate rank in real-time
    const qAllUsers = query(collection(db, "users"), orderBy("points", "desc"));
    const unsubAllUsers = onSnapshot(qAllUsers, (snapshot) => {
      const index = snapshot.docs.findIndex(d => d.id === user.uid);
      if (index !== -1) {
        setRank(index + 1);
      } else {
        setRank("-");
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching rank:", error);
      setLoading(false);
    });

    return () => {
      unsubUser();
      unsubPreds();
      unsubAllUsers();
    };
  }, [user]);

  // Real Stats
  const stats = {
    points: profileData?.points ?? 0,
    exactScores: profileData?.exactScores ?? 0,
    correctResults: profileData?.correctResults ?? 0,
    rank: rank
  };

  // Dynamic Achievements checking
  const achievementsList = [
    { 
      id: "a1", 
      name: "Primer Pronóstico", 
      icon: Star, 
      description: "Hiciste tu primera predicción.", 
      unlocked: hasPredictions 
    },
    { 
      id: "a2", 
      name: "Francotirador", 
      icon: Target, 
      description: "Acertaste un marcador exacto.", 
      unlocked: stats.exactScores >= 1 
    },
    { 
      id: "a3", 
      name: "En Racha", 
      icon: Flame, 
      description: "Acertaste 3 resultados en total.", 
      unlocked: stats.correctResults >= 3 
    },
    { 
      id: "a4", 
      name: "Oráculo", 
      icon: Award, 
      description: "Acertaste 5 marcadores exactos en total.", 
      unlocked: stats.exactScores >= 5 
    },
  ];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Mi Perfil Ovopacific",
        text: `¡Soy el #${stats.rank} en el Ranking Mundial de Ovopacific con ${stats.points} puntos! ¿Puedes superarme?`,
        url: window.location.origin,
      });
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`¡Soy el #${stats.rank} en el Ranking de Ovopacific con ${stats.points} puntos! Compite conmigo aquí: ${window.location.origin}`);
      alert("Enlace copiado al portapapeles. ¡Compártelo con tus amigos!");
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center py-20 px-6 text-center">
        <LogIn className="w-16 h-16 text-primary mb-4 animate-pulse shadow-[0_0_15px_rgba(0,240,255,0.4)]" />
        <h1 className="text-3xl font-bold text-white mb-2">Inicia Sesión</h1>
        <p className="text-gray-400 max-w-sm mb-6">Debes iniciar sesión con tu cuenta de Google para ver tus estadísticas y logros en tiempo real.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full flex flex-1 justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,240,255,0.4)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 py-12 px-6 max-w-4xl mx-auto w-full">
      {/* Header Profile */}
      <div className="glass-panel rounded-3xl p-8 mb-8 border border-dark-border relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <img 
            src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
            alt="Profile" 
            className="w-32 h-32 rounded-full border-4 border-dark-surface shadow-[0_0_20px_rgba(0,240,255,0.3)]"
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white mb-2">{user.displayName || "Usuario Invitado"}</h1>
            <p className="text-gray-400 mb-6">{user.email}</p>
            
            <button 
              onClick={handleShare}
              className="px-6 py-2 rounded-full border border-dark-border bg-dark-surface hover:bg-white/5 text-white transition-colors flex items-center justify-center gap-2 mx-auto md:mx-0 shadow-lg cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-primary" /> Compartir mis resultados
            </button>
          </div>
          
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-dark-surface border border-dark-border min-w-[150px] shadow-inner">
            <Trophy className="w-8 h-8 text-yellow-400 mb-2 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
            <span className="text-sm text-gray-400 font-medium">Ranking Global</span>
            <span className="text-3xl font-black text-white mt-1">
              {stats.rank === "..." || stats.rank === "-" ? stats.rank : `#${stats.rank}`}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Stats Column */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Estadísticas</h2>
          
          <div className="glass-panel p-6 rounded-2xl border border-dark-border flex flex-col items-center shadow-lg">
            <span className="text-sm text-gray-400 uppercase tracking-wider mb-2 font-semibold">Puntos Totales</span>
            <span className="text-5xl font-black text-primary glow-primary">{stats.points}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-surface p-4 rounded-2xl border border-dark-border flex flex-col items-center shadow-md">
              <span className="text-3xl font-bold text-white mb-1">{stats.exactScores}</span>
              <span className="text-xs text-gray-500 text-center font-medium">Marcadores Exactos</span>
            </div>
            <div className="bg-dark-surface p-4 rounded-2xl border border-dark-border flex flex-col items-center shadow-md">
              <span className="text-3xl font-bold text-white mb-1">{stats.correctResults}</span>
              <span className="text-xs text-gray-500 text-center font-medium">Aciertos Ganador</span>
            </div>
          </div>
        </div>

        {/* Achievements Column */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-secondary" /> Sistema de Logros
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {achievementsList.map((achievement, i) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={clsx(
                  "p-5 rounded-2xl border flex items-start gap-4 transition-all duration-500 shadow-md",
                  achievement.unlocked 
                    ? "glass-panel border-primary/30 glow-primary/10" 
                    : "bg-dark-surface border-dark-border opacity-40 grayscale"
                )}
              >
                <div className={clsx(
                  "p-3 rounded-full flex-shrink-0 shadow-md",
                  achievement.unlocked ? "bg-primary/20 text-primary animate-pulse" : "bg-gray-800/40 text-gray-500"
                )}>
                  <achievement.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{achievement.name}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{achievement.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
