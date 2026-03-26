
import React, { useEffect, useRef } from 'react';
import { HoundMood } from '../types';

interface MascotProps {
  mood: HoundMood;
}

export const CyberhoundMascot: React.FC<MascotProps> = ({ mood }) => {
  const isSniffing = mood === HoundMood.SNIFFING;
  const isExcited = mood === HoundMood.EXCITED;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isExcited) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'); // A short "success" beep/chime
        audioRef.current.volume = 0.3;
      }
      audioRef.current.play().catch(e => console.log('Audio playback blocked'));
    }
  }, [isExcited]);
  
  return (
    <div className={`relative w-48 h-48 transition-all duration-300 ${isSniffing ? 'bark-animation' : ''} ${isExcited ? 'scale-110' : ''}`}>
      <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] ${isExcited ? 'animate-bounce' : ''}`}>
        {/* Hound Head */}
        <path 
          d="M40,100 Q40,40 100,40 Q160,40 160,100 L160,140 Q160,160 140,160 L60,160 Q40,160 40,140 Z" 
          fill="none" 
          stroke="#22d3ee" 
          strokeWidth="4"
          className={isSniffing ? 'animate-pulse' : ''}
        />
        
        {/* Ears */}
        <path d="M40,70 L20,40 L60,60" fill="none" stroke="#22d3ee" strokeWidth="4" />
        <path d="M160,70 L180,40 L140,60" fill="none" stroke="#22d3ee" strokeWidth="4" />

        {/* Eyes - Cybernetic */}
        <circle cx="75" cy="90" r="8" fill={isSniffing ? "#ef4444" : isExcited ? "#fbbf24" : "#22d3ee"} />
        <circle cx="125" cy="90" r="8" fill={isSniffing ? "#ef4444" : isExcited ? "#fbbf24" : "#22d3ee"} />
        <rect x="65" y="85" width="20" height="2" fill="#000" opacity="0.3" />
        <rect x="115" y="85" width="20" height="2" fill="#000" opacity="0.3" />

        {/* Nose */}
        <path 
          d="M90,120 L110,120 L100,135 Z" 
          fill={isExcited ? "#fbbf24" : "#22d3ee"} 
          className={isSniffing || isExcited ? 'animate-bounce' : ''}
        />

        {/* Mouth/Jaw */}
        <path 
          d={isSniffing || isExcited ? "M80,145 Q100,160 120,145" : "M80,145 Q100,150 120,145"} 
          fill="none" 
          stroke={isExcited ? "#fbbf24" : "#22d3ee"} 
          strokeWidth="3" 
        />

        {/* Cyber Detail */}
        <path d="M100,40 L100,20 M60,160 L60,180 M140,160 L140,180" stroke="#22d3ee" strokeWidth="2" opacity="0.5" />
      </svg>
      
      {/* Radar Effect for Sniffing */}
      {isSniffing && (
        <div className="absolute inset-0 border-4 border-cyan-500 rounded-full animate-ping opacity-20"></div>
      )}
      
      {/* Sparkles for Excited */}
      {isExcited && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full border-4 border-amber-400 rounded-full animate-ping opacity-40"></div>
        </div>
      )}
    </div>
  );
};
