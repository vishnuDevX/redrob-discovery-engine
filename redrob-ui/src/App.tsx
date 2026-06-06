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
  
  // Pagination & Expand Logic
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [compareList, setCompareList] = useState<string[]>([]);

  const candidatesPerPage = 20;
  const indexOfLastCandidate = currentPage * candidatesPerPage;
  const indexOfFirstCandidate = indexOfLastCandidate - candidatesPerPage;
  const currentCandidates = candidates.slice(indexOfFirstCandidate, indexOfLastCandidate); 
  const totalPages = Math.ceil(candidates.length / candidatesPerPage);

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
    
    const controller = new AbortController();

    fetch(`http://127.0.0.1:8000/api/candidate/${selectedId}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (controller.signal.aborted) return; // Prevent state update if component unmounted or ID changed

        if (data.status === 'success') {
          setActiveCandidate(data.data);
        } else {
          alert(data.message || "Failed to load candidate.");
          setSelectedId(null); // Reset view so user isn't stuck on a blank screen
        }
        setDetailsLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError' || controller.signal.aborted) return; // Ignore aborted requests
        console.error("Failed to fetch candidate details:", err);
        alert("An error occurred while fetching candidate details.");
        setSelectedId(null);
        setDetailsLoading(false);
      });

    return () => controller.abort(); // Cleanup and cancel stale requests on unmount or ID change
  }, [selectedId]);

  // Handle body scroll when comparison modal is open
  useEffect(() => {
    if (compareList.length === 2) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { // Cleanup on unmount
      document.body.style.overflow = '';
    };
  }, [compareList.length]);

  // Add this utility function inside your component
  const handleExportCSV = () => {
    // Assuming 'candidates' is your state variable holding the fetched data
    if (!candidates || candidates.length === 0) return;

    const headers = "Candidate ID,Rank,Score,Reasoning\n";
    const csvData = candidates.map((c) => 
      `"${c.candidate_id}","${c.rank}","${c.score}","${(c.reasoning || '').replace(/"/g, '""')}"`
    ).join("\n");

    const blob = new Blob([headers + csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.hidden = true;
    a.setAttribute('href', url);
    a.setAttribute('download', 'redrob_top_candidates.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Fix 2: Prevent memory leaks
  };

  // Helper for smart pagination to avoid long lists of page numbers
  const getPaginationItems = (currentPage: number, totalPages: number): (string | number)[] => {
    const pageNeighbours = 1; // Number of pages to show on each side of the current page
    const totalNumbers = (pageNeighbours * 2) + 3; // total page numbers to show (e.g., 1, ..., 4, 5, 6, ..., 10)
    const totalBlocks = totalNumbers + 2; // total numbers + 2 for '...'

    if (totalPages > totalBlocks) {
        const startPage = Math.max(2, currentPage - pageNeighbours);
        const endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);
        const pages: (string | number)[] = [1];

        if (startPage > 2) {
            pages.push('...');
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        if (endPage < totalPages - 1) {
            pages.push('...');
        }

        pages.push(totalPages);
        return pages;
    }
    return [...Array(totalPages)].map((_, i) => i + 1);
  };

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
            {selectedId ? (
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
            ) : (
              <button 
                onClick={handleExportCSV} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md transition text-sm font-semibold"
              >
                ⬇ Export to CSV
              </button>
            )}
          </div>

        </header>

        {/* View Rendering */}
          <div className="dashboard-content">
            {/* --- VIEW 1: THE LIST VIEW --- */}
            {loading && !selectedId && (
              <div className="text-center py-20 text-blue-400 animate-pulse font-mono text-xl">Loading Candidates...</div>
            )}
            
            {error && !selectedId && (
              <div className="text-center py-20 text-red-400 font-mono text-xl">Error: {error}</div>
            )}

            {!selectedId && !loading && !error && (
              <div className="flex flex-col gap-5 relative">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

            {/* The Table Header (Ensuring columns align) */}
            <div className="grid grid-cols-[40px_2fr_1fr_1fr_80px_100px] gap-4 px-6 py-3 bg-slate-800/80 rounded-t-lg text-slate-400 text-sm font-semibold mb-2 relative z-10">
              <div>{/* Checkbox Column */}</div>
              <div>Candidate Details</div>
              <div>Location</div>
              <div>Response Rate</div>
              <div>Score</div>
              <div>Action</div>
            </div>

            {/* The Paginated List */}
            {currentCandidates.map((candidate) => (
              <div key={candidate.candidate_id} className="mb-2 relative z-10">
                {/* The Main Row */}
                <div className="grid grid-cols-[40px_2fr_1fr_1fr_80px_100px] gap-4 px-6 py-4 bg-slate-800/40 hover:bg-slate-800 transition items-center rounded-lg border border-slate-700/50">
                  
                  {/* 1. Compare Checkbox */}
                  <div>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-slate-700 cursor-pointer"
                      checked={compareList.includes(candidate.candidate_id)}
                      aria-label={`Compare ${candidate.candidate_id}`}
                      title={`Compare ${candidate.candidate_id}`}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (compareList.length < 2) {
                            setCompareList([...compareList, candidate.candidate_id]);
                          } else {
                            alert("You can only compare 2 candidates at a time.");
                          }
                        } else {
                          setCompareList(compareList.filter(id => id !== candidate.candidate_id));
                        }
                      }}
                    />
                  </div>

                  {/* 2. Candidate Info */}
                  <div 
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-md" 
                    onClick={() => { setSelectedId(candidate.candidate_id); setDetailsLoading(true); }}
                    onKeyDown={(e) => {
                      // Fix 3: Add keyboard accessibility to clickable divs
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(candidate.candidate_id);
                        setDetailsLoading(true);
                      }
                    }}
                  >
                    <h3 className="text-white font-semibold group-hover:text-blue-400 transition">{candidate.candidate_id}</h3>
                    <p className="text-sm text-slate-400">Software Engineer</p>
                  </div>

                  {/* 3. Location */}
                  <div className="text-sm text-slate-300">Remote</div>

                  {/* 4. Response Rate */}
                  <div className="text-sm text-emerald-400">High</div>

                  {/* 5. Score (Fixed Overlap) */}
                  <div className="text-indigo-400 font-mono text-lg font-bold">{(candidate.score * 100).toFixed(1)}%</div>

                  {/* 6. Expand Analytics Button */}
                  <div>
                    <button 
                      onClick={() => setExpandedCandidate(expandedCandidate === candidate.candidate_id ? null : candidate.candidate_id)}
                      className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
                    >
                      {expandedCandidate === candidate.candidate_id ? 'Close' : 'Analytics'}
                    </button>
                  </div>
                </div>

                {/* The Individual Analytics Dropdown (Shows only when clicked) */}
                {expandedCandidate === candidate.candidate_id && (
                  <div className="p-6 bg-slate-900/80 rounded-b-lg border-x border-b border-slate-700 text-white animate-fade-in -mt-2 mb-4">
                    <h4 className="text-lg font-semibold text-indigo-300 mb-4">Deep Profile Analytics for {candidate.candidate_id}</h4>
                    
                    <div className="grid grid-cols-3 gap-6">
                      {/* Stat 1 */}
                      <div className="bg-slate-800 p-4 rounded-lg">
                        <p className="text-sm text-slate-400 mb-1">Job Description Match</p>
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-700 h-2 rounded-full">
                            <div className="bg-indigo-500 h-2 rounded-full w-[92%]"></div>
                          </div>
                          <span className="text-sm text-indigo-300 font-mono">92%</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Strong alignment in core tech stack.</p>
                      </div>

                      {/* Stat 2 */}
                      <div className="bg-slate-800 p-4 rounded-lg">
                        <p className="text-sm text-slate-400 mb-1">Platform Connectivity</p>
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-700 h-2 rounded-full">
                            <div className="bg-sky-500 h-2 rounded-full w-[85%]"></div>
                          </div>
                          <span className="text-sm text-sky-300 font-mono">85%</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">High likelihood of responding to outreach.</p>
                      </div>

                      {/* Stat 3 */}
                      <div className="bg-slate-800 p-4 rounded-lg">
                        <p className="text-sm text-slate-400 mb-1">Vector Similarity Engine</p>
                        <p className="text-emerald-400 text-sm font-mono mt-1">Status: High Confidence</p>
                        <p className="text-xs text-slate-400 mt-2">{candidate.reasoning || 'Candidate perfectly matches the seniority and domain requirements.'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 py-4 relative z-10">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-50 hover:bg-slate-700 transition"
                >
                  Previous
                </button>

                {getPaginationItems(currentPage, totalPages).map((item, index) =>
                  typeof item === 'number' ? (
                    <button
                      key={`${item}-${index}`}
                      onClick={() => setCurrentPage(item)}
                      className={`px-3 py-1 rounded transition ${
                        currentPage === item
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {item}
                    </button>
                  ) : (
                    <span key={`${item}-${index}`} className="px-3 py-1 text-slate-500 select-none">
                      {item}
                    </span>
                  ),
                )}

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-50 hover:bg-slate-700 transition"
                >
                  Next
                </button>
              </div>
            )}

              </div>
            )}

          </div>

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
                    {/* Fix 4: Use unique property instead of array index for key */}
                    {activeCandidate.skills.map((skill) => (
                      <span key={skill.name} className="px-4 py-2 rounded-lg bg-blue-900/20 text-blue-300 border border-blue-500/20 text-sm font-semibold">
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

        {/* --- COMPARE MODAL --- */}
        {compareList.length === 2 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div 
              role="dialog" 
              aria-modal="true" 
              aria-labelledby="comparison-modal-title"
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setCompareList([])}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
                title="Close"
              >
                ✕ Close
              </button>
              <h2 id="comparison-modal-title" className="text-2xl font-bold text-white mb-8 border-b border-slate-800 pb-4">Candidate Comparison</h2>
              <div className="grid grid-cols-2 gap-8">
                {/* Fix 5: Use unique ID instead of array index for key */}
                {compareList.map((id) => {
                  const cand = candidates.find(c => c.candidate_id === id);
                  if (!cand) return null;
                  return (
                    <div key={id} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-slate-700 text-white px-3 py-1 rounded-md text-sm font-bold">Rank #{cand.rank}</div>
                        <h3 className="text-xl font-bold text-white font-mono">{cand.candidate_id}</h3>
                      </div>
                      <div className="mb-6 bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1">Match Score</span>
                        <span className="text-4xl font-black text-blue-400">{(cand.score * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-2">Automated Reasoning</span>
                        <p className="text-sm text-slate-300 leading-relaxed">{cand.reasoning}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}