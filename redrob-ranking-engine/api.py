from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import csv
import json

app = FastAPI(title="Redrob Ranking Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory database for lightning-fast lookups
candidate_db = {}

@app.on_event("startup")
def load_database():
    print("Loading 100,000 candidates into API memory...")
    try:
        with open("candidates.jsonl", "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    cand = json.loads(line)
                    candidate_db[cand["candidate_id"]] = cand
        print(f"Success! {len(candidate_db)} candidates ready for deep inspection.")
    except Exception as e:
        print(f"Warning: Could not load JSONL database: {e}")

@app.get("/api/top-candidates")
def get_top_candidates():
    candidates = []
    try:
        with open("team_submission.csv", "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                candidates.append({
                    "candidate_id": row["candidate_id"],
                    "rank": int(row["rank"]),
                    "score": float(row["score"]),
                    "reasoning": row["reasoning"]
                })
        return {"status": "success", "data": candidates}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/candidate/{candidate_id}")
def get_candidate_details(candidate_id: str):
    cand = candidate_db.get(candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {"status": "success", "data": cand}

@app.get("/")
def root():
    return {"message": "Engine is running."}