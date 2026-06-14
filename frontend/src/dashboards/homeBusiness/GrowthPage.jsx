import React from 'react';
import { 
  TrendingUp, Award, CheckCircle, ArrowRight, Share2, 
  Camera, FileText, Gift, HelpCircle, Star, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const GrowthPage = () => {
  const { user } = useAuth();
  const sellerName = user?.name?.split(' ')[0] || 'Creator';

  return (
    <div className="home-business-theme max-w-5xl mx-auto space-y-8 pb-20 px-4 sm:px-6">
      
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-[var(--foreground)]">
          🎉 Creator Growth & Insights
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] font-medium">
          Tips and personalized score to help your home business thrive in the local community.
        </p>
      </div>

      {/* Main Score & Recommendation Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Growth Card */}
        <div className="bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm flex flex-col justify-between items-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/10 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="space-y-1 z-10">
            <h3 className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest flex justify-center items-center gap-1">
              Your Growth Score <Award className="w-4 h-4 text-[var(--primary)]" />
            </h3>
            <p className="text-5xl font-black text-[var(--primary)]">82 <span className="text-sm text-[var(--muted-foreground)] font-medium">/ 100</span></p>
          </div>

          <div className="relative w-28 h-28 my-6 flex items-center justify-center z-10">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="48" className="stroke-[var(--background)] fill-none" strokeWidth="8" />
              <circle cx="56" cy="56" r="48" className="stroke-[var(--primary)] fill-none" strokeWidth="8" 
                      strokeDasharray={300} strokeDashoffset={300 - (300 * 82) / 100} strokeLinecap="round" />
            </svg>
            <span className="absolute text-sm font-black text-[var(--primary)]">Level 3</span>
          </div>

          <p className="text-[11px] text-[var(--muted-foreground)] font-medium z-10 leading-relaxed">
            You are in the top <span className="text-emerald-500 font-bold">15% of local creators</span> this week!
          </p>
        </div>

        {/* Action Checklist (Take 2 Cols) */}
        <div className="md:col-span-2 bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-black text-[var(--foreground)]">Your Action Checklist</h3>
            <p className="text-xs text-[var(--muted-foreground)] font-medium">Complete these actions to increase your shop's visibility on the local map.</p>
          </div>

          <div className="space-y-3">
            {/* Action 1 */}
            <div className="flex items-center justify-between p-3.5 bg-[var(--background)] rounded-2xl border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center flex-shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--foreground)]">Add Cover/Shop Photo</p>
                  <p className="text-[10px] text-[var(--muted-foreground)] leading-tight">Makes your store card look beautiful on map discovery.</p>
                </div>
              </div>
              <span className="text-[10px] font-black text-[var(--primary)] bg-[var(--primary)]/15 px-2.5 py-1 rounded-full">+5 pts</span>
            </div>

            {/* Action 2 */}
            <div className="flex items-center justify-between p-3.5 bg-[var(--background)] rounded-2xl border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--foreground)]">Write Your Seller Story</p>
                  <p className="text-[10px] text-[var(--muted-foreground)] leading-tight">Introduce yourself and your crafts to neighboring buyers.</p>
                </div>
              </div>
              <span className="text-[10px] font-black text-amber-500 bg-amber-500/15 px-2.5 py-1 rounded-full">+10 pts</span>
            </div>

            {/* Action 3 */}
            <div className="flex items-center justify-between p-3.5 bg-[var(--background)] rounded-2xl border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--foreground)]">Share on WhatsApp</p>
                  <p className="text-[10px] text-[var(--muted-foreground)] leading-tight">Let your existing contacts know you are on Aisle.</p>
                </div>
              </div>
              <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/15 px-2.5 py-1 rounded-full">+5 pts</span>
            </div>
          </div>
        </div>

      </div>

      {/* Local Community Trend Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Trend 1: Festive Demand */}
        <div className="bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[var(--primary)]/10 rounded-xl text-[var(--primary)]">
              <Gift className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-[var(--foreground)] text-sm">Festive Demand Trends</h3>
              <p className="text-[10px] text-[var(--muted-foreground)] font-bold">Upcoming Opportunities</p>
            </div>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="p-3 bg-[var(--background)] rounded-2xl border border-[var(--border)] flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-[var(--foreground)]">Raksha Bandhan</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">Demand rising for handmade threads & chocolate boxes.</p>
              </div>
              <span className="text-[10px] font-black text-[var(--primary)] uppercase">High Demand</span>
            </div>

            <div className="p-3 bg-[var(--background)] rounded-2xl border border-[var(--border)] flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-[var(--foreground)]">Diwali Gift Hampers</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">Diwali in 25 days. Buyers start looking for custom gift packs now.</p>
              </div>
              <span className="text-[10px] font-black text-amber-500 uppercase">Preparation</span>
            </div>
          </div>
        </div>

        {/* Creator Knowledge Hub */}
        <div className="bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[var(--primary)]/10 rounded-xl text-[var(--primary)]">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-[var(--foreground)] text-sm">Creator Knowledge Hub</h3>
              <p className="text-[10px] text-[var(--muted-foreground)] font-bold">Photography & Packaging tips</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <a href="#" className="block p-3 hover:bg-[var(--background)] rounded-2xl border border-transparent hover:border-[var(--border)] transition-all flex items-center justify-between group">
              <div>
                <p className="text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">📸 Smartphone Photography Guide</p>
                <p className="text-[10px] text-[var(--muted-foreground)] leading-normal mt-0.5">How to capture product photos using natural light.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
            </a>

            <a href="#" className="block p-3 hover:bg-[var(--background)] rounded-2xl border border-transparent hover:border-[var(--border)] transition-all flex items-center justify-between group">
              <div>
                <p className="text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">📦 Eco-friendly Packaging Tips</p>
                <p className="text-[10px] text-[var(--muted-foreground)] leading-normal mt-0.5">Elevate your brand using craft paper and dried flowers.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
            </a>
          </div>
        </div>

      </div>

    </div>
  );
};

export default GrowthPage;
