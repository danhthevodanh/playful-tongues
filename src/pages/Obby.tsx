import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TempleScene } from "@/components/obby/TempleScene";

export default function Obby() {
  const navigate = useNavigate();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#2a2a28]">
      {/* Back button overlay */}
      <div className="pointer-events-auto absolute top-4 left-4 z-20">
        <Button
          variant="ghost"
          className="rounded-full bg-card/60 font-fredoka backdrop-blur-sm hover:bg-card/80"
          onClick={() => navigate("/")}
        >
          ← Home
        </Button>
      </div>

      <TempleScene />
    </div>
  );
}
