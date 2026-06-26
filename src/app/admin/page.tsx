"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Plus, Save, Activity, Lock, AlertCircle, Eye, X, Users, BarChart2, TrendingUp, Trash2 } from "lucide-react";
import { Match, MatchStatus, Prediction, User as CustomUser } from "@/types";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  getDoc, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";
import { calculatePredictionPoints } from "@/lib/points";
import { clsx } from "clsx";

export default function AdminPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  
  // Dashboard states
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPredictions, setTotalPredictions] = useState(0);
  const [exhaustedUsers, setExhaustedUsers] = useState(0);

  // Predictions Modal state
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchPredictions, setMatchPredictions] = useState<(Prediction & { userName: string, lastConnection?: Date })[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  
  // New match form state
  const [newMatch, setNewMatch] = useState({
    homeTeam: "", awayTeam: "", homeFlag: "", awayFlag: "", date: ""
  });
  
  const [recalculating, setRecalculating] = useState(false);
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);

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
          if (
            data.role === "admin" || 
            data.isAdmin === true || 
            user.email === "yolfranllecastillo@gmail.com" ||
            process.env.NODE_ENV === "development"
          ) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          if (process.env.NODE_ENV === "development") setIsAdmin(true);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        if (process.env.NODE_ENV === "development") setIsAdmin(true);
      } finally {
        setLoadingAdmin(false);
      }
    };

    checkAdmin();
  }, [user]);

  // Subscribe to Maintenance Mode status
  useEffect(() => {
    if (!db || !isAdmin) return;
    const unsubscribe = onSnapshot(doc(db, "settings", "maintenance"), (docSnap) => {
      if (docSnap.exists()) {
        setMaintenanceActive(!!docSnap.data().active);
      } else {
        setMaintenanceActive(false);
      }
    }, (error) => {
      console.error("Error fetching maintenance status:", error);
    });
    return () => unsubscribe();
  }, [isAdmin]);

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

      list.sort((a, b) => a.date.getTime() - b.date.getTime());
      setMatches(list);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Load dashboard stats
  useEffect(() => {
    if (!db || !isAdmin) return;

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setTotalUsers(snapshot.size);
    });

    const unsubPreds = onSnapshot(collection(db, "predictions"), (snapshot) => {
      setTotalPredictions(snapshot.size);
      let exhausted = 0;
      snapshot.forEach(doc => {
        if (doc.data().modificationsCount >= 2) exhausted++;
      });
      setExhaustedUsers(exhausted);
    });

    return () => {
      unsubUsers();
      unsubPreds();
    };
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

      if (match.status === "finished" && !(match as any).processed) {
        const q = query(collection(db, "predictions"), where("matchId", "==", match.id));
        const predSnapshot = await getDocs(q);

        let processedCount = 0;

        for (const docSnap of predSnapshot.docs) {
          const prediction = docSnap.data() as Prediction;
          const pointsResult = calculatePredictionPoints(match, prediction);

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

          await updateDoc(docSnap.ref, { locked: true });
          processedCount++;
        }

        await updateDoc(matchRef, {
          homeScore: match.homeScore !== undefined ? match.homeScore : 0,
          awayScore: match.awayScore !== undefined ? match.awayScore : 0,
          status: "finished",
          processed: true
        });

        alert(`Partido finalizado. Se procesaron ${processedCount} pronósticos y se sumaron los puntos.`);
      } else {
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

  const handleToggleMaintenance = async (active: boolean) => {
    if (!db) return;
    setTogglingMaintenance(true);
    try {
      await setDoc(doc(db, "settings", "maintenance"), {
        active: active,
        updatedAt: new Date(),
        updatedBy: user?.uid
      });
      alert(active ? "Plataforma puesta FUERA DE SERVICIO." : "Plataforma HABILITADA y en servicio.");
    } catch (error) {
      console.error("Error setting maintenance status:", error);
      alert("Error al cambiar el estado de mantenimiento.");
    } finally {
      setTogglingMaintenance(false);
    }
  };

  const handleRecalculateAllPoints = async () => {
    if (!db) return;
    const confirmRecalc = window.confirm("¿Estás seguro de que deseas recalcular los puntos de TODOS los usuarios? Esto recalculará los puntos basándose únicamente en los marcadores exactos de los partidos finalizados.");
    if (!confirmRecalc) return;

    setRecalculating(true);
    try {
      // 1. Get all matches
      const matchesSnap = await getDocs(collection(db, "matches"));
      const allMatches: Match[] = [];
      matchesSnap.forEach(d => {
        const data = d.data();
        allMatches.push({
          ...data,
          id: d.id,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
        } as Match);
      });

      // 2. Get all predictions
      const predsSnap = await getDocs(collection(db, "predictions"));
      const allPredictions: Prediction[] = [];
      predsSnap.forEach(d => {
        allPredictions.push({
          id: d.id,
          ...d.data()
        } as Prediction);
      });

      // 3. Get all users
      const usersSnap = await getDocs(collection(db, "users"));
      
      let updatedCount = 0;

      for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        const userPreds = allPredictions.filter(p => p.userId === userId);
        
        let totalPoints = 0;
        let exactCount = 0;
        let correctCount = 0;

        for (const pred of userPreds) {
          const match = allMatches.find(m => m.id === pred.matchId);
          if (match && match.status === "finished") {
            const pointsResult = calculatePredictionPoints(match, pred);
            totalPoints += pointsResult.pointsEarned;
            if (pointsResult.isExactScore) exactCount++;
            if (pointsResult.isCorrectResult) correctCount++;
          }
        }

        // Update user
        await updateDoc(doc(db, "users", userId), {
          points: totalPoints,
          exactScores: exactCount,
          correctResults: correctCount
        });
        updatedCount++;
      }

      alert(`¡Puntos recalculados exitosamente! Se actualizaron ${updatedCount} usuarios.`);
    } catch (error) {
      console.error("Error recalculating points:", error);
      alert("Error al recalcular los puntos.");
    } finally {
      setRecalculating(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!db) return;
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este partido? Esta acción no se puede deshacer y los pronósticos asociados quedarán huérfanos.");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "matches", matchId));
      alert("Partido eliminado con éxito.");
    } catch (error) {
      console.error("Error deleting match:", error);
      alert("Error al eliminar el partido.");
    }
  };

  const openPredictionsModal = async (match: Match) => {
    if (!db) return;
    setSelectedMatch(match);
    setLoadingPredictions(true);

    try {
      const q = query(collection(db, "predictions"), where("matchId", "==", match.id));
      const predSnapshot = await getDocs(q);
      
      const preds = [];
      for (const docSnap of predSnapshot.docs) {
        const p = docSnap.data() as Prediction;
        const userRef = doc(db, "users", p.userId);
        const userSnap = await getDoc(userRef);
        
        preds.push({
          ...p,
          userName: userSnap.exists() ? userSnap.data().name : "Usuario Desconocido",
          lastConnection: userSnap.exists() && userSnap.data().lastConnection ? userSnap.data().lastConnection.toDate() : undefined
        });
      }

      setMatchPredictions(preds);
    } catch (error) {
      console.error("Error loading predictions:", error);
    } finally {
      setLoadingPredictions(false);
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
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 py-12 px-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-10 w-full">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/20 glow-primary/10">
            <Settings className="w-8 h-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-white">Panel de Control</h1>
            </div>
            <p className="text-gray-400">Gestiona partidos, resultados y calcula puntos en Firestore.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {maintenanceActive ? (
            <button
              onClick={() => handleToggleMaintenance(false)}
              disabled={togglingMaintenance}
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-500 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              🟢 Habilitar Página
            </button>
          ) : (
            <button
              onClick={() => handleToggleMaintenance(true)}
              disabled={togglingMaintenance}
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              🔴 Fuera de Servicio
            </button>
          )}
          <button
            onClick={handleRecalculateAllPoints}
            disabled={recalculating}
            className="w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-black bg-primary hover:bg-white transition-colors shadow-[0_0_15px_rgba(0,240,255,0.2)] disabled:opacity-50"
          >
            {recalculating ? "Recalculando..." : "Recalcular Todos los Puntos"}
          </button>
        </div>
      </div>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-panel p-6 rounded-2xl border border-dark-border flex items-center gap-4">
          <div className="p-4 rounded-xl bg-blue-500/20 text-blue-500">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Usuarios Activos</p>
            <p className="text-3xl font-black text-white">{totalUsers}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-dark-border flex items-center gap-4">
          <div className="p-4 rounded-xl bg-primary/20 text-primary">
            <BarChart2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pronósticos</p>
            <p className="text-3xl font-black text-white">{totalPredictions}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-dark-border flex items-center gap-4">
          <div className="p-4 rounded-xl bg-red-500/20 text-red-500">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Cambios Agotados</p>
            <p className="text-3xl font-black text-white">{exhaustedUsers}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CREATE MATCH FORM */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 rounded-2xl border border-dark-border sticky top-24">
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
                <label className="block text-xs font-medium text-gray-400 mb-1">Fecha y Hora EXACTA</label>
                <input type="datetime-local" value={newMatch.date} onChange={e => setNewMatch({...newMatch, date: e.target.value})} required
                       className="w-full bg-dark-surface border border-dark-border rounded-lg p-2.5 text-white focus:border-primary focus:outline-none" />
                <p className="text-[10px] text-gray-500 mt-1">El pronóstico se bloqueará automáticamente en este minuto exacto.</p>
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
              <motion.div key={match.id} layout className="glass-panel p-5 rounded-2xl border border-dark-border flex flex-col items-center gap-4">
                
                <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 justify-between w-full">
                  <div className="flex items-center gap-2 w-full sm:w-1/3 justify-start">
                    <span className="text-2xl">{match.homeFlag}</span>
                    <span className="font-bold text-white truncate">{match.homeTeam}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 justify-center w-full sm:w-1/3">
                    <input type="number" min="0" value={match.homeScore ?? ""} onChange={e => handleUpdateMatchField(match.id, { homeScore: e.target.value ? parseInt(e.target.value) : undefined })}
                           disabled={match.status === "finished" && (match as any).processed}
                           className="w-12 h-12 text-center text-xl font-black bg-dark-surface border border-dark-border rounded-lg text-white focus:border-primary disabled:opacity-50" />
                    <span className="text-gray-500 font-bold">VS</span>
                    <input type="number" min="0" value={match.awayScore ?? ""} onChange={e => handleUpdateMatchField(match.id, { awayScore: e.target.value ? parseInt(e.target.value) : undefined })}
                           disabled={match.status === "finished" && (match as any).processed}
                           className="w-12 h-12 text-center text-xl font-black bg-dark-surface border border-dark-border rounded-lg text-white focus:border-primary disabled:opacity-50" />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-1/3 justify-end">
                    <span className="font-bold text-white truncate text-right">{match.awayTeam}</span>
                    <span className="text-2xl">{match.awayFlag}</span>
                  </div>
                </div>

                <div className="w-full flex items-center justify-between mt-2 pt-4 border-t border-dark-border/50">
                  <button 
                    onClick={() => openPredictionsModal(match)}
                    className="flex items-center gap-2 text-sm font-bold text-primary hover:text-white transition-colors"
                  >
                    <Eye className="w-4 h-4" /> Ver Pronósticos
                  </button>

                  <div className="flex items-center gap-2">
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
                    
                    <button 
                      onClick={() => handleDeleteMatch(match.id)}
                      className="p-2.5 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/40 transition-colors"
                      title="Eliminar partido"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* PREDICTIONS MODAL */}
      <AnimatePresence>
        {selectedMatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMatch(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[85vh] flex flex-col glass-panel p-6 rounded-2xl border border-dark-border shadow-2xl overflow-hidden bg-dark-bg"
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-dark-border">
                <div>
                  <h2 className="text-2xl font-black text-white">
                    Pronósticos: {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}
                  </h2>
                  <p className="text-gray-400 text-sm font-medium mt-1">
                    {matchPredictions.length} pronósticos registrados
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loadingPredictions ? (
                  <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : matchPredictions.length === 0 ? (
                  <div className="text-center py-20 text-gray-500 font-medium">
                    Ningún usuario ha pronosticado este partido todavía.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-400 uppercase bg-dark-surface/50 sticky top-0 backdrop-blur-md">
                        <tr>
                          <th className="px-4 py-3 font-bold rounded-tl-lg">Usuario</th>
                          <th className="px-4 py-3 font-bold text-center">Pronóstico</th>
                          <th className="px-4 py-3 font-bold text-center">Cambios</th>
                          <th className="px-4 py-3 font-bold text-center">Último Cambio</th>
                          <th className="px-4 py-3 font-bold text-center">Última Conexión</th>
                          {selectedMatch.status === "finished" && (
                            <th className="px-4 py-3 font-bold text-right rounded-tr-lg">Puntos</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {matchPredictions.map((pred, idx) => {
                          const points = selectedMatch.status === "finished" 
                            ? calculatePredictionPoints(selectedMatch, pred).pointsEarned 
                            : null;
                          
                          return (
                            <tr key={idx} className="border-b border-dark-border/50 hover:bg-white/5 transition-colors">
                              <td className="px-4 py-4 font-bold text-white whitespace-nowrap">
                                {pred.userName}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center justify-center gap-2 font-black text-lg">
                                  <span className="w-6 text-center">{pred.predictedHomeScore}</span>
                                  <span className="text-gray-500 text-sm font-bold">-</span>
                                  <span className="w-6 text-center">{pred.predictedAwayScore}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className={clsx("px-2 py-1 rounded-full text-xs font-bold", 
                                  (pred.modificationsCount || 0) >= 2 ? "bg-red-500/20 text-red-500" : "bg-white/10 text-gray-300"
                                )}>
                                  {pred.modificationsCount || 0}/2
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center text-gray-400 text-xs">
                                {pred.lastModifiedAt && (pred.lastModifiedAt as any).toDate 
                                  ? (pred.lastModifiedAt as any).toDate().toLocaleString() 
                                  : "Original"}
                              </td>
                              <td className="px-4 py-4 text-center text-gray-400 text-xs">
                                {pred.lastConnection ? pred.lastConnection.toLocaleString() : "Desconocida"}
                              </td>
                              {selectedMatch.status === "finished" && (
                                <td className="px-4 py-4 text-right">
                                  <span className={clsx("font-black text-lg", 
                                    points === 5 ? "text-primary" : points === 3 ? "text-green-400" : "text-gray-600"
                                  )}>
                                    +{points}
                                  </span>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
