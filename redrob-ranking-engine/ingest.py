import json

def load_candidates(filepath):
    print(f"Loading data from {filepath}...")
    with open(filepath, "r", encoding="utf-8") as f:
        candidates = [json.loads(line) for line in f if line.strip()]
    return candidates

def fast_filter(candidates):
    print(f"\nRunning the Fast Filter on {len(candidates)} candidates...")
    viable_candidates = []
    
    for cand in candidates:
        signals = cand.get("redrob_signals", {})
        profile = cand.get("profile", {})
        
        # 1. THE GHOST FILTER: Drop candidates who rarely reply to recruiters (< 10% of the time)
        response_rate = signals.get("recruiter_response_rate", 1.0)
        if response_rate < 0.10 and response_rate != -1: # -1 means no data, we give them a pass for now
            continue
            
        # 2. THE INACTIVE FILTER: Drop candidates who haven't logged in recently (e.g., before mid-2025)
        last_active = signals.get("last_active_date", "2000-01-01")
        if last_active < "2025-06-01":
            continue
            
        # 3. THE JUNIOR FILTER: Drop extreme juniors (< 3 years exp) for a Senior Founding role
        if profile.get("years_of_experience", 0) < 3.0:
            continue
            
        # If they survive all the traps, add them to our viable list!
        viable_candidates.append(cand)
        
    print(f"Filter complete! We slashed the pool down to {len(viable_candidates)} viable candidates.")
    return viable_candidates

if __name__ == "__main__":
    file_path = "candidates.jsonl"
    
    # 1. Load the data
    candidate_pool = load_candidates(file_path)
    print(f"Successfully loaded {len(candidate_pool)} candidates!")
    
    # 2. Run the fast filter
    survivors = fast_filter(candidate_pool)