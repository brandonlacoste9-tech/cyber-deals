
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Trophy, X, Gift, Sparkles } from 'lucide-react';
import { Deal } from '../types';

interface ClawMachineProps {
  isOpen: boolean;
  onClose: () => void;
  onWin: (deal: Deal) => void;
}

const PRIZES: Deal[] = [
  {
    id: 'claw-1',
    title: '90% Off Cyberpunk 2077',
    description: 'Exclusive claw machine find! Limited time discount.',
    category: 'Discount',
    link: 'https://www.gog.com/game/cyberpunk_2077',
    source: 'Cyberhound Claw',
    relevanceScore: 99
  },
  {
    id: 'claw-2',
    title: 'Free 1 Month NordVPN',
    description: 'Secure your scent with a free month of VPN.',
    category: 'Free Trial',
    link: 'https://nordvpn.com',
    source: 'Cyberhound Claw',
    relevanceScore: 95
  },
  {
    id: 'claw-3',
    title: '$50 AWS Credits',
    description: 'Power your own neural networks with free credits.',
    category: 'Limited Time',
    link: 'https://aws.amazon.com',
    source: 'Cyberhound Claw',
    relevanceScore: 98
  }
];

export const ClawMachine: React.FC<ClawMachineProps> = ({ isOpen, onClose, onWin }) => {
  const [clawPos, setClawPos] = useState(50); // 0 to 100
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<'idle' | 'moving' | 'grabbing' | 'won'>('idle');
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameStatus === 'idle' && isOpen) {
      const interval = setInterval(() => {
        setClawPos(prev => {
          const next = prev + (Math.random() > 0.5 ? 5 : -5);
          return Math.max(10, Math.min(90, next));
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [gameStatus, isOpen]);

  const handleGrab = async () => {
    if (gameStatus !== 'idle') return;
    
    setGameStatus('grabbing');
    setIsGrabbing(true);

    // Animation sequence
    // 1. Claw goes down
    // 2. Check for hit
    // 3. Claw goes up (with prize if hit)
    
    setTimeout(() => {
      // Check if claw is near a prize
      // Prizes are at 25%, 50%, 75%
      const prizePositions = [25, 50, 75];
      const hitIndex = prizePositions.findIndex(pos => Math.abs(pos - clawPos) < 10);
      
      if (hitIndex !== -1) {
        setPrizeIndex(hitIndex);
        setGameStatus('won');
        setTimeout(() => {
          onWin(PRIZES[hitIndex]);
        }, 1500);
      } else {
        setTimeout(() => {
          setGameStatus('idle');
          setIsGrabbing(false);
        }, 1000);
      }
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-gray-900 border-2 border-cyan-500 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.3)]"
          >
            {/* Header */}
            <div className="bg-cyan-500 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2 text-black font-black italic uppercase tracking-tighter">
                <Zap size={20} />
                Cyber-Claw Deal Grabber
              </div>
              <button onClick={onClose} className="text-black hover:rotate-90 transition-transform">
                <X size={24} />
              </button>
            </div>

            {/* Game Area */}
            <div className="relative h-80 bg-black/60 p-4 flex flex-col justify-between overflow-hidden" ref={containerRef}>
              {/* Top Rail */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gray-800 border-b border-cyan-900/50"></div>

              {/* The Claw */}
              <motion.div 
                className="absolute top-0 z-20 flex flex-col items-center"
                animate={{ 
                  left: `${clawPos}%`,
                  y: isGrabbing ? 180 : 0
                }}
                transition={{ 
                  left: { type: 'spring', stiffness: 50, damping: 15 },
                  y: { duration: 1, times: [0, 0.5, 1] }
                }}
              >
                <div className="w-1 h-20 bg-cyan-500/50"></div>
                <div className="relative">
                  <div className={`w-12 h-12 border-4 border-cyan-500 rounded-full flex items-center justify-center bg-black ${isGrabbing ? 'animate-pulse' : ''}`}>
                    <Zap size={20} className="text-cyan-500" />
                  </div>
                  {/* Prize being held */}
                  {gameStatus === 'won' && prizeIndex !== null && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-10 left-1/2 -translate-x-1/2 w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.6)]"
                    >
                      <Gift size={20} className="text-black" />
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Prizes at bottom */}
              <div className="mt-auto flex justify-around items-end pb-4">
                {[25, 50, 75].map((pos, idx) => (
                  <div 
                    key={idx}
                    className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${
                      prizeIndex === idx ? 'opacity-0 scale-0' : 'bg-cyan-950/20 border-cyan-900/50 hover:border-cyan-400'
                    }`}
                  >
                    <Gift size={32} className="text-cyan-800" />
                  </div>
                ))}
              </div>

              {/* Glass Reflection */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 via-transparent to-white/5"></div>
            </div>

            {/* Controls */}
            <div className="p-8 bg-gray-900 flex flex-col items-center gap-6">
              {gameStatus === 'won' ? (
                <div className="text-center animate-bounce">
                  <h3 className="text-2xl font-black text-amber-400 flex items-center gap-2">
                    <Trophy /> JACKPOT!
                  </h3>
                  <p className="text-gray-400 text-sm">Neural scent locked on target.</p>
                </div>
              ) : (
                <button 
                  onClick={handleGrab}
                  disabled={gameStatus !== 'idle'}
                  className={`w-full py-4 rounded-2xl font-black text-xl tracking-widest transition-all ${
                    gameStatus === 'idle' 
                      ? 'bg-cyan-500 text-black hover:scale-105 shadow-[0_0_20px_rgba(34,211,238,0.4)]' 
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {gameStatus === 'idle' ? 'GRAB DEAL' : 'SNIFFING...'}
                </button>
              )}
              
              <div className="flex gap-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                <div className="flex items-center gap-1"><Sparkles size={10} /> 100% Neural</div>
                <div className="flex items-center gap-1"><Zap size={10} /> High Voltage</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
