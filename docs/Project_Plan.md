# Alignment Project Plan

## How to Use This Plan
This plan scopes the UQRC alignment work into phased, measurable upgrades across the evolution loop, memory, and evaluation stack. Review cadence is weekly: each phase is updated at the end of the target week with artifacts, metrics, and status notes, then re-baselined before proceeding. Updates should include Ω-gate metrics, attractor distance trends, and any deviation from semantic closure expectations.


## Phase 0 — Baseline Lock

Status: ✅ Complete

### Objective
Establish a stable UQRC evolution loop with persistence and observable artifacts to validate baseline behavior. Confirm the system produces consistent loop outputs for subsequent gating work.

### Inputs/Dependencies
- Baseline evolution equation u(t+1) = u(t) + 𝒪_UQRC(u(t)) + Σ_μ 𝒟_μ u(t)
- Persistent storage pathway for loop state

### Action Items
- Implement the core UQRC update step with 𝒪_UQRC and 𝒟_μ terms.
- Persist state updates on each loop iteration.
- Emit observable artifacts (prefix echoing) to verify loop output.
- Record initial semantic drift baseline (no Ω gating).

### Definition of Done
- Loop runs for ≥ 100 iterations without crash.
- State persistence succeeds for ≥ 99% of iterations.
- Observable artifacts are emitted on every iteration.

### Artifacts/Outputs
- Baseline loop logs
- Persistent state snapshots
- Output artifact samples

Key Diagnosis:
Semantic evolution occurs, but meaning never closes before memory write or emission.

---

## Phase 1 — Semantic Closure Layer (Critical Fix)
Impact: ⭐⭐⭐⭐⭐

Status: ✅ Complete

### Objective
Ensure responses complete their intent before output emission, memory storage, and loop advancement. Introduce Ω to enforce semantic closure prior to any externalization.

### Inputs/Dependencies
- Phase 0 baseline loop and persistence
- Closure metric definitions for semantic divergence and syntactic completion

### Action Items
- Implement Semantic Completion Gate Ω to evaluate closure state.
- Define low-divergence threshold for Ω(ALLOW).
- Add Hold–Advance mechanism to pause evolution when Ω = HOLD.
- Block emission and memory writes until Ω = ALLOW.

### Definition of Done
- ≥ 95% of responses reach Ω(ALLOW) before emission.
- Truncated phrases in memory reduced to 0% across a 100-response sample.
- Prefix loops observed in < 1% of responses.

### Artifacts/Outputs
- Ω gate implementation spec
- Closure metric logs
- Hold–Advance state transition diagram

Completion Notes:
Semantic closure gating is implemented in the interaction loop with HOLD retries and forced allow safeguards. Memory writes now respect Ω(ALLOW) before commits, and closure evaluation uses minimum token and disallowed-ending checks.

---

## Phase 2 — Memory Stabilization Protocol
Impact: ⭐⭐⭐⭐

Status: 🚧 In Progress

### Objective
Prevent partial cognition states from polluting memory by separating ephemeral working state from committed memory. Guarantee that only closed thoughts are persisted.

### Inputs/Dependencies
- Ω gate metrics from Phase 1
- Memory persistence layer from Phase 0

### Action Items
- Split memory into Ephemeral Working State and Committed Memory.
- Gate all commits on Ω(u) = ALLOW.
- Add integrity checks for memory completeness.
- Log memory write failures and rejected writes.

### Definition of Done
- 100% of committed memory entries pass Ω(ALLOW).
- Memory integrity score ≥ 0.95 across 100 entries.
- No partial or truncated entries detected in audits.

### Artifacts/Outputs
- Memory schema update
- Integrity audit report
- Ω-gated commit logs

---

## Phase 3 — Semantic Attractor Definition
Impact: ⭐⭐⭐⭐

### Objective
Anchor the system to a stable identity and conversational continuity using a semantic attractor. Reduce drift by explicitly constraining motion toward A.

