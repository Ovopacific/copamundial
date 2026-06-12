"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Match, Prediction } from "@/types";
import { Lock, Save, Clock, Activity, Award, Edit3, AlertCircle } from "lucide-react";
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
  const [timeRemaining, setTimeRemaining] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  const isStarted = match.status !== "pending";
  const modsCount = userPrediction?.modificationsCount || 0;
  const isModsLocked = modsCount >= 2;
  const isTimeLocked = timeRemaining !== null && (timeRemaining.d <= 0 && timeRemaining.h <= 0 && timeRemaining.m <= 0 && timeRemaining.s <= 0);
  
  const isLocked = isStarted || isTimeLocked || isModsLocked || (userPrediction?.locked === true);

  useEffect(() => {
    if (userPrediction) {
      setHomeScore(userPrediction.predictedHomeScore.toString());
      setAwayScore(userPrediction.predictedAwayScore.toString());
    } else {
      setHomeScore("");
      setAwayScore("");
    }
  }, [userPrediction]);

  // Countdown timer logic
  useEffect(() => {
    if (match.status !== "pending") {
      setTimeRemaining(null);
      return;
    }

    const calculateTime = () => {
      const matchDate = match.date instanceof Date ? match.date : new Date(match.date);
      // Lock predictions 2 hours (7200000 ms) before the match starts
      const lockDate = new Date(matchDate.getTime() - (2 * 60 * 60 * 1000));
      const diff = lockDate.getTime() - new Date().getTime();
      
      if (diff <= 0) {
        return { d: 0, h: 0, m: 0, s: 0 };
      }

      return {
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60)
      };
    };

    setTimeRemaining(calculateTime());
    const interval = setInterval(() => {
      setTimeRemaining(calculateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [match.date, match.status]);

  const handleSave = async () => {
    if (!homeScore || !awayScore || isLocked || !onSavePrediction) return;
    setIsSaving(true);
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
        "relative p-4 sm:p-6 rounded-2xl glass-panel transition-all duration-300",
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

      {/* Countdown Timer */}
      {timeRemaining && match.status === "pending" && !isTimeLocked && (
        <div className="flex flex-col items-center mb-6 gap-1">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Cierra en:</div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold tracking-widest text-primary">
            <Clock className="w-4 h-4" />
            {timeRemaining.d > 0 && <span>{timeRemaining.d}D</span>}
            <span>{timeRemaining.h.toString().padStart(2, '0')}:{timeRemaining.m.toString().padStart(2, '0')}:{timeRemaining.s.toString().padStart(2, '0')}</span>
          </div>
        </div>
      )}

      {isTimeLocked && match.status === "pending" && (
        <div className="flex flex-col items-center mb-6 gap-1">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold tracking-widest text-red-500">
            <Lock className="w-4 h-4" /> PRONÓSTICO CERRADO
          </div>
          <span className="text-[10px] text-gray-500">Cerró 2 horas antes del partido</span>
        </div>
      )}

      {/* Match Teams & Score */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Home Team */}
        <div className="flex flex-col items-center flex-1 min-w-0 gap-2 sm:gap-3">
          <div className="text-3xl sm:text-4xl">{match.homeFlag}</div>
          <span className="font-bold text-white text-center text-xs sm:text-base break-words w-full select-none">{match.homeTeam}</span>
        </div>

        {/* Score Inputs / Result */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <input
            type="number"
            min="0"
            max="20"
            value={isStarted ? (match.homeScore ?? homeScore) : homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            disabled={isLocked}
            className="w-12 h-12 sm:w-16 sm:h-16 text-center text-lg sm:text-2xl font-black bg-dark-surface border border-dark-border rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-80 disabled:cursor-not-allowed"
          />
          <span className="text-gray-500 font-bold text-sm sm:text-xl">VS</span>
          <input
            type="number"
            min="0"
            max="20"
            value={isStarted ? (match.awayScore ?? awayScore) : awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            disabled={isLocked}
            className="w-12 h-12 sm:w-16 sm:h-16 text-center text-lg sm:text-2xl font-black bg-dark-surface border border-dark-border rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-80 disabled:cursor-not-allowed"
          />
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center flex-1 min-w-0 gap-2 sm:gap-3">
          <div className="text-3xl sm:text-4xl">{match.awayFlag}</div>
          <span className="font-bold text-white text-center text-xs sm:text-base break-words w-full select-none">{match.awayTeam}</span>
        </div>
      </div>

      {/* Save Button & Modifications Info */}
      {!isStarted && !isTimeLocked && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Cambios: <span className={clsx("text-white", modsCount >= 2 && "text-red-500")}>{modsCount}/2</span>
            </span>
            {isModsLocked && (
              <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Límite alcanzado
              </span>
            )}
          </div>
          
          <motion.button
            whileTap={!isLocked ? { scale: 0.95 } : {}}
            onClick={handleSave}
            disabled={!homeScore || !awayScore || isSaving || isLocked}
            className="w-full py-3 rounded-xl font-bold text-black bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : isModsLocked ? (
              <>
                <Lock className="w-5 h-5" />
                Bloqueado
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {userPrediction ? "Actualizar Pronóstico" : "Guardar Pronóstico"}
              </>
            )}
          </motion.button>
        </div>
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
      {match.status !== "finished" && userPrediction && (isStarted || isTimeLocked) && (
        <div className="mt-6 p-3 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-between px-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="font-bold">Tu Pronóstico:</span>
          </div>
          <span className="text-white font-black text-lg bg-white/10 px-3 py-1 rounded-lg">
            {userPrediction.predictedHomeScore} - {userPrediction.predictedAwayScore}
          </span>
        </div>
      )}
    </motion.div>
  );
}
