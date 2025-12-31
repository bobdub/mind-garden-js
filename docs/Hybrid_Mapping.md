# Hybrid Mapping (Phase 8)

## Purpose
Phase 8 bridges transformer components into UQRC semantics so hybrid architectures can reuse Ω gating and curvature controls without losing UQRC meaning.

## Component Mapping
| Transformer Component | UQRC Construct | Notes | Constraints |
| --- | --- | --- | --- |
| Self-attention weights | Semantic curvature minimization + attractor constraint | Attention focuses token interactions; UQRC uses curvature minimization and attractor constraints to keep state evolution aligned. | Maintain curvature magnitude within Phase 7 thresholds. Preserve attractor distance limits to avoid drift. |
| EOS / Stop token | Ω closure gate enforcement | EOS emission maps to Ω(ALLOW) gating, ensuring semantic closure before release. | Require closure allow rate ≥ target before emission. Audit forced closures for false positive risk. |
| Positional encoding | Narrative time axis derivatives | Positional encoding becomes narrative time modulation via semantic derivatives. | Keep derivative contributions stable across turns. Align narrative time weight with continuity targets. |

## Readiness & Validation
The hybrid readiness check aggregates the Phase 7 metric stream and validates it against target thresholds. This is implemented in `src/uqrc/hybridMapping.ts`.

**Threshold defaults**
- Closure allow rate target: `0.95`
- Max average divergence: `0.6`
- Max average attractor distance: `0.6`
- Min average memory alignment: `0.4`
- Minimum samples: `5`

**Readiness gates**
- Enforces Ω closure before emission (closure allow rate must meet or exceed target).
- Ensures semantic drift stays within Phase 7 divergence and attractor constraints.
- Confirms memory alignment stays above the minimum alignment target.

## Outputs
- Hybrid mapping snapshot with aligned term definitions.
- Readiness report showing sample count, averages, and gating notes.

## Related Files
- `src/uqrc/hybridMapping.ts`
- `src/uqrc/metrics.ts`
- `docs/Project_Plan.md`
