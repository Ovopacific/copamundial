"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import { clsx } from "clsx";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";

interface LeaderboardUser {
  uid: string;
  name: string;
  photoURL: string;
  points: number;
  exactScores: number;
  correctResults: number;
}

export default function LeaderboardPage() {
  const { user: currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users"),
      orderBy("points", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: LeaderboardUser[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          name: data.name || "Usuario Anónimo",
          photoURL: data.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.id}`,
          points: data.points || 0,
          exactScores: data.exactScores || 0,
          correctResults: data.correctResults || 0,
        };
      });
      setLeaderboard(users);
      setLoading(false);
    }, (error) => {
      console.error("Error loading leaderboard:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex flex-1 justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,240,255,0.4)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center py-16 px-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center p-4 rounded-full glass-panel glow-secondary mb-6"
          >
            <Crown className="w-12 h-12 text-secondary animate-pulse" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Ranking <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Global</span>
          </h1>
          <p className="text-gray-400">Compite contra los mejores y demuestra tu conocimiento futbolístico.</p>
        </div>

        <div className="glass-panel rounded-3xl overflow-hidden border border-dark-border shadow-[0_0_50px_rgba(0,0,0,0.3)]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-6 bg-dark-surface border-b border-dark-border text-xs font-bold uppercase tracking-wider text-gray-400">
            <div className="col-span-2 md:col-span-1 text-center">Pos</div>
            <div className="col-span-7 md:col-span-5">Jugador</div>
            <div className="col-span-3 md:col-span-2 text-center">Puntos</div>
            <div className="col-span-2 hidden md:block text-center">Exactos</div>
            <div className="col-span-2 hidden md:block text-center">Aciertos</div>
          </div>

          {/* Table Body */}
          <div className="flex flex-col">
            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-gray-500 font-medium">
                Aún no hay puntuaciones registradas. ¡Sé el primero en pronosticar!
              </div>
            ) : (
              leaderboard.map((user, index) => {
                const isFirst = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;
                const isCurrentUser = currentUser?.uid === user.uid;

                return (
                  <motion.div
                    key={user.uid}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
                    className={clsx(
                      "grid grid-cols-12 gap-4 p-6 items-center border-b border-dark-border/30 transition-colors cursor-default",
                      isFirst && "bg-yellow-400/5",
                      isSecond && "bg-gray-300/5",
                      isThird && "bg-amber-600/5",
                      isCurrentUser && "border-l-4 border-l-primary bg-primary/5"
                    )}
                  >
                    {/* Position / Medal */}
                    <div className="col-span-2 md:col-span-1 flex justify-center">
                      {isFirst ? (
                        <Trophy className="w-7 h-7 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                      ) : isSecond ? (
                        <Medal className="w-7 h-7 text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.6)]" />
                      ) : isThird ? (
                        <Award className="w-7 h-7 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.6)]" />
                      ) : (
                        <span className={clsx("text-lg font-bold", isCurrentUser ? "text-primary" : "text-gray-500")}>
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Player Info */}
                    <div className="col-span-7 md:col-span-5 flex items-center gap-4">
                      <img 
                        src={user.photoURL} 
                        alt={user.name} 
                        className={clsx(
                          "w-10 h-10 rounded-full bg-dark-surface border",
                          isCurrentUser ? "border-primary" : "border-dark-border"
                        )} 
                      />
                      <span className={clsx("font-bold text-base truncate flex items-center gap-2", 
                        isCurrentUser ? "text-primary" : "text-white"
                      )}>
                        {user.name}
                        {isCurrentUser && (
                          <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded font-bold uppercase">Tú</span>
                        )}
                      </span>
                    </div>

                    {/* Points */}
                    <div className="col-span-3 md:col-span-2 text-center">
                      <span className={clsx("text-xl font-black", 
                        isFirst ? "text-yellow-400 glow-primary" : "text-primary"
                      )}>
                        {user.points}
                      </span>
                    </div>

                    {/* Exact Scores (Desktop) */}
                    <div className="col-span-2 hidden md:block text-center text-gray-400 font-medium">
                      {user.exactScores}
                    </div>

                    {/* Correct Results (Desktop) */}
                    <div className="col-span-2 hidden md:block text-center text-gray-400 font-medium">
                      {user.correctResults}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
