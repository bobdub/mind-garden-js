# UQRC Language Learning Improvements

This document captures the first implementation pass of the UQRC-inspired
language learning improvements. The focus is on a rigorous, traceable mapping
between the axioms and concrete loss terms in the UQRC training utilities.

## Goals

The initial implementation augments the learning signal with structured losses
that reflect the axiomatic guidance for fluency, memory continuity, redundancy,
verifiability, and creativity.

## Mathematical Mapping

We treat the UQRC state vector as the working representation:

\[
u(t+1) = u(t) + \mathcal{O}_{UQRC}(u(t)) + \sum_{\mu}\mathcal{D}_\mu u(t) + \lambda(\varepsilon_0)\nabla_\mu\nabla_\nu S(u(t))
\]

The training loss is a weighted sum:

\[
\mathcal{L} = w_{task}\mathcal{L}_{task} + w_{entropy}\mathcal{L}_{entropy} + w_{fluency}\mathcal{L}_{fluency} +
w_{memory}\mathcal{L}_{memory} + w_{redundancy}\mathcal{L}_{redundancy} + w_{verifiability}\mathcal{L}_{verifiability} +
w_{creativity}\mathcal{L}_{creativity}
\]

## Loss Terms

| Term | Purpose | Notes |
| --- | --- | --- |
| Task | Supervised alignment to the target phrase. | MSE over aligned vector slices. |
| Entropy | Encourages distributional diversity. | Shannon entropy of softmaxed state. |
| Fluency | Smooths neighboring latent transitions. | Mean squared adjacent deltas. |
| Memory | Preserves continuity across time. | MSE vs. the previous stored state. |
| Redundancy | Aligns paraphrases to the same latent target. | MSE vs. a paraphrase embedding. |
| Verifiability | Anchors to evidence-oriented phrases. | MSE vs. evidence embedding. |
| Creativity | Encourages variance across recent samples. | Inverse variance penalty. |

### Fluency Loss

\[
\mathcal{L}_{fluency} = \frac{1}{n-1}\sum_{i=1}^{n-1}(u_i - u_{i-1})^2
\]

### Creativity Loss

We compute the variance across a short window of recent UQRC states:

\[
\sigma^2 = \frac{1}{k}\sum_{j=1}^{k}\frac{1}{n}\sum_{i=1}^{n}(u_{j,i} - \bar{u}_i)^2
\]

The loss term is then:

\[
\mathcal{L}_{creativity} = \frac{1}{\sigma^2 + \epsilon}
\]

This keeps the loss bounded while encouraging diversity (higher variance implies
lower loss).

## Implementation Notes

The implementation lives in the UQRC training utilities:

- `src/uqrc/training.ts`
  - `computeUqrcLearningLoss` orchestrates the new loss terms.
  - `computeFluencyLoss`, `computeCreativityLoss` provide term-specific signals.
  - `defaultLossWeights` captures the initial weighting profile.

The dashboard training controls now accept optional paraphrase and evidence
phrases:

- `src/components/UqrcDashboard.tsx`
  - "Training Hooks" card includes paraphrase and evidence inputs.
  - A loss breakdown readout exposes each component term.

## Current Usage Pattern

1. Enter a **target phrase** to define the supervised objective.
2. (Optional) Add a **paraphrase** to reinforce redundancy.
3. (Optional) Add an **evidence phrase** to establish verifiability.
4. Click **Apply Training Update** to compute the total and component losses.

The loss breakdown panel helps confirm that each term contributes as expected.
Future iterations can expose sliders for weights and apply normalization across
batch updates.
