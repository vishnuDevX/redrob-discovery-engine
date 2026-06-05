import json
import csv

def load_candidates(filepath):
    print("Loading data...")
    with open(filepath, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]

def score_candidate(cand):
    # Safely handle missing dictionaries
    profile = cand.get("profile") or {}
    signals = cand.get("redrob_signals") or {}
    skills_raw = cand.get("skills") or []
    
    # Safely extract skills
    skills = [s.get("name", "").lower() for s in skills_raw if isinstance(s, dict)]
    
    title = (profile.get("current_title") or "").lower()
    company = (profile.get("current_company") or "").lower()
    
    # Safely convert experience to float (prevents TypeError if null)
    exp_years = profile.get("years_of_experience")
    exp_years = float(exp_years) if exp_years is not None else 0.0
    
    base_score = 0.0
    
    # 1. THE TITLE TRAP
    engineering_keywords = ["engineer", "developer", "ml", "ai", "backend", "data", "software", "scientist"]
    if not any(kw in title for kw in engineering_keywords):
        return 0.0, 0 
        
    # 2. THE CONSULTING & RESEARCHER TRAP (Penalties)
    consulting_firms = ["tcs", "infosys", "wipro", "accenture", "cognizant", "capgemini"]
    if any(firm in company for firm in consulting_firms):
        base_score -= 15.0 
        
    if "research" in title and "engineer" not in title:
        base_score -= 15.0 
        
    # 3. CORE SKILLS SCORING
    high_value_skills = ["python", "embeddings", "retrieval", "ranking", "llm", "rag", "qdrant", "pinecone", "weaviate", "milvus", "faiss"]
    skill_matches = sum(1 for skill in high_value_skills if any(kw in skill for kw in skills))
    base_score += (skill_matches * 10)
    
    if 5.0 <= exp_years <= 9.0:
        base_score += 10
    
    # 4. BEHAVIORAL MULTIPLIER
    response_rate = signals.get("recruiter_response_rate")
    response_rate = float(response_rate) if response_rate is not None else 0.5
    if response_rate == -1.0: 
        response_rate = 0.5 
        
    interview_rate = signals.get("interview_completion_rate")
    interview_rate = float(interview_rate) if interview_rate is not None else 1.0
    
    final_score = base_score * response_rate * interview_rate
    return max(0.0, final_score), skill_matches

def generate_reasoning(profile, signals, skill_matches, response_rate):
    title = profile.get('current_title') or 'Engineer'
    exp = profile.get('years_of_experience')
    exp = float(exp) if exp is not None else 0.0
    resp_pct = int(response_rate * 100)
    return f"{title} with {exp} yrs exp; matched {skill_matches} core AI/retrieval skills; {resp_pct}% recruiter response rate."

def run_pipeline():
    candidates = load_candidates("candidates.jsonl")
    
    print("Scoring candidates (with safety checks)...")
    scored_pool = []
    
    for cand in candidates:
        signals = cand.get("redrob_signals") or {}
        profile = cand.get("profile") or {}
        
        # Safely extract values that could trigger null errors
        response_rate = signals.get("recruiter_response_rate")
        response_rate = float(response_rate) if response_rate is not None else 1.0
        
        last_active = signals.get("last_active_date") or "2000-01-01"
        
        exp_years = profile.get("years_of_experience")
        exp_years = float(exp_years) if exp_years is not None else 0.0
        
        # Fast Filters
        if response_rate != -1.0 and response_rate < 0.10: continue
        if str(last_active) < "2025-06-01": continue
        if exp_years < 3.0: continue
        
        # Deep Scoring
        score, skill_matches = score_candidate(cand)
        
        if score > 0:
            safe_resp = response_rate if response_rate != -1.0 else 0.5
            reasoning = generate_reasoning(profile, signals, skill_matches, safe_resp)
            scored_pool.append({
                "candidate_id": cand.get("candidate_id"),
                "score": round(score, 4),
                "reasoning": reasoning
            })
            
    scored_pool.sort(key=lambda x: x["score"], reverse=True)
    top_100 = scored_pool[:100]
    
    print("Exporting top 100 to CSV...")
    with open("team_submission.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["candidate_id", "rank", "score", "reasoning"])
        for rank, cand in enumerate(top_100, 1):
            writer.writerow([cand["candidate_id"], rank, cand["score"], cand["reasoning"]])
            
    print("Success! team_submission.csv has been generated.")

if __name__ == "__main__":
    run_pipeline()