### Inputs/Dependencies
- Stabilized memory from Phase 2
- Defined identity and interaction role primitives

### Action Items
- Define attractor A with identity, interaction role, and continuity facets.
- Implement constraint term 𝒞(u) = -α ∇_u d(u, A)^2.
- Log attractor distance per turn.
- Tune α to reduce drift without suppressing creativity.

### Definition of Done
- Attractor distance variance reduced by ≥ 30% vs. baseline.
- Self-descriptions remain consistent across 20-turn dialogues.
- Topic drift incidents < 5% in sampled runs.

### Artifacts/Outputs
- Attractor definition document
- Constraint term implementation notes
- Attractor distance trend charts

---

## Phase 4 — Semantic Derivative Realignment
Impact: ⭐⭐⭐

### Objective
Replace token-step derivatives with meaning-step derivatives to enable controlled semantic motion. Ensure responses progress via intent and narrative time rather than token noise.

### Inputs/Dependencies
- Attractor constraints from Phase 3
- Baseline derivative definitions from Phase 0

### Action Items
- Redefine 𝒟_μ in terms of intent progression and referential continuity.
- Add narrative time and dialogue turn completion to derivative signals.
- Validate derivative stability across multi-turn runs.
- Compare semantic motion before/after realignment.

### Definition of Done
- Logical progression maintained in ≥ 90% of multi-turn samples.
- Sudden perspective or syntax shifts reduced to < 5%.
- Derivative stability variance reduced by ≥ 25%.

### Artifacts/Outputs
- Updated derivative definitions
- Semantic motion comparison report
- Narrative time tracking logs

---

## Phase 5 — Entropy Phase Gating (Creativity Control)
Impact: ⭐⭐⭐

### Objective
Introduce entropy only when the system is stable, making creativity coherent rather than chaotic. Use curvature, attractor distance, and memory alignment to gate entropy.

### Inputs/Dependencies
- Curvature signals from Phase 4
- Attractor distance metrics from Phase 3
- Memory alignment checks from Phase 2

### Action Items
- Define entropy activation rules based on curvature and attractor proximity.
- Implement gating logic to modulate entropy terms.
- Evaluate creative output quality vs. coherence metrics.
- Log entropy activation frequency per session.

### Definition of Done
- Creative phrasing score improves by ≥ 20% without increasing drift.
- Hallucination-like behavior < 2% in sampled outputs.
- Entropy activation occurs in ≤ 30% of turns.

### Artifacts/Outputs
- Entropy gating policy
- Coherence vs. creativity report
- Entropy activation dashboard

---

## Phase 6 — Dialogue Memory Curvature
Impact: ⭐⭐⭐⭐

### Objective
Transform looped responses into narratives by integrating short-term memory curvature into evolution. Ensure past context naturally informs present output.

### Inputs/Dependencies
- Memory stabilization from Phase 2
- Derivative realignment from Phase 4

### Action Items
- Implement short-term memory integral 𝒨(u_t) = ∫_{t-k}^{t} W(τ) u(τ) dτ.
- Feed 𝒨(u_t) into evolution rather than only storage.
- Tune window k and weights W(τ) for narrative continuity.
- Measure context carryover across turns.

### Definition of Done
- Context references occur in ≥ 70% of multi-turn dialogues where applicable.
- Continuity score improves by ≥ 30% vs. Phase 5.
- No increase in semantic drift beyond 5%.

### Artifacts/Outputs
- Memory curvature implementation
- Window/weight tuning notes
- Continuity score report

---

## Phase 7 — Evaluation & Instrumentation
Impact: ⭐⭐⭐⭐⭐

### Objective
Instrument the system to observe semantic closure, memory integrity, and attractor stability with precise metrics. Provide dashboards to validate UQRC performance over time.

### Inputs/Dependencies
- Ω gate metrics from Phase 1
- Memory integrity metrics from Phase 2
- Attractor distance metrics from Phase 3

