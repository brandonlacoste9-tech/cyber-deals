
import React, { useState, useEffect } from 'react';
import { CyberhoundMascot } from './components/CyberhoundMascot';
import { SearchInterface } from './components/SearchInterface';
import { ResultDisplay } from './components/ResultDisplay';
import { ClawMachine } from './components/ClawMachine';
import { sniffDeals } from './services/geminiService';
import { SniffResult, HoundMood, Deal } from './types';
import { Ghost, ShieldAlert, Zap, History, Sparkles, LogIn, LogOut, User as UserIcon, Crown, CreditCard } from 'lucide-react';
import { auth, signInWithGoogle, logout, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, onSnapshot, query, orderBy, limit, getDoc, updateDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const [lastReset, setLastReset] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const MAX_FREE_SEARCHES = 5;
  const RESET_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week
  const [mood, setMood] = useState<HoundMood>(HoundMood.IDLE);
  const [result, setResult] = useState<SniffResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [isClawOpen, setIsClawOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        
        // Listen for profile changes (including Pro status and search count)
        const unsubProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setIsPro(data.isPro || false);
            setSearchCount(data.searchCount || 0);
            setLastReset(data.lastSearchResetAt);
          }
        });

        try {
          const docSnap = await getDoc(userRef);
          if (!docSnap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              displayName: currentUser.displayName,
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              isPro: false,
              searchCount: 0,
              lastSearchResetAt: serverTimestamp(),
              createdAt: serverTimestamp()
            });
          }
        } catch (err) {
          console.error("Error syncing user profile:", err);
        }

        return () => unsubProfile();
      } else {
        setIsPro(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle successful payment redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success' && user) {
      const userRef = doc(db, 'users', user.uid);
      updateDoc(userRef, { isPro: true }).then(() => {
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }
  }, [user]);

  const handleUpgrade = async () => {
    if (!user) {
      signInWithGoogle();
      return;
    }

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, email: user.email }),
      });
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error("Upgrade error:", err);
      setError("Payment system offline. Try again later.");
    }
  };

  const handleSniff = async (query: string) => {
    if (!user) {
      signInWithGoogle();
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    let currentSearchCount = searchCount;

    // Check for weekly reset
    if (lastReset) {
      const lastResetDate = lastReset.toDate ? lastReset.toDate() : new Date(lastReset);
      const now = new Date();
      if (now.getTime() - lastResetDate.getTime() > RESET_INTERVAL_MS) {
        currentSearchCount = 0;
        await updateDoc(userRef, {
          searchCount: 0,
          lastSearchResetAt: serverTimestamp()
        });
      }
    }

    if (!isPro && currentSearchCount >= MAX_FREE_SEARCHES) {
      setError("Weekly free search limit reached! Upgrade to Pro for unlimited sniffs.");
      setMood(HoundMood.TIRED);
      return;
    }

    setIsLoading(true);
    setError(null);
    setMood(HoundMood.SNIFFING);
    setResult(null);

    try {
      const data = await sniffDeals(query);
      setResult(data);
      setMood(HoundMood.HAPPY);
      setHistory(prev => [query, ...prev.slice(0, 4)]);
      
      // Increment search count in Firestore
      await updateDoc(userRef, {
        searchCount: (currentSearchCount || 0) + 1
      });
    } catch (err) {
      setError("The trail went cold... (API Error)");
      setMood(HoundMood.TIRED);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = () => {
    setMood(HoundMood.EXCITED);
    setTimeout(() => setMood(HoundMood.HAPPY), 2000);
  };

  const handleClawWin = (deal: Deal) => {
    setResult({
      text: `JACKPOT! The Cyber-Claw has retrieved an exclusive deal just for you. Neural scent confirmed: ${deal.title}.`,
      deals: [deal],
      sources: [{ title: deal.source, uri: deal.link }]
    });
    setMood(HoundMood.EXCITED);
    setIsClawOpen(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center cyber-grid">
      <div className="scanline"></div>
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full"></div>

      {/* Navigation Header */}
      <header className="w-full px-8 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500 p-2 rounded-lg text-black">
            <Zap size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter neon-text">
            CYBER<span className="text-cyan-500">HOUND</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {!isPro && (
                <button 
                  onClick={handleUpgrade}
                  className="hidden md:flex items-center gap-2 text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-black px-4 py-2 rounded-full hover:scale-105 transition-transform shadow-[0_0_15px_rgba(251,191,36,0.4)]"
                >
                  <Crown size={14} /> GO PRO
                </button>
              )}
              {isPro && (
                <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-amber-500 border border-amber-500/30 px-3 py-1 rounded-md tracking-tighter">
                  <Crown size={10} /> PRO MEMBER
                </div>
              )}
              <button 
                onClick={logout}
                className="hidden md:flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest border border-red-900/50 px-4 py-2 rounded-full"
              >
                <LogOut size={14} /> Logout
              </button>
              <div className="h-10 w-10 rounded-full border-2 border-cyan-500 flex items-center justify-center overflow-hidden bg-black relative">
                <img src={user.photoURL || "https://picsum.photos/id/237/100/100"} alt="Avatar" className="w-full h-full object-cover" />
                {isPro && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 border border-black">
                    <Crown size={8} className="text-black" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="flex items-center gap-2 text-xs font-bold text-cyan-500 hover:text-cyan-400 transition-colors uppercase tracking-widest border border-cyan-900/50 px-4 py-2 rounded-full"
            >
              <LogIn size={14} /> Login with Google
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl flex flex-col items-center px-6 py-12 z-10">
        
        {/* Mascot & Intro */}
        <div className="flex flex-col items-center text-center mb-12">
          <CyberhoundMascot mood={mood} />
          <div className="mt-8 space-y-2">
            <h2 className="text-4xl md:text-5xl font-black text-white">
              Sniffing out the web's best <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 italic">Deals</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-md mx-auto">
              Real-time discounts, free trials, and promo codes powered by neural scent tracking.
            </p>
            {user && !isPro && (
              <div className="mt-4 inline-flex flex-col items-center gap-2">
                <div className="inline-flex items-center gap-2 bg-cyan-950/30 border border-cyan-900/50 px-4 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">
                    {MAX_FREE_SEARCHES - searchCount} FREE SNIFFS REMAINING THIS WEEK
                  </span>
                </div>
                <p className="text-[9px] text-gray-600 uppercase tracking-tighter">
                  Resets every 7 days • Go Pro for unlimited
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full flex justify-center mb-16">
          <SearchInterface onSearch={handleSniff} isLoading={isLoading} />
        </div>

        {/* Dynamic States */}
        {isLoading && (
          <div className="flex flex-col items-center gap-4 text-cyan-500 animate-pulse">
            <p className="mono text-sm tracking-[0.2em] font-bold">SCANNING_WEB_PROTOCOLS...</p>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 bg-red-950/20 border border-red-900/50 p-6 rounded-2xl max-w-md text-center">
            <ShieldAlert size={48} className="text-red-500" />
            <p className="text-red-200 font-bold">{error}</p>
            <button onClick={() => setMood(HoundMood.IDLE)} className="text-red-400 underline text-sm">Clear Error</button>
          </div>
        )}

        {result && <ResultDisplay result={result} onAction={handleAction} />}

        {/* Idle Suggestions */}
        {!result && !isLoading && !error && (
          <div className="w-full max-w-2xl grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 opacity-60 hover:opacity-100 transition-opacity">
            {['VPN Free Trials', 'Steam Discounts', 'Nike Promos', 'Cloud Credits'].map(tag => (
              <button 
                key={tag}
                onClick={() => handleSniff(tag)}
                className="bg-cyan-950/20 border border-cyan-800/30 rounded-xl py-3 px-4 text-sm text-cyan-400 hover:bg-cyan-500 hover:text-black hover:border-cyan-500 transition-all flex items-center justify-center gap-2 group"
              >
                <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                {tag}
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Footer Content */}
      <footer className="w-full max-w-6xl px-8 py-12 border-t border-cyan-900/30 mt-20 flex flex-col md:flex-row justify-between items-center gap-8 text-gray-500 text-sm">
        <div className="flex items-center gap-4">
          <span className="mono text-cyan-800">SYSTEM_STATUS: NOMINAL</span>
          <span className="mono text-cyan-800">NODE: HOUND-01</span>
        </div>
        <p>© 2024 CYBERHOUND LABS. ALL TRAILS TRACKED.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-cyan-400 transition-colors">Privacy API</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">Scent Protocol</a>
        </div>
      </footer>

      {/* Claw Machine Trigger */}
      <button 
        onClick={() => setIsClawOpen(true)}
        className="fixed bottom-8 right-8 z-40 bg-cyan-500 text-black p-4 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:scale-110 hover:rotate-12 transition-all group"
      >
        <Zap size={24} className="group-hover:animate-pulse" />
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
          NEW
        </div>
      </button>

      <ClawMachine 
        isOpen={isClawOpen} 
        onClose={() => setIsClawOpen(false)} 
        onWin={handleClawWin} 
      />
    </div>
  );
};

export default App;
