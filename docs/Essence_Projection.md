# Essence & Projection — Current UQRC Build

## Essence (What the system *is* today)
- **Core evolution loop:** The UQRC state update combines diffusion, curvature, coercive terms, semantic derivatives, attractor constraint, memory curvature, and gated entropy (`src/uqrc/loop.ts`, `src/uqrc/operators.ts`).
- **Semantic closure:** Output emission is gated by Ω closure checks with hold/allow behavior and forced allow safety (`src/uqrc/closure.ts`, `src/uqrc/interaction.ts`).
- **Memory integrity:** Memory flows through working → committed states with closure validation and integrity checks (`src/uqrc/memory.ts`).
- **Identity anchoring:** A semantic attractor encodes identity/role/continuity and provides a constraint term to reduce drift (`src/uqrc/attractor.ts`).
- **Instrumentation:** Metrics are captured per turn and surfaced in the dashboard for inspection (`src/uqrc/metrics.ts`, `src/components/UqrcDashboard.tsx`).
- **Hybrid mapping readiness:** A defined transformer↔UQRC mapping exists with readiness thresholds for hybrid evaluation (`src/uqrc/hybridMapping.ts`).

## Projection (Where the system can stabilize next)
1. **Automated stability checks** — Add lightweight endurance and regression probes that run the loop for N steps and assert closure/metric bounds.
2. **Metric alerts** — Implement threshold-based alerts in the UI so deviations in closure, divergence, or attractor distance are visible immediately.
3. **Hybrid readiness UI** — Surface the hybrid readiness snapshot in the dashboard for ongoing verification.
4. **Memory audit surfacing** — Expose rejected memory commits (integrity failures) in a diagnostic view for faster feedback.

## Purge & Refinement Notes
- **Manual-only guarantees:** Phase definitions that assume automated validation (e.g., iteration longevity, alerting) remain manual today and should be treated as “observational only” until automated checks exist.
- **Dashboard latency claims:** The Phase 7 dashboard currently renders from local state without explicit latency guarantees; treat performance claims as provisional.

## Cross-References
- `docs/Project_Plan.md` — canonical phase targets and definitions.
- `docs/Implementation_Audit.md` — per-phase correctness and stability inspection.