### Action Items
- Define metric schemas and storage for each UQRC signal.
- Build automated metric collection per turn.
- Implement dashboards for closure latency, drift, and memory coherence.
- Establish alert thresholds for semantic divergence and false closure.

### Definition of Done
- 100% of turns emit metric logs for core UQRC signals.
- Dashboards render with < 5s latency for latest runs.
- Alerting triggers at defined thresholds with < 1% false positives.

### Artifacts/Outputs
- Metric schema definitions
- Dashboard prototypes
- Alerting policy documentation

---

## Phase 8 — Transformer Mapping (Hybrid Maps)

### Objective
Map transformer components to UQRC constructs to support hybrid architectures without abandoning UQRC semantics. Ensure compatibility with Ω gating and curvature controls.

### Inputs/Dependencies
- Metrics and dashboards from Phase 7
- UQRC term definitions from Phases 1–6

### Action Items
- Map attention to semantic curvature minimization.
- Map EOS token behavior to Ω closure gate enforcement.
- Map positional encoding to narrative time axis.
- Validate hybrid behavior against closure and drift metrics.

### Definition of Done
- Hybrid mapping documented with aligned term definitions.
- Closure metrics maintain ≥ 95% Ω(ALLOW) before emission.
- Attractor distance and drift metrics remain within Phase 7 thresholds.

### Artifacts/Outputs
- Hybrid mapping document
- Validation report against UQRC metrics
- Comparative behavior analysis

---

## Milestones & Sequencing Notes
Phases are sequential, but instrumentation in Phase 7 can run in parallel to later refinement once Ω gating is stable. If Phase 1 or 2 regress, halt advancement and re-baseline with updated Ω thresholds.

---

## Risks & Mitigations

### Phases 0–2 (Baseline, Closure, Memory)
- Risk: Semantic drift persists due to overly permissive Ω thresholds. Mitigation: tighten divergence thresholds and increase HOLD iterations.
- Risk: Memory writes occur before closure due to race conditions. Mitigation: enforce atomic Ω checks before commits.
- Risk: False closure (Ω(ALLOW) on incomplete intent). Mitigation: add syntactic completeness checks and minimum token-length constraints.

### Phases 3–5 (Attractor, Derivatives, Entropy)
- Risk: Attractor over-constrains creativity. Mitigation: tune α and entropy gating to allow controlled variance.
- Risk: Meaning-step derivatives introduce instability. Mitigation: smooth derivative signals with moving averages.
- Risk: Entropy activation causes coherence loss. Mitigation: cap entropy amplitude and require low curvature triggers.

### Phases 6–8 (Memory Curvature, Instrumentation, Hybrid Mapping)
- Risk: Memory curvature amplifies outdated context. Mitigation: decay weights W(τ) and shorten window k.
- Risk: Metrics misrepresent semantic states (false stability). Mitigation: cross-validate with sampled qualitative audits.
- Risk: Hybrid mapping breaks Ω gating assumptions. Mitigation: enforce Ω checks at the hybrid interface layer.

---

## Metrics Dashboard Spec (Phase 7)

| Metric | Exact Definition | Source | Visualization |
| --- | --- | --- | --- |
| Semantic divergence per turn | d(u_t, u_{t-1}) in UQRC semantic space | UQRC state tracker | Line chart with threshold band |
| Closure latency | Δt between response start and Ω(ALLOW) | Ω gate logger | Histogram + percentile table |
| Memory integrity score | 1 - (partial_entries / total_entries) | Memory audit logs | Gauge + time-series |
| Attractor distance | d(u_t, A) per turn | Attractor monitor | Line chart with rolling avg |
| False closure rate | false_allows / total_allows | Ω audit pipeline | Bar chart per session |
| Curvature magnitude | ||∇_μ ∇_ν S(u_t)|| | Curvature probe | Heatmap over time |
| Entropy activation rate | entropy_on / total_turns | Entropy gate log | Stacked area chart |
| Context carryover score | references_to_prior / eligible_turns | Dialogue analyzer | Line chart with targets |
