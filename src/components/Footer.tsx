import { Shield, ShieldAlert, HeartHandshake } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full glass-panel border-t border-dark-border mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-primary glow-primary" />
              <span className="text-xl font-bold tracking-wider text-glow text-white">OVOPACIFIC</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              La plataforma oficial de pronósticos y juegos deportivos de Ovopacific. 
              Experimenta la adrenalina del Mundial con la tecnología más avanzada, 
              participa, compite con tus amigos y gana premios exclusivos.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-bold mb-4">Empresa</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors">Sobre Nosotros</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Términos y Condiciones</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Juego Responsable</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Soporte</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors">Centro de Ayuda</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Reglas del Juego</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contacto</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-dark-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} Ovopacific. Todos los derechos reservados. 
            El juego puede ser adictivo, por favor juega con responsabilidad.
          </p>
          
          <div className="flex gap-4 text-gray-500">
            <span title="Seguridad Garantizada" className="hover:text-primary transition-colors cursor-help">
              <Shield className="w-5 h-5" />
            </span>
            <span title="Juego Responsable +18" className="hover:text-primary transition-colors cursor-help">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <span title="Soporte 24/7" className="hover:text-primary transition-colors cursor-help">
              <HeartHandshake className="w-5 h-5" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
