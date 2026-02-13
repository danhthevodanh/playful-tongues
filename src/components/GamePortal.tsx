import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface GamePortalProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  to: string;
  delay?: number;
}

export function GamePortal({ title, description, icon, color, to, delay = 0 }: GamePortalProps) {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={() => navigate(to)}
      className="group relative flex flex-col items-center gap-3 rounded-3xl border-4 border-transparent p-6 transition-colors hover:border-foreground/10"
      style={{ background: color }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: "spring" }}
      whileHover={{ scale: 1.05, rotate: 1 }}
      whileTap={{ scale: 0.97 }}
    >
      <motion.span
        className="text-5xl"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay }}
      >
        {icon}
      </motion.span>
      <span className="font-fredoka text-xl font-bold text-white drop-shadow-md">
        {title}
      </span>
      <span className="text-sm font-nunito text-white/80">
        {description}
      </span>
      <motion.div
        className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100"
        style={{ boxShadow: `0 0 30px ${color}` }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}
