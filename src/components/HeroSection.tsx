"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ArrowRight, Zap, Target, BarChart2, ShieldCheck, Sparkles, Flame, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HeroSection() {
  const { user } = useAuth();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // 2026 World Cup Countdown (Target: June 11, 2026)
  useEffect(() => {
    const targetDate = new Date("2026-06-11T12:00:00").getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      const element = document.getElementById("matches-board");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push("/login");
    }
  };

  return (
    <>
      <div className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 md:px-12 py-16 overflow-hidden">
        
        {/* Full-size World Cup packed crowd mega background image with dark futuristic overlay */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-[#02040a]/80 via-[#02040a]/90 to-[#02040a] z-10"></div>
          <div className="absolute inset-0 bg-radial-gradient(circle at 50% 50%, transparent 20%, #02040a 80%) z-10"></div>
          <img 
            src="/world-cup-mega-banner.png" 
            alt="FUT Stadium Packed Crowd Background" 
            className="w-full h-full object-cover scale-105 filter blur-[2px] opacity-40 animate-pulse-slow" 
            style={{ animationDuration: "12s" }}
          />
        </div>

        {/* Tactical Soccer Grid overlay lines */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
             style={{
               backgroundImage: "radial-gradient(circle at 50% 50%, transparent 60%, rgba(0,255,102,0.1) 60%, rgba(0,255,102,0.1) 62%, transparent 62%), linear-gradient(to right, rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.015) 1px, transparent 1px)",
               backgroundSize: "100% 100%, 60px 60px, 60px 60px"
             }}>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="relative z-10 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: text, countdown, key features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-7 flex flex-col items-start text-left"
          >
            {/* World Cup official tournament neon badge */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center gap-2 mb-6 px-4.5 py-2 rounded-full border border-primary/45 bg-[#0055ff]/10 text-white text-xs font-black tracking-widest uppercase shadow-[0_0_20px_rgba(0,85,255,0.25)]"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#00ff66] animate-ping" />
              <span className="text-[#00ff66] font-bold">LIVE</span>
              <span className="text-gray-400">|</span>
              <span className="tracking-widest font-black text-glow">PLATAFORMA OFICIAL OVOPACIFIC</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05] uppercase">
              VIVE LA PASIÓN<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#00ff66] to-[#ff0055] leading-none filter drop-shadow-[0_0_15px_rgba(0,85,255,0.3)]">
                DEL MUNDIAL 2026
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-gray-300 mb-8 max-w-xl leading-relaxed">
              La máxima experiencia de apuestas y pronósticos deportivos de estilo **EA Sports Ultimate Team**. Acierta en vivo, desafía amigos en ligas de honor, y gana premios épicos de la copa del mundo.
            </p>

            {/* Premium Countdown Clock */}
            <div className="mb-10 w-full max-w-xl">
              <span className="text-xs font-black tracking-widest text-[#ffd700] uppercase mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#ffd700] animate-spin" style={{ animationDuration: "10s" }} />
                CUENTA REGRESIVA PARA LA PATADA INICIAL:
              </span>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: timeLeft.days, label: "DÍAS" },
                  { value: timeLeft.hours, label: "HORAS" },
                  { value: timeLeft.minutes, label: "MINS" },
                  { value: timeLeft.seconds, label: "SEGS" }
                ].map((item, index) => (
                  <div key={index} className="glass-panel rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] relative overflow-hidden group hover:border-[#ffd700]/30 transition-all duration-300">
                    {/* Glowing golden base line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#ffd700] to-secondary opacity-80" />
                    <span className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none text-glow mb-1">
                      {String(item.value).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] text-gray-400 font-extrabold tracking-widest">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button 
                onClick={handleGetStarted}
                className="flex items-center justify-center gap-2.5 px-9 py-4.5 rounded-2xl font-black text-lg bg-gradient-to-r from-primary to-[#003cc2] text-white hover:glow-primary transition-all duration-300 transform hover:-translate-y-1 cursor-pointer active:scale-95 shadow-[0_8px_30px_rgba(0,85,255,0.3)]"
              >
                Comenzar Ahora <ArrowRight className="w-5 h-5 font-black text-[#00ff66]" />
              </button>
              <Link 
                href="/leaderboard"
                className="flex items-center justify-center px-9 py-4.5 rounded-2xl font-black text-lg glass-panel text-white hover:bg-dark-surface/50 border border-white/10 hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer active:scale-95"
              >
                <Trophy className="w-5 h-5 mr-2 text-[#ffd700] animate-pulse" />
                Ver Ligas y Retos
              </Link>
            </div>

            {/* Footer markers */}
            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-gray-400 font-bold">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#00ff66]" /> Sistema Licenciado</span>
              <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#ffd700] animate-pulse" /> Estadísticas SofaScore</span>
            </div>
          </motion.div>

          {/* Right Column: Premium EA Sports FUT interactive floating card banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
            className="lg:col-span-5 relative w-full flex justify-center"
          >
            {/* Ambient neon radial glows behind cards */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#ff0055]/15 via-transparent to-[#0055ff]/15 blur-3xl opacity-60 z-0"></div>
            
            {/* FUT-style Tilted Card Frame */}
            <div className="relative w-full aspect-[4/3] sm:aspect-[4/3] lg:aspect-[4/5] rounded-[36px] overflow-hidden glass-panel border border-primary/20 p-3.5 shadow-[0_0_60px_rgba(0,85,255,0.25)] flex items-center justify-center group transform hover:rotate-1 hover:scale-[1.02] transition-all duration-500 z-10">
              {/* FIFA Glow frame corners */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#ffd700] rounded-tl-[36px] z-20 opacity-80" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#00ff66] rounded-br-[36px] z-20 opacity-80" />
              
              <div className="absolute inset-0 bg-gradient-to-t from-[#02040a] via-[#02040a]/40 to-transparent z-10 opacity-90 pointer-events-none"></div>
              
              <img 
                src="/world-cup-scoreboard.png" 
                alt="Gran Final Mundial 2026 Scoreboard COL vs ARG" 
                className="w-full h-full object-cover rounded-[24px] transition-transform duration-1000 group-hover:scale-105" 
              />
              
              {/* Premium EA FUT card absolute content */}
              <div className="absolute bottom-8 left-8 right-8 z-20 flex flex-col items-start">
                <div className="flex gap-2 mb-3">
                  <span className="px-3 py-1 rounded-md bg-[#ff0055] text-white text-[9px] font-black tracking-widest uppercase">
                    MARQUEE MATCHUP
                  </span>
                  <span className="px-3 py-1 rounded-md bg-[#ffd700] text-black text-[9px] font-black tracking-widest uppercase">
                    5X POINTS
                  </span>
                </div>
                <h3 className="text-3xl font-black text-white leading-none uppercase tracking-wide mb-2 text-shadow-lg flex items-center gap-2">
                  🏆 GRAN FINAL 2026
                </h3>
                <p className="text-gray-300 text-xs font-semibold leading-relaxed mb-4">
                  ¡Colombia se consagra campeona del mundo al derrotar a Argentina en una final histórica y memorable en Norteamérica!
                </p>
                
                {/* Visual miniature live card */}
                <div className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-[#00ff66]/30 backdrop-blur-md shadow-[0_0_20px_rgba(0,255,102,0.15)]">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🇨🇴</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-white uppercase tracking-wider">COLOMBIA</span>
                      <span className="text-xs text-[#00ff66] font-bold">CAMPEÓN</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-[#00ff66] bg-[#00ff66]/10 px-3.5 py-1.5 rounded-xl border border-[#00ff66]/30 glow-accent">
                      2 - 0
                    </span>
                    <span className="text-[9px] text-[#ffd700] font-black uppercase mt-1.5 tracking-widest animate-pulse">FINALIZADO</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-black text-white uppercase tracking-wider">ARGENTINA</span>
                      <span className="text-xs text-gray-500 font-semibold">SUBCAMPEÓN</span>
                    </div>
                    <span className="text-3xl">🇦🇷</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Dynamic 3-Column Features Section */}
        <div className="relative z-10 w-full max-w-7xl mt-28 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Zap, color: "text-[#00ff66]", border: "group-hover:border-[#00ff66]/40", bg: "bg-[#00ff66]/5", title: "Resultados en Vivo", desc: "Sincronización de estadísticas en vivo al segundo, goles, córners y tarjetas directo del campo." },
            { icon: Target, color: "text-[#ffd700]", border: "group-hover:border-[#ffd700]/40", bg: "bg-[#ffd700]/5", title: "Retos y Ligas de Honor", desc: "Crea ligas privadas con tus amigos, comparte tu código y asciende al podio en tiempo real." },
            { icon: BarChart2, color: "text-primary", border: "group-hover:border-primary/40", bg: "bg-[#0055ff]/5", title: "Dashboard FUT", desc: "Historial completo de predicciones, gráficas interactivas y estadísticas avanzadas del usuario." }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.15, duration: 0.6 }}
              className="glass-panel p-8 rounded-[28px] border border-white/5 hover:border-primary/20 flex flex-col items-center text-center hover:bg-dark-surface/40 hover:shadow-[0_12px_40px_rgba(0,85,255,0.08)] transition-all duration-300 group cursor-default"
            >
              <div className={`p-4.5 rounded-2xl bg-dark-surface border border-white/5 ${feature.border} group-hover:scale-110 transition-all duration-300 mb-5`}>
                <feature.icon className={`w-8 h-8 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-black text-white mb-2.5 uppercase tracking-wide">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
