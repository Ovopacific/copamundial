"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { Settings, Plus, Save, Activity, Lock, AlertCircle } from "lucide-react";
import { Match, MatchStatus, Prediction } from "@/types";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";
import { calculatePredictionPoints } from "@/lib/points";

export default function AdminPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  
  // New match form state
  const [newMatch, setNewMatch] = useState({
    homeTeam: "", awayTeam: "", homeFlag: "", awayFlag: "", date: ""
  });

  // Verify Admin Role in Firestore
  useEffect(() => {
    if (!db) {
      setLoadingAdmin(false);
      return;
    }

    if (!user) {
      setIsAdmin(false);
      setLoadingAdmin(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          // Grant admin if role is 'admin', isAdmin is true, OR if email is the hardcoded admin email
          if (
            data.role === "admin" || 
            data.isAdmin === true || 
            user.email === "tu_correo_admin@gmail.com" ||
            process.env.NODE_ENV === "development" // Auto-grant admin in local development for easier testing
          ) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          // If profile doc doesn't exist yet but user is in local dev
          if (process.env.NODE_ENV === "development") {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        // Fallback for local development
        if (process.env.NODE_ENV === "development") {
          setIsAdmin(true);
        }
      } finally {
        setLoadingAdmin(false);
      }
    };

    checkAdmin();
  }, [user]);

  // Load matches from Firestore in real-time
  useEffect(() => {
    if (!db || !isAdmin) return;

    const unsubscribe = onSnapshot(collection(db, "matches"), (snapshot) => {
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
    }, (error) => {
      console.error("Error loading matches for admin:", error);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    const matchId = "m_" + Date.now();
    try {
      await setDoc(doc(db, "matches", matchId), {
        id: matchId,
        homeTeam: newMatch.homeTeam,
        awayTeam: newMatch.awayTeam,
        homeFlag: newMatch.homeFlag,
        awayFlag: newMatch.awayFlag,
        date: new Date(newMatch.date),
        status: "pending",
        processed: false
      });
      setNewMatch({ homeTeam: "", awayTeam: "", homeFlag: "", awayFlag: "", date: "" });
      alert("Partido creado con éxito.");
    } catch (error) {
      console.error("Error creating match:", error);
      alert("Error al crear partido en Firestore.");
    }
  };

  const handleUpdateMatchField = (id: string, updates: Partial<Match>) => {
    setMatches(matches.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleSaveMatch = async (match: Match) => {
    if (!db) return;
    setSavingId(match.id);

    try {
      const matchRef = doc(db, "matches", match.id);

      // Check if match is set to finished and has not been processed yet
      if (match.status === "finished" && !(match as any).processed) {
        // Fetch all predictions for this match
        const q = query(collection(db, "predictions"), where("matchId", "==", match.id));
        const predSnapshot = await getDocs(q);

        let processedCount = 0;

        for (const docSnap of predSnapshot.docs) {
          const prediction = docSnap.data() as Prediction;
          const pointsResult = calculatePredictionPoints(match, prediction);

          // Update user points and stats in Firestore
          const userRef = doc(db, "users", prediction.userId);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            const currentPoints = userData.points || 0;
            const currentExact = userData.exactScores || 0;
            const currentCorrect = userData.correctResults || 0;

            await updateDoc(userRef, {
              points: currentPoints + pointsResult.pointsEarned,
              exactScores: currentExact + (pointsResult.isExactScore ? 1 : 0),
              correctResults: currentCorrect + (pointsResult.isCorrectResult ? 1 : 0)
            });
          }

          // Lock the prediction so it cannot be edited
          await updateDoc(docSnap.ref, { locked: true });
          processedCount++;
        }

        // Save match status as finished and processed: true
        await updateDoc(matchRef, {
          homeScore: match.homeScore !== undefined ? match.homeScore : 0,
          awayScore: match.awayScore !== undefined ? match.awayScore : 0,
          status: "finished",
          processed: true
        });

        alert(`Partido finalizado. Se procesaron ${processedCount} pronósticos y se sumaron los puntos.`);
      } else {
        // Normal update (status pending/live or already processed finished match)
        await updateDoc(matchRef, {
          homeScore: match.homeScore !== undefined ? match.homeScore : null,
          awayScore: match.awayScore !== undefined ? match.awayScore : null,
          status: match.status
        });
        alert("Partido actualizado correctamente.");
      }
    } catch (error) {
      console.error("Error saving match:", error);
      alert("Error al guardar cambios en el partido.");
    } finally {
      setSavingId(null);
    }
  };

  if (loadingAdmin) {
    return (
      <div className="w-full flex justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,240,255,0.4)]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center py-20 px-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
        <h1 className="text-3xl font-bold text-white mb-2">Acceso Denegado</h1>
        <p className="text-gray-400 max-w-md">
          No tienes permisos de administrador. En producción, tu correo debe estar autorizado o tu perfil debe tener el rol de administrador.
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="text-primary text-xs mt-4">
            Nota de Dev: En desarrollo deberías tener acceso automáticamente. Revisa si iniciaste sesión.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 py-12 px-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 rounded-xl bg-primary/20 glow-primary/10">
          <Settings className="w-8 h-8 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white">Panel de Control</h1>
            {process.env.NODE_ENV === "development" && (
              <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-bold uppercase">Dev Mode</span>
            )}
          </div>
          <p className="text-gray-400">Gestiona partidos, resultados y calcula puntos en Firestore.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CREATE MATCH FORM */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 rounded-2xl border border-dark-border">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Nuevo Partido
            </h2>
            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Local (Nombre)</label>
                  <input type="text" value={newMatch.homeTeam} onChange={e => setNewMatch({...newMatch, homeTeam: e.target.value})} required
                         className="w-full bg-dark-surface border border-dark-border rounded-lg p-2.5 text-white focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Bandera / Emoji</label>
                  <input type="text" value={newMatch.homeFlag} onChange={e => setNewMatch({...newMatch, homeFlag: e.target.value})} required
                         className="w-full bg-dark-surface border border-dark-border rounded-lg p-2.5 text-white focus:border-primary focus:outline-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Visitante (Nombre)</label>
                  <input type="text" value={newMatch.awayTeam} onChange={e => setNewMatch({...newMatch, awayTeam: e.target.value})} required
                         className="w-full bg-dark-surface border border-dark-border rounded-lg p-2.5 text-white focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Bandera / Emoji</label>
                  <input type="text" value={newMatch.awayFlag} onChange={e => setNewMatch({...newMatch, awayFlag: e.target.value})} required
                         className="w-full bg-dark-surface border border-dark-border rounded-lg p-2.5 text-white focus:border-primary focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Fecha y Hora</label>
                <input type="datetime-local" value={newMatch.date} onChange={e => setNewMatch({...newMatch, date: e.target.value})} required
                       className="w-full bg-dark-surface border border-dark-border rounded-lg p-2.5 text-white focus:border-primary focus:outline-none" />
              </div>

              <button type="submit" className="w-full py-3 mt-4 rounded-lg font-bold text-black bg-primary hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" /> Crear Partido
              </button>
            </form>
          </div>
        </div>

        {/* MANAGE MATCHES */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-white mb-6">Partidos Activos ({matches.length})</h2>
          
          {matches.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No hay partidos en la base de datos.
            </div>
          ) : (
            matches.map(match => (
              <motion.div key={match.id} layout className="glass-panel p-5 rounded-2xl border border-dark-border flex flex-col sm:flex-row items-center gap-6">
                
                <div className="flex-1 flex items-center gap-4 justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{match.homeFlag}</span>
                    <span className="font-bold text-white w-20 truncate">{match.homeTeam}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" value={match.homeScore ?? ""} onChange={e => handleUpdateMatchField(match.id, { homeScore: e.target.value ? parseInt(e.target.value) : undefined })}
                           disabled={match.status === "finished" && (match as any).processed}
                           className="w-12 h-12 text-center text-xl font-black bg-dark-surface border border-dark-border rounded-lg text-white focus:border-primary disabled:opacity-50" />
                    <span className="text-gray-500 font-bold">VS</span>
                    <input type="number" min="0" value={match.awayScore ?? ""} onChange={e => handleUpdateMatchField(match.id, { awayScore: e.target.value ? parseInt(e.target.value) : undefined })}
                           disabled={match.status === "finished" && (match as any).processed}
                           className="w-12 h-12 text-center text-xl font-black bg-dark-surface border border-dark-border rounded-lg text-white focus:border-primary disabled:opacity-50" />
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <span className="font-bold text-white w-20 truncate text-right">{match.awayTeam}</span>
                    <span className="text-2xl">{match.awayFlag}</span>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
                  <select 
                    value={match.status} 
                    onChange={e => handleUpdateMatchField(match.id, { status: e.target.value as MatchStatus })}
                    disabled={match.status === "finished" && (match as any).processed}
                    className="bg-dark-surface border border-dark-border rounded-lg p-2 text-sm text-white focus:border-primary outline-none disabled:opacity-50"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="live">EN VIVO</option>
                    <option value="finished">Finalizado</option>
                  </select>
                  
                  <button 
                    onClick={() => handleSaveMatch(match)}
                    disabled={savingId === match.id || (match.status === "finished" && (match as any).processed)}
                    className="p-2.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/40 transition-colors disabled:opacity-40"
                    title={match.status === "finished" && (match as any).processed ? "Puntos ya procesados" : "Guardar cambios"}
                  >
                    {savingId === match.id ? (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
