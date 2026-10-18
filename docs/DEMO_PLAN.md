# SentinelTwin — 3-Minute Demo Plan (DEMO_PLAN)

**Event:** AZINHACK '26
**Version:** 1.1.0 (aligned to the running backend)
**Duration:** 180 seconds
**Stack shown:** PayNest fintech (fictional), 8 services

Numbers below come from the running backend (see `SIMULATION_MODEL.md`). They are **computed from
simulated inputs**. Say so out loud once during the demo.

---

## 1. Rules for the presenter

1. Never say "live" unless the badge on screen says live. Read the badge.
2. Never call replay or fixture data a current outage.
3. Say "simulated users" and "computed from our model". Do not say "measured".
4. Do not claim status pages are slow by a fixed number of minutes. Say "official pages can lag
   early reports" only if you are comfortable it is true for the example shown, and show the
   timestamps.
5. Do not say "zero hallucinations". Say "the numbers in the report come from the simulation, not from
   the language model".

---

## 2. Two versions of the script

Pick the version **before** you walk on stage, based on whether the live scan found a real, relevant
signal during rehearsal.

### Mode A: Live scan found a relevant signal

| Time | Screen | Say / do |
| :--- | :--- | :--- |
| 0:00–0:25 | Dashboard, graph | "Providers tell you *they* are down. We answer what it means for *your* stack. This is PayNest, a fictional fintech: Stripe as primary gateway, Razorpay as backup, a router, checkout, orders, billing, auth, and a web portal." |
| 0:25–0:55 | Click **Live scan** | "This calls TinyFish Search and Fetch for our providers." Point at the log drawer. Show the badge (live). |
| 0:55–1:20 | Evidence tab | Open one result: source, publish time, retrieval time, verification grade. "This is a news signal. Only the official page can confirm it." Show the grade honestly. |
| 1:20–1:50 | Graph | Show which node it maps to and why. Fail `stripe-primary` in the simulation. "5 services affected: router, checkout, orders, subscription billing, and Stripe itself. Weighted impact 23.2. Simulated users at risk 1,964, which is 19.6% of our simulated 10,000." |
| 1:50–2:30 | **Hero moment** | Click **Apply Razorpay failover mitigation**. "Router, checkout and orders recover. Billing stays affected, because we assumed its webhooks are not migrated. Impact drops to 10.2, users at risk to 200 (2.0%), success rate from 88.7% to 98.8%." |
| 2:30–2:50 | Postmortem tab | Generate the report. "Evidence links come from the scan. Metrics come from the simulation." Point at the illustrative runbook and the human-approval flag. |
| 2:50–3:00 | Title card | "Know the risk. Simulate the impact. Prepare the recovery." |

### Mode B: No live signal, use historical replay (or fixture)

Same flow, with these changes:

- At 0:25, click **Historical replay** instead of Live scan.
- Read the banner aloud: "This is a historical replay, not a live outage."
- If the replay is a **fictional fixture** (until a real incident is verified), say
  "fictional incident for demonstration".
- At 0:25–0:55 do not say TinyFish "just detected" anything.
- You may still show one real TinyFish call (a live search for a provider) to prove the integration
  works, and say that no active incident was found.

---

## 3. Replay incident record (fill before the event)

| Field | Value |
| :--- | :--- |
| Incident description | **TODO: verify.** |
| Official source URL | **TODO** |
| Start and end time (UTC) | **TODO** |
| What the source confirms | **TODO** |
| Verified by / on | **TODO** |

If this table is not filled with a source you opened yourself, treat the replay as a fictional
fixture and label it that way. Do not name a real provider incident from memory.

---

## 4. Rehearsal checklist

- [ ] Run `python -m pytest backend/tests/ -v`: all 16 tests pass.
- [ ] Run the demo once in Mode A and once in Mode B.
- [ ] Run Mode B with the network turned off.
- [ ] Reset the environment between runs.
- [ ] Record a 3-minute screen capture of Mode B as a backup.
- [ ] Confirm the UI labels simulated assumptions and shows the replay or fixture badge.
- [ ] Time the script: stay within 180 seconds.

---

## 5. Contingency plan

| Failure | What you see | Action |
| :--- | :--- | :--- |
| Venue WiFi drops | Scan errors | Switch to Mode B. The app falls back to fixtures. Say so. |
| TinyFish rate limit or error | Warning in log drawer | App uses fixture data and shows the fixture badge. Say "using saved data". |
| Claude API slow or unavailable | Report spinner | App uses the template report. Say it is the template version. |
| Graph off-screen on projector | Nodes cut off | Use the graph "fit view" control. |
| Backend not responding | UI errors | Restart `uvicorn backend.app.main:app --port 8000`. If it fails, play the backup recording. |

---

## 6. Judge Q&A (honest answers)

1. **How is this different from IsDown or StatusGator?**
   Those tools focus on provider status. SentinelTwin maps an incident to *your* dependency graph,
   computes impact from your configured weights, and compares recovery options. We have not audited
   their full feature sets, so we do not claim they lack dependency features.

2. **Why TinyFish when some status pages have APIs?**
   Not every source has an API. Search finds news and advisories, and Fetch returns clean content from
   pages that are HTML only. We use official endpoints where they exist.

3. **Is the data real or simulated?**
   Evidence is real when live, and labeled replay or fixture otherwise. Blast radius and deltas are
   computed. User counts, weights and the 10,000-user population are simulated inputs.

4. **How is impact calculated?**
   Failure propagates through the dependency graph. The weighted impact score sums per-node weights
   over affected nodes. Users at risk sum per-node simulated users. Details are in `SIMULATION_MODEL.md`.

5. **How trustworthy are the recommendations?**
   They are rule-based and depend on our assumptions. They are advisory and need human approval.

6. **What if no live incident exists?**
   The scan reports that nothing relevant was found, and we use a labeled replay.

7. **Prompt injection and malicious sites?**
   Web text is treated as untrusted and isolated in the prompt. The numbers in the report are computed
   in code. URLs go through an SSRF check (private ranges, loopback, metadata addresses blocked).

8. **Does it change production?**
   No. It holds no credentials for production systems. The runbook commands are illustrative text.