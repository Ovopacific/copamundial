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
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: "/slider/6.png",
      title: "🏆 GRAN FINAL 2026",
      desc: "¡COLOMBIA CAMPEÓN DEL MUNDO! Histórico 4-2 contra Portugal para levantar la tan anhelada copa.",
      score: "4 - 2",
      opponent: "PORTUGAL",
      flag: "🇵🇹",
      status: "CAMPEÓN"
    },
    {
      image: "/slider/2.png",
      title: "🏆 SEMIFINAL 2026",
      desc: "¡Magia cafetera! Colombia deslumbra al mundo entero al eliminar a Brasil con un sólido 2-0 y pasa a la final.",
      score: "2 - 0",
      opponent: "BRASIL",
      flag: "🇧🇷",
      status: "FINALISTA"
    },
    {
      image: "/slider/1.png",
      title: "🏆 CUARTOS DE FINAL 2026",
      desc: "¡Colombia domina el mediocampo y elimina a Francia con un contundente 3-1, asegurando su pase a la semifinal!",
      score: "3 - 1",
      opponent: "FRANCIA",
      flag: "🇫🇷",
      status: "CLASIFICADO"
    },
    {
      image: "/slider/4.png",
      title: "🏆 OCTAVOS DE FINAL 2026",
      desc: "¡Victoria táctica! Colombia supera la estricta muralla de Alemania con un histórico 1-0.",
      score: "1 - 0",
      opponent: "ALEMANIA",
      flag: "🇩🇪",
      status: "CLASIFICADO"
    },
    {
      image: "/slider/3.png",
      title: "🏆 FASE DE GRUPOS 2026",
      desc: "¡Victoria agónica! Colombia le gana el pulso a España 2-1 en un partido de infarto y lidera el grupo.",
      score: "2 - 1",
      opponent: "ESPAÑA",
      flag: "🇪🇸",
      status: "LÍDER"
    },
    {
      image: "/slider/5.png",
      title: "🏆 FASE DE GRUPOS 2026",
      desc: "Lluvia de goles en Norteamérica. Colombia vence a Inglaterra 3-2 en el mejor partido del torneo.",
      score: "3 - 2",
      opponent: "INGLATERRA",
      flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      status: "GANADOR"
    },
    {
      image: "/slider/7.png",
      title: "🏆 ZURDA DE ORO 2026",
      desc: "¡Zurdazo mágico del número 10! Un golazo espectacular desde fuera del área que hace vibrar al estadio entero.",
      score: "3 - 0",
      opponent: "URUGUAY",
      flag: "🇺🇾",
      status: "MAGIA"
    },
    {
      image: "/slider/8.png",
      title: "🏆 MAGIA GUAJIRA 2026",
      desc: "¡Velocidad y desborde! El extremo colombiano rompe la defensa y marca un gol de ensueño para asegurar la victoria.",
      score: "2 - 1",
      opponent: "ARGENTINA",
      flag: "🇦🇷",
      status: "IMPARABLE"
    }
  ];

  // Auto-rotate slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-4 sm:mb-6 leading-[1.05] uppercase">
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
              <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
                {[
                  { value: timeLeft.days, label: "DÍAS" },
                  { value: timeLeft.hours, label: "HORAS" },
                  { value: timeLeft.minutes, label: "MINS" },
                  { value: timeLeft.seconds, label: "SEGS" }
                ].map((item, index) => (
                  <div key={index} className="glass-panel rounded-xl sm:rounded-2xl p-2 sm:p-4 flex flex-col items-center justify-center border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] relative overflow-hidden group hover:border-[#ffd700]/30 transition-all duration-300">
                    {/* Glowing golden base line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#ffd700] to-secondary opacity-80" />
                    <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-none text-glow mb-1">
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
                className="flex items-center justify-center gap-2.5 px-6 sm:px-9 py-3.5 sm:py-4.5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg bg-gradient-to-r from-primary to-[#003cc2] text-white hover:glow-primary transition-all duration-300 transform hover:-translate-y-1 cursor-pointer active:scale-95 shadow-[0_8px_30px_rgba(0,85,255,0.3)]"
              >
                Comenzar Ahora <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 font-black text-[#00ff66]" />
              </button>
              <Link 
                href="/leaderboard"
                className="flex items-center justify-center px-6 sm:px-9 py-3.5 sm:py-4.5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg glass-panel text-white hover:bg-dark-surface/50 border border-white/10 hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer active:scale-95"
              >
                <Trophy className="w-5 h-5 mr-2 text-[#ffd700] animate-pulse" />
                Ranking Global
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
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full absolute inset-0"
                >
                  <img 
                    src={slides[currentSlide].image} 
                    alt={slides[currentSlide].title} 
                    className="w-full h-full object-cover rounded-[24px] transition-transform duration-5000 scale-100 hover:scale-110" 
                  />
                  
                  {/* Premium EA FUT card absolute content */}
                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 z-20 flex flex-col items-start">
                    <div className="flex gap-2 mb-3">
                      <span className="px-3 py-1 rounded-md bg-[#ff0055] text-white text-[9px] font-black tracking-widest uppercase shadow-[0_0_10px_rgba(255,0,85,0.5)]">
                        MARQUEE MATCHUP
                      </span>
                      <span className="px-3 py-1 rounded-md bg-[#ffd700] text-black text-[9px] font-black tracking-widest uppercase shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                        5X POINTS
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white leading-none uppercase tracking-wide mb-2 text-shadow-lg flex items-center gap-2">
                      {slides[currentSlide].title}
                    </h3>
                    <p className="text-gray-300 text-[10px] sm:text-sm font-semibold leading-relaxed mb-3 sm:mb-4 max-w-md drop-shadow-md bg-black/40 p-2 rounded-lg backdrop-blur-sm border border-white/5 line-clamp-2 sm:line-clamp-none">
                      {slides[currentSlide].desc}
                    </p>
                    
                    {/* Visual miniature live card */}
                    <div className="w-full flex items-center justify-between p-2 sm:p-3.5 rounded-2xl bg-white/10 border border-[#00ff66]/40 backdrop-blur-md shadow-[0_0_20px_rgba(0,255,102,0.2)]">
                      <div className="flex items-center gap-1.5 sm:gap-3">
                        <span className="text-2xl sm:text-3xl">🇨🇴</span>
                        <div className="flex flex-col">
                          <span className="text-[9px] sm:text-xs font-black text-white uppercase tracking-wider">COLOMBIA</span>
                          <span className="text-[8px] sm:text-[10px] text-[#00ff66] font-black tracking-widest">{slides[currentSlide].status}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center mx-1">
                        <span className="text-xl sm:text-3xl font-black text-[#00ff66] bg-[#00ff66]/10 px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-[#00ff66]/30 glow-accent">
                          {slides[currentSlide].score}
                        </span>
                        <span className="text-[7px] sm:text-[9px] text-[#ffd700] font-black uppercase mt-1 sm:mt-1.5 tracking-widest animate-pulse">FINALIZADO</span>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-3">
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] sm:text-xs font-black text-white uppercase tracking-wider">{slides[currentSlide].opponent}</span>
                          <span className="text-[8px] sm:text-[10px] text-gray-400 font-bold tracking-widest">ELIMINADO</span>
                        </div>
                        <span className="text-2xl sm:text-3xl">{slides[currentSlide].flag}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

        </div>

      </div>
    </>
  );
}
