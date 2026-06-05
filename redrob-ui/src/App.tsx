import { useState, useEffect } from 'react';

interface CandidateListItem {
  candidate_id: string;
  rank: number;
  score: number;
  reasoning: string;
}

interface Skill {
  name: string;
  proficiency: string;
}

interface DeepProfile {
  profile: {
    anonymized_name: string;
    headline: string;
    current_company: string;
    location: string;
    years_of_experience: number;
    summary: string;
  };
  skills: Skill[];
  redrob_signals: {
    recruiter_response_rate: number;
    last_active_date: string;
    connection_count: number;
  };
}

export default function App() {
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New states for the Deep View
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCandidate, setActiveCandidate] = useState<DeepProfile | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fetch the Top 100 List on load
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/top-candidates')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') setCandidates(data.data);
        else setError(data.message);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Fetch Deep Data when a card is clicked
  useEffect(() => {
    if (!selectedId) {
      return;
    }
    
    fetch(`http://127.0.0.1:8000/api/candidate/${selectedId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') setActiveCandidate(data.data);
        setDetailsLoading(false);
      });
  }, [selectedId]);

  return (
    <div className="min-h-screen p-8 text-slate-200 selection:bg-blue-500/30">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-12 border-b border-slate-800/60 pb-8 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse"></div>
                <span className="text-sm font-semibold tracking-widest text-blue-400 uppercase">Live Pipeline</span>
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight text-white mb-3">
                Redrob <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Discovery Engine</span>
              </h1>
            </div>
            
            {/* Dynamic Back Button */}
            {selectedId && (
              <button 
                onClick={() => {
                  setSelectedId(null);
                  setActiveCandidate(null);
                }}
                className="group flex items-center gap-2 px-5 py-2.5 bg-slate-800/50 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500/50 rounded-full transition-all text-sm font-bold text-slate-300 hover:text-blue-400"
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Rankings
              </button>
            )}
          </div>
        </header>

        {/* --- VIEW 1: THE LIST VIEW --- */}
        {!selectedId && !loading && !error && (
          <div className="flex flex-col gap-5 relative cursor-pointer">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

            {candidates.map((cand) => (
              <div 
                key={cand.candidate_id} 
                onClick={() => {
                  setSelectedId(cand.candidate_id);
                  setDetailsLoading(true);
                }}
                className="group relative overflow-hidden backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-slate-700/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800/60 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="flex flex-col items-center justify-center bg-slate-950/50 rounded-xl p-4 min-w-[90px] border border-slate-800">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Rank</span>
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">#{cand.rank}</span>
                  </div>
                  <div className="flex-1 w-full pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                      <h2 className="text-2xl font-bold text-white font-mono">{cand.candidate_id}</h2>
                      <span className="text-sm font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
                        Score: {(cand.score * 100).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-slate-300 text-base">{cand.reasoning}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- VIEW 2: THE DETAILED PROFILE VIEW --- */}
        {selectedId && detailsLoading && (
          <div className="text-center py-20 text-blue-400 animate-pulse font-mono text-xl">Extracting Deep Profile Data...</div>
        )}

        {selectedId && activeCandidate && !detailsLoading && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Identity Card */}
            <div className="backdrop-blur-xl bg-slate-900/60 rounded-3xl border border-blue-500/30 p-8 mb-6 shadow-[0_0_40px_rgba(59,130,246,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full"></div>
              <h2 className="text-4xl font-black text-white mb-2 relative z-10">{activeCandidate.profile.anonymized_name}</h2>
              <h3 className="text-xl text-blue-400 font-medium mb-6 relative z-10">{activeCandidate.profile.headline}</h3>
              
              <div className="flex gap-4 relative z-10">
                <span className="bg-slate-800/80 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700">🏢 {activeCandidate.profile.current_company}</span>
                <span className="bg-slate-800/80 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700">📍 {activeCandidate.profile.location}</span>
                <span className="bg-slate-800/80 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700">⏳ {activeCandidate.profile.years_of_experience} YOE</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Skills & Bio */}
              <div className="lg:col-span-2 space-y-6">
                <div className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-slate-700/50 p-8">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Professional Summary</h4>
                  <p className="text-slate-300 leading-relaxed text-lg">{activeCandidate.profile.summary}</p>
                </div>

                <div className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-slate-700/50 p-8">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Verified Technical Skills</h4>
                  <div className="flex flex-wrap gap-3">
                    {activeCandidate.skills.map((skill, i) => (
                      <span key={i} className="px-4 py-2 rounded-lg bg-blue-900/20 text-blue-300 border border-blue-500/20 text-sm font-semibold">
                        {skill.name} <span className="opacity-50 ml-1 font-normal text-xs uppercase">{skill.proficiency}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Behavioral Signals */}
              <div className="space-y-6">
                <div className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-indigo-500/20 p-8">
                  <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-6">Behavioral Intel</h4>
                  
                  <div className="space-y-5">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Recruiter Response Rate</div>
                      <div className="text-2xl font-bold text-white">
                        {activeCandidate.redrob_signals.recruiter_response_rate !== -1 
                          ? `${Math.round(activeCandidate.redrob_signals.recruiter_response_rate * 100)}%` 
                          : 'No Data'}
                      </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Last Active</div>
                      <div className="text-lg font-bold text-white">{activeCandidate.redrob_signals.last_active_date}</div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Platform Connections</div>
                      <div className="text-2xl font-bold text-white">{activeCandidate.redrob_signals.connection_count}</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}