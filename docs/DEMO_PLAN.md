# SentinelTwin — 3-Minute Hackathon Demo Script & Contingency Plan (DEMO_PLAN)

**Document ID:** DEMO-001  
**Project:** SentinelTwin  
**Event:** Kritical Hacks 2026 Presentation  
**Target Duration:** Exactly 3 Minutes (180 Seconds)  
**Presenter:** Incident Commander / Lead Architect  
**Version:** 1.0.0  

---

## 1. Demo Narrative Arc: The $500k/Hour Checkout Outage

**Opening Hook (0:00 - 0:25):**
> *"Judges, when Stripe or AWS has an outage, tools like IsDown or StatusGator tell you their service is down. But they can't answer the only question your executive team cares about: **What does this mean for OUR business, and how do we recover before our users feel it?** This is SentinelTwin."*

---

## 2. Second-by-Second Presentation Script

| Timestamp | Screen State | Action & Narration | Visual Focus |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:30** | Dashboard Canvas | **Context:** *"Here is PayPulse, a mid-market fintech processing $500k/hour. Notice our 12 interconnected services on the digital twin canvas: checkout, order processing, databases, and our primary gateway Stripe, backed by a standby gateway Razorpay. Everything is currently green and healthy."* | 12-node DAG canvas in sleek dark mode |
| **0:30 – 1:00** | Live Web Scan | **TinyFish Investigation:** *"Now, watch this. I click 'Start Live Investigation'. SentinelTwin unleashes TinyFish's AI web search and headless fetch across developer advisories and status pages. Within seconds, TinyFish detects breaking news: Stripe is experiencing elevated 500 error rates on card tokenization endpoints."* | Real-time SSE execution logs streaming in bottom drawer |
| **1:00 – 1:30** | Blast Radius Active | **Graph Auto-Mapping:** *"SentinelTwin verifies the source against `status.stripe.com`, maps it to our `srv-stripe-primary` node, and our NetworkX digital twin calculates the blast radius. Stripe turns red. But more importantly: our Checkout Service, Order Engine, and Customer Portal immediately turn amber. 5 services impacted. 18,400 active shoppers at risk. 34% projected transaction failure."* | Red failed node with animated amber failure pulses across downstream services |
| **1:30 – 2:15** | Recovery Lever | **The Hero Moment (Recovery Simulation):** *"Now, instead of guessing or panicking, the incident commander clicks 'Simulate Recovery: Failover to Razorpay'. Watch the canvas: the digital twin dynamically rewires downstream checkout dependencies to the standby gateway. Look at the verified delta: Impacted services drop from 5 to 1. Users at risk plummet from 18,400 down to 1,200—a 93.5% risk reduction. We tested the recovery in our sandbox without risking production."* | Canvas edge re-routes in green. Comparison banner highlights 93.5% risk reduction |
| **2:15 – 2:45** | AI Incident Brief | **Governance & Audit:** *"With one click, we generate an evidence-grounded incident brief powered by Claude 3.5. Notice that every single claim is backed by exact clickable URLs from our TinyFish crawl. It includes the ranked human-approval runbook command. Zero hallucinations, zero unauthorized production mutations."* | Rendered Markdown brief with hyperlinked sources and copyable AWS SSM runbook |
| **2:45 – 3:00** | Conclusion | **Closing Pitch:** *"Other tools tell you a provider is down. SentinelTwin tells you what it means for YOUR business, and tests the recovery before your users feel it. SentinelTwin: Know the risk. Simulate the impact. Prepare the recovery. Thank you."* | Tagline card on screen |

---

## 3. Contingency Plan & "Plan B" Scenarios

| Failure Scenario | Immediate Detection Trigger | Instant Contingency Action |
| :--- | :--- | :--- |
| **Venue WiFi Disconnect** | Browser network error / SSE fails | Instantly toggle switch in navbar to **`[Historical Replay Mode]`**. The entire demo executes identically using verified local offline fixtures. |
| **TinyFish API 429 Rate Limit** | HTTP 429 response logged | Backend automatically intercepts and loads `fixtures/tinyfish_stripe_outage.json`. UI logs show `FIXTURE REPLAY` badge. |
| **Claude API Timeout** | Generation spinner $> 3\text{ seconds}$ | Backend automatically returns pre-compiled Jinja template postmortem in $< 100\text{ ms}$. |
| **Projector Resolution Glitch** | 1080p canvas scaling issue | Click React Flow "Fit View" button in bottom left controls (`controls.fitView()`) to center all 12 nodes perfectly. |

---

## 4. Rehearsed Judge Q&A Cheat Sheet

1. **Q: How is this different from StatusGator or IsDown?**  
   *A: Status aggregators track global provider status. SentinelTwin maps external evidence to YOUR internal directed service graph, calculates your specific downstream user blast radius, and lets you simulate recovery levers (like secondary gateway failover) before taking action.*

2. **Q: Why use TinyFish instead of just polling status RSS feeds?**  
   *A: Official status pages often lag 20–45 minutes behind real outages. TinyFish uses live Google web search (`TinySearch`) to catch early-warning developer tweets and news reports, followed by `TinyFetch` headless Chromium rendering to verify un-syndicated status pages.*

3. **Q: Is the data real or simulated?**  
   *A: We enforce strict data provenance: External web signals and citations are **REAL**. Blast radius paths and recovery percentages are **COMPUTED** mathematically in NetworkX. Baseline user volumes are **SIMULATED** model parameters. Every metric has an origin badge.*

4. **Q: Does SentinelTwin modify production infrastructure?**  
   *A: Absolutely not. SentinelTwin is strictly a defensive decision-support digital twin. It generates copyable runbooks for human approval, completely eliminating accidental production disruptions.*
