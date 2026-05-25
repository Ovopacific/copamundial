"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Match, Prediction } from "@/types";
import { Lock, Save, Clock, Activity, Award } from "lucide-react";
import { clsx } from "clsx";
import { calculatePredictionPoints } from "@/lib/points";

interface MatchCardProps {
  match: Match;
  userPrediction?: Prediction;
  onSavePrediction?: (home: number, away: number) => void;
}

export default function MatchCard({ match, userPrediction, onSavePrediction }: MatchCardProps) {
  const [homeScore, setHomeScore] = useState<string>("");
  const [awayScore, setAwayScore] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const isLocked = match.status !== "pending";

  // Sync state with prediction when it loads asynchronously
  useEffect(() => {
    if (userPrediction) {
      setHomeScore(userPrediction.predictedHomeScore.toString());
      setAwayScore(userPrediction.predictedAwayScore.toString());
    } else {
      setHomeScore("");
      setAwayScore("");
    }
  }, [userPrediction]);

  const handleSave = async () => {
    if (!homeScore || !awayScore || isLocked || !onSavePrediction) return;
    setIsSaving(true);
    // Add small visual delay to feel premium
    await new Promise((r) => setTimeout(r, 600));
    onSavePrediction(parseInt(homeScore), parseInt(awayScore));
    setIsSaving(false);
  };

  const statusConfig = {
    pending: { color: "text-gray-400", icon: Clock, label: "Pendiente" },
    live: { color: "text-red-500 animate-pulse", icon: Activity, label: "EN VIVO" },
    finished: { color: "text-primary", icon: Lock, label: "Finalizado" }
  };
  
  const StatusIcon = statusConfig[match.status].icon;

  const pointsResult = match.status === "finished" && userPrediction
    ? calculatePredictionPoints(match, userPrediction)
    : null;

  return (
    <motion.div
      whileHover={!isLocked ? { scale: 1.02 } : {}}
      className={clsx(
        "relative p-6 rounded-2xl glass-panel transition-all duration-300",
        match.status === "live" ? "border-red-500/30 glow-secondary" : "hover:glow-primary"
      )}
    >
      {/* Match Status Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <StatusIcon className={clsx("w-4 h-4", statusConfig[match.status].color)} />
          <span className={statusConfig[match.status].color}>{statusConfig[match.status].label}</span>
        </div>
        <div className="text-gray-400 text-sm font-medium">
          {new Date(match.date).toLocaleDateString("es-ES", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* Match Teams & Score */}
      <div className="flex items-center justify-between gap-4">
        {/* Home Team */}
        <div className="flex flex-col items-center flex-1 gap-3">
          <div className="text-4xl">{match.homeFlag}</div>
          <span className="font-bold text-white text-center">{match.homeTeam}</span>
        </div>

        {/* Score Inputs / Result */}
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            max="20"
            value={isLocked ? (match.homeScore ?? homeScore) : homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            disabled={isLocked}
            className="w-16 h-16 text-center text-2xl font-black bg-dark-surface border border-dark-border rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-80"
          />
          <span className="text-gray-500 font-bold text-xl">VS</span>
          <input
            type="number"
            min="0"
            max="20"
            value={isLocked ? (match.awayScore ?? awayScore) : awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            disabled={isLocked}
            className="w-16 h-16 text-center text-2xl font-black bg-dark-surface border border-dark-border rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-80"
          />
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center flex-1 gap-3">
          <div className="text-4xl">{match.awayFlag}</div>
          <span className="font-bold text-white text-center">{match.awayTeam}</span>
        </div>
      </div>

      {/* Save Button */}
      {!isLocked && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={!homeScore || !awayScore || isSaving}
          className="mt-6 w-full py-3 rounded-xl font-bold text-black bg-primary hover:bg-primary-dark disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar Pronóstico
            </>
          )}
        </motion.button>
      )}
      
      {/* Prediction & Points Alert for finished matches */}
      {match.status === "finished" && userPrediction && pointsResult && (
        <div className={clsx(
          "mt-6 p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-sm font-bold transition-all",
          pointsResult.pointsEarned > 0 
            ? "bg-primary/10 border-primary/30 text-primary shadow-[0_0_15px_rgba(0,240,255,0.05)]" 
            : "bg-dark-surface border-dark-border text-gray-500"
        )}>
          <div className="flex items-center gap-1.5">
            <Award className={clsx("w-4 h-4", pointsResult.pointsEarned > 0 ? "text-primary animate-pulse" : "text-gray-500")} />
            <span>Tu pronóstico fue: {userPrediction.predictedHomeScore} - {userPrediction.predictedAwayScore}</span>
          </div>
          <div className="text-xs tracking-wider uppercase font-extrabold">
            {pointsResult.pointsEarned === 5 
              ? "💥 ¡MARCADOR EXACTO! +5 PUNTOS" 
              : pointsResult.pointsEarned === 3 
                ? "🎉 ¡RESULTADO ACERTADO! +3 PUNTOS" 
                : "❌ SIN ACIERTO (0 PUNTOS)"}
          </div>
        </div>
      )}

      {/* Pending / Live user prediction state */}
      {match.status !== "finished" && userPrediction && (
        <div className="mt-6 p-3 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center gap-2 text-sm text-gray-400">
          <Lock className="w-4 h-4" />
          <span>Pronóstico registrado: {userPrediction.predictedHomeScore} - {userPrediction.predictedAwayScore}</span>
        </div>
      )}
    </motion.div>
  );
}
