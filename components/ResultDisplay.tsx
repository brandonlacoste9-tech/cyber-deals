
import React, { useState, useEffect } from 'react';
import { ExternalLink, Tag, Globe, CheckCircle2, BookmarkPlus, Copy, Check, Zap, Trash2, Filter, ArrowUpDown } from 'lucide-react';
import { SniffResult, Deal } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';

interface ResultDisplayProps {
  result: SniffResult;
  onAction?: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onAction }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<Deal[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredDeals = result.deals
    .filter(deal => filterCategory === 'All' || deal.category === filterCategory)
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.relevanceScore - b.relevanceScore;
      return b.relevanceScore - a.relevanceScore;
    });

  useEffect(() => {
    if (!auth.currentUser) return;

    const watchlistRef = collection(db, 'users', auth.currentUser.uid, 'watchlist');
    const q = query(watchlistRef, orderBy('savedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as Deal);
      setWatchlist(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}/watchlist`);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleCopy = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    onAction?.();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleWatchlist = async (deal: Deal) => {
    if (!auth.currentUser) {
      alert("Please login to save deals to your watchlist!");
      return;
    }

    const dealRef = doc(db, 'users', auth.currentUser.uid, 'watchlist', deal.id);
    const isSaved = watchlist.some(item => item.id === deal.id);

    try {
      if (isSaved) {
        await deleteDoc(dealRef);
      } else {
        await setDoc(dealRef, {
          ...deal,
          userId: auth.currentUser.uid,
          savedAt: serverTimestamp()
        });
        onAction?.();
      }
    } catch (error) {
      handleFirestoreError(error, isSaved ? OperationType.DELETE : OperationType.WRITE, dealRef.path);
    }
  };
  // Simple markdown renderer for the response text
  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <p key={i} className="mb-4 leading-relaxed text-gray-300">
        {line}
      </p>
    ));
  };

  return (
    <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Main findings */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-cyan-950/20 border border-cyan-800/30 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Tag size={120} />
            </div>
            <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center gap-3">
              <CheckCircle2 className="text-cyan-500" />
              Scent Detected!
            </h2>
            <div className="prose prose-invert max-w-none">
              {formatText(result.text)}
            </div>
          </div>

          {/* Structured Deals Section */}
          {result.deals.length > 0 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Zap className="text-cyan-500" size={20} />
                  TOP SNIFFS
                </h3>
                
                <div className="flex items-center gap-3">
                  {/* Category Filter */}
                  <div className="flex items-center gap-2 bg-cyan-950/30 border border-cyan-900/50 rounded-xl px-3 py-1.5">
                    <Filter size={14} className="text-cyan-600" />
                    <select 
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="bg-transparent text-xs font-bold text-cyan-400 outline-none cursor-pointer"
                    >
                      <option value="All" className="bg-black text-white">All Categories</option>
                      <option value="Free Trial" className="bg-black text-white">Free Trials</option>
                      <option value="Discount" className="bg-black text-white">Discounts</option>
                      <option value="Coupon" className="bg-black text-white">Coupons</option>
                      <option value="Limited Time" className="bg-black text-white">Limited Time</option>
                    </select>
                  </div>

                  {/* Relevance Sort */}
                  <button 
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-2 bg-cyan-950/30 border border-cyan-900/50 rounded-xl px-3 py-1.5 text-xs font-bold text-cyan-400 hover:border-cyan-500 transition-colors"
                  >
                    <ArrowUpDown size={14} className="text-cyan-600" />
                    SCORE: {sortOrder === 'asc' ? 'ASC' : 'DESC'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredDeals.length > 0 ? (
                  filteredDeals.map((deal) => (
                  <div 
                    key={deal.id}
                    className="bg-black/40 border border-cyan-900/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all group relative"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="inline-block px-2 py-1 rounded-md bg-cyan-900/40 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                          {deal.category}
                        </span>
                        {watchlist.some(item => item.id === deal.id) && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest mb-2 ml-2 animate-pulse">
                            <BookmarkPlus size={10} /> WATCHING
                          </span>
                        )}
                        <h4 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {deal.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-[10px] text-gray-500 uppercase font-bold">Relevance</div>
                          <div className="text-cyan-500 font-black">{deal.relevanceScore}%</div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                      {deal.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-cyan-900/20">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Globe size={12} />
                        {deal.source}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => toggleWatchlist(deal)}
                          className={`p-2 rounded-lg border transition-all flex items-center gap-2 text-xs font-bold ${
                            watchlist.some(item => item.id === deal.id) 
                              ? 'bg-cyan-500 border-cyan-500 text-black' 
                              : 'border-cyan-900/50 text-cyan-600 hover:border-cyan-500 hover:text-cyan-400'
                          }`}
                          title="Add to Watchlist"
                        >
                          <BookmarkPlus size={16} />
                          <span className="hidden sm:inline">
                            {watchlist.some(item => item.id === deal.id) ? 'WATCHING' : 'WATCHLIST'}
                          </span>
                        </button>

                        <button 
                          onClick={() => handleCopy(deal.link, deal.id)}
                          className="p-2 rounded-lg border border-cyan-900/50 text-cyan-600 hover:border-cyan-500 hover:text-cyan-400 transition-all flex items-center gap-2 text-xs font-bold"
                          title="Copy Link"
                        >
                          {copiedId === deal.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                          <span className="hidden sm:inline">{copiedId === deal.id ? 'COPIED' : 'COPY'}</span>
                        </button>

                        <a 
                          href={deal.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 px-4 rounded-lg bg-cyan-500 text-black font-bold text-xs flex items-center gap-2 hover:bg-cyan-400 transition-all"
                        >
                          GO <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-black/20 border border-dashed border-cyan-900/30 rounded-2xl p-12 text-center">
                  <p className="text-gray-500 italic">No deals found matching the "{filterCategory}" filter.</p>
                  <button 
                    onClick={() => setFilterCategory('All')}
                    className="mt-4 text-cyan-500 underline text-sm font-bold"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
              </div>
            </div>
          )}

          {/* Watchlist Section */}
          {watchlist.length > 0 && (
            <div className="space-y-6 mt-12 pt-12 border-t border-cyan-900/30">
              <h3 className="text-xl font-black text-cyan-500 flex items-center gap-2 px-2">
                <BookmarkPlus size={20} />
                YOUR WATCHLIST
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {watchlist.map((deal) => (
                  <div 
                    key={deal.id}
                    className="bg-cyan-950/10 border border-cyan-900/20 rounded-xl p-4 hover:border-cyan-500/30 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-bold text-cyan-600 uppercase tracking-tighter">
                        {deal.category}
                      </span>
                      <button 
                        onClick={() => toggleWatchlist(deal)}
                        className="text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-gray-200 mb-1 line-clamp-1">{deal.title}</h4>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-[10px] text-gray-500">{deal.source}</span>
                      <a 
                        href={deal.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-cyan-500 hover:underline flex items-center gap-1"
                      >
                        VIEW <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sources/Grounding */}
        <div className="space-y-6">
          <div className="bg-black/40 border border-cyan-900/30 rounded-3xl p-6 h-fit">
            <h3 className="text-sm font-bold text-cyan-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Globe size={16} />
              Sources Tracked
            </h3>
            <div className="space-y-3">
              {result.sources.length > 0 ? (
                result.sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-3 p-3 rounded-xl bg-cyan-900/10 hover:bg-cyan-900/30 border border-cyan-800/20 transition-all group"
                  >
                    <span className="text-sm text-gray-400 line-clamp-2 group-hover:text-cyan-300 transition-colors">
                      {source.title}
                    </span>
                    <ExternalLink size={14} className="text-cyan-600 shrink-0 mt-1" />
                  </a>
                ))
              ) : (
                <p className="text-xs text-gray-600 italic">No external links verified for this scent.</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border border-cyan-800/30 rounded-3xl p-6">
            <p className="text-xs text-cyan-600 leading-tight">
              CYBERHOUND TIP: Always double-check expiration dates before committing. These deals are sniffed live but may expire as fast as they appeared.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
