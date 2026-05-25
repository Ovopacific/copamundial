import HeroSection from "@/components/HeroSection";
import MatchesBoard from "@/components/MatchesBoard";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <HeroSection />
      
      <div className="relative z-10 w-full mt-10 pb-20">
        <MatchesBoard />
      </div>
    </div>
  );
}
