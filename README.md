
# 🚀 Kinetiq Engine | Intelligent Candidate Ranking

![Kinetiq Header](./assets/banner.png)

## 📌 The Mission

Processing 100,000 candidate profiles under strict 5-minute CPU constraints to find the absolute top 100 matches for complex, cross-functional engineering roles.

# 🚀 Kinetiq Engine

![Dashboard Overview](assets/dashboard-main.png)

## 🖼️ Visual Showcase

_A glimpse into the Kinetiq "Midnight Glass" interface:_

<div align="center">
  <table>
    <tr>
      <td align="center"><img src="assets/dashboard-main.png" width="300"><br>Dashboard View</td>
      <td align="center"><img src="assets/selection.png" width="300"><br>Candidate Filtering</td>
      <td align="center"><img src="assets/Profile-detail.png" width="300"><br>Deep Analytics</td>
    </tr>
    <tr>
      <td align="center"><img src="assets/Comparison-modal.png" width="300"><br>Peer Comparison</td>
      <td align="center"><img src="assets/Export-workflow.png" width="300"><br>Exporting Data</td>
    </tr>
  </table>
</div>

## ⚡ Interactive Walkthrough

![Kinetiq in Action](assets/bideo.gif)
_Watch the engine perform real-time ranking, deep-profile analytics, and seamless data export._

## ⚠️ The Problem

In today's fast paced tech landscape, recruiters are drowning in data. Processing 100,000+ candidate profiles is a massive bottleneck, often resulting in manual, error prone screening processes that take days, cost thousands in compute resources and fail to surface top tier talent in time.

## 💡 The Solution

**Kinetiq Engine** isn't just another ranking script. It's an intelligent filtering pipeline.
By utilizing **In Memory Vector Lookups** and a single pass ranking algorithm, our engine achieves what standard CSV processing scripts cannot: **sub-second deep-profile retrieval.** We don't just process candidates, we intelligently filter them, ignoring consulting titles and non engineering noise to ensure your team sees only the most relevant technical talent.

## 🧠 The Architecture

![Architecture](./assets/architecture.png)

We designed a highly optimized, single-pass filtering pipeline:

- **Vector-Based Elimination:** Instantly drops non-engineering roles and consulting titles to ensure maximum JD alignment without wasting compute.
- **Behavioral Signal Weighting:** Prioritizes recruiter response rates and platform connection density to surface active, highly-recruitable talent.
- **In-Memory Speed:** The FastAPI backend loads the entire 100k dataset into memory at startup, allowing our UI to retrieve deep profile data in milliseconds.

## 💻 The Tech Stack

- **Backend:** Python, FastAPI, Pandas
- **Frontend:** React, TypeScript, Tailwind CSS
- **Design System:** Custom "Midnight Glass" UI with interactive data visualization.

## 🚀 Live Demo

- [Launch the Sandbox](kinetiq-discovery-engine.vercel.app)