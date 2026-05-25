"use client";

import { useState, useEffect } from "react";
import { Match, Prediction } from "@/types";
import MatchCard from "./MatchCard";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, query, where } from "firebase/firestore";

export default function MatchesBoard() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState(true);

  // 1. Listen to matches in real-time + auto-seed if database is empty
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, "matches"), async (snapshot) => {
      if (snapshot.empty) {
        // Auto-seed database with default matches for testing/demonstration
        const SEED_MATCHES = [
          {
            id: "m1",
            homeTeam: "Argentina",
            awayTeam: "Francia",
            homeFlag: "🇦🇷",
            awayFlag: "🇫🇷",
            date: new Date(Date.now() + 86400000), // Tomorrow
            status: "pending"
          },
          {
            id: "m2",
            homeTeam: "Brasil",
            awayTeam: "Alemania",
            homeFlag: "🇧🇷",
            awayFlag: "🇩🇪",
            date: new Date(Date.now() + 172800000), // In 2 days
            status: "pending"
          },
          {
            id: "m3",
            homeTeam: "España",
            awayTeam: "Inglaterra",
            homeFlag: "🇪🇸",
            awayFlag: "🇬🇧",
            date: new Date(Date.now() - 3600000), // 1 hour ago
            status: "live",
            homeScore: 1,
            awayScore: 1
          },
          {
            id: "m4",
            homeTeam: "Portugal",
            awayTeam: "Uruguay",
            homeFlag: "🇵🇹",
            awayFlag: "🇺🇾",
            date: new Date(Date.now() - 86400000), // Yesterday
            status: "finished",
            homeScore: 2,
            awayScore: 0,
            processed: true
          }
        ];

        try {
          for (const m of SEED_MATCHES) {
            await setDoc(doc(db, "matches", m.id), m);
          }
        } catch (error) {
          console.error("Error seeding matches:", error);
        }
        return;
      }

      const list = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
        } as Match;
      });

      // Sort by date ascending
      list.sort((a, b) => a.date.getTime() - b.date.getTime());
      setMatches(list);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to matches:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Listen to current user's predictions in real-time
  useEffect(() => {
    if (!db || !user) {
      setPredictions({});
      return;
    }

    const q = query(collection(db, "predictions"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userPreds: Record<string, Prediction> = {};
      snapshot.forEach((d) => {
        const data = d.data();
        userPreds[data.matchId] = {
          id: d.id,
          ...data
        } as Prediction;
      });
      setPredictions(userPreds);
    }, (error) => {
      console.error("Error listening to predictions:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSavePrediction = async (matchId: string, home: number, away: number) => {
    if (!user) {
      alert("Debes iniciar sesión para realizar pronósticos.");
      return;
    }

    if (!db) {
      alert("Firebase no está configurado.");
      return;
    }

    try {
      const predId = `${user.uid}_${matchId}`;
      await setDoc(doc(db, "predictions", predId), {
        userId: user.uid,
        matchId,
        predictedHomeScore: home,
        predictedAwayScore: away,
        locked: false,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error saving prediction to Firestore:", error);
      alert("Ocurrió un error al guardar tu pronóstico en Firestore. Revisa las reglas de seguridad.");
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,240,255,0.4)]" />
      </div>
    );
  }

  return (
    <div id="matches-board" className="w-full max-w-5xl mx-auto py-16 px-6">
      <div className="mb-12 text-center sm:text-left relative pl-0 sm:pl-6">
        <div className="absolute left-0 top-1 w-1.5 h-14 bg-gradient-to-b from-primary to-secondary rounded-full hidden sm:block"></div>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-3 uppercase tracking-wide">
          Pronósticos <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary text-glow">Disponibles</span>
        </h2>
        <p className="text-gray-400 font-semibold text-sm md:text-base">Ingresa tus predicciones antes de que comiencen los partidos y demuestra tu conocimiento.</p>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No hay partidos disponibles en este momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MatchCard 
                match={match} 
                userPrediction={predictions[match.id]} 
                onSavePrediction={(h, a) => handleSavePrediction(match.id, h, a)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
