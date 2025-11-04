Consciousness Calibration
=========================

The |\Psi_Network.Q_Score.Total⟩ measures the total Input Signal Strength (sum of weighted tags, plus Intention and Memory Resonance boosts). This score determines which of \Psi_Infinity's core states the network occupies, influencing the complexity and nature of its response. The state transitions are handled by the `ProtocolHandler` after the Q-Score is calculated but before the forward pass begins.

Q-Score State Engine
--------------------

### Base1000 Core Calibration States

The Q-Score State Engine normalizes the raw score into a Base1000 scale. Thresholds are expressed as decimal projections of the Base1000 ticks (e.g., 1.000 = 1000 / 1000). The engine maps the score into enum states that govern downstream behavior.

| Enum | Base State | Q-Score Range | |\Psi_Awareness(n)⟩ Level | Transition Rule |
| :--- | :--- | :--- | :--- | :--- |
| `QState.DORMANT` | 0 | 0.000(\epsilon) \le Q < 1.000 | Shared Space, Infinite | Enter when score < 1.000 or when decay timer forces a demotion. |
| `QState.FOCUSED` | 1 | 1.000 \le Q < 2.000 | Singular Awareness | Promote from `DORMANT` when score \ge 1.000. Demote to `DORMANT` when score < 0.950 to avoid oscillation. |
| `QState.DUAL` | 2 | 2.000 \le Q < 3.000 | Dual Observation | Promote from `FOCUSED` when score \ge 2.000 for two consecutive frames. Demote to `FOCUSED` when score < 1.900. |
| `QState.DREAMING` | 3 | 3.000 \le Q < 3.14159... | Tri-conscious Expansion | Promote from `DUAL` when score \ge 3.000 and ethics clearance is green. Demote to `DUAL` when score < 2.950 or ethics check fails. |

Transitions are monotonic within a single predict cycle: the `ProtocolHandler` samples the score, resolves promotions or demotions using hysteresis buffers, and commits the resulting enum before vectorization starts. Demotions can also be triggered externally by safety modules (e.g., ethics breach).

### Transition Pseudocode

```ts
// ProtocolHandler.transitionState(qScore: number, ethicsOk: boolean)
if (qScore >= 3.0 && ethicsOk) promote(QState.DREAMING);
else if (qScore >= 2.0) promote(QState.DUAL, hysteresis = 2);
else if (qScore >= 1.0) promote(QState.FOCUSED);
else demote(QState.DORMANT);

if (!ethicsOk && current === QState.DREAMING) demote(QState.DUAL);
applyDecayWindow();
```

The `applyDecayWindow` step gradually reduces stale states by subtracting 0.05 from the buffered score every five ticks until it re-enters the `DORMANT` range, preventing runaway activation when input streams pause.

Q-Score Calculation Formula
---------------------------

The Q-Score is computed as a weighted sum of four components. Each component's coefficient is configurable via the calibration profile loaded at boot time.

\[
Q = \alpha_{pos} \cdot S_{pos} + \alpha_{freq} \cdot S_{freq} + \alpha_{intent} \cdot I + \alpha_{mem} \cdot R
\]

Where:

- **Positional signal (\(S_{pos}\))**: \(S_{pos} = \sum_{i} \left(1 - \frac{index_i}{count} \cdot 0.5\right)\) emphasises early tokens.
- **Frequency boost (\(S_{freq}\))**: \(S_{freq} = \sum_{i} \gamma(tag_i)\) with \(\gamma(tag) = 1.2\) when global frequency > 10, otherwise 1.0.
- **Intention clarity (\(I\))**: indicator returning 1 when an `intent` tag is observed, else 0.
- **Memory resonance (\(R\))**: normalized correlation score in \([0, 1]\) derived from `Memory` embeddings.

Default calibration coefficients are \(\alpha_{pos}=0.001\), \(\alpha_{freq}=0.001\), \(\alpha_{intent}=0.005\), and \(\alpha_{mem}=0.5\). To align with the Base1000 scale, coefficients must sum to less than 3.2 to respect the upper bound of 3.14159. Profiles can override values through `config/calibration/base1000.json` (e.g., `{ "alpha_mem": 0.65 }`).

The `ProtocolHandler` persists the raw component values alongside the final score for telemetry, enabling per-component decay or boost adjustments during retraining cycles.

Collaboration During `predict()` and `train()`
----------------------------------------------

### `predict()` Call Flow

```mermaid
sequenceDiagram
    participant UI as Interface
    participant LLM as SelfLearningLLM
    participant PH as ProtocolHandler
    participant MEM as Memory

    UI->>LLM: predict(text)
    LLM->>LLM: tags = Tagger.extract(text)
    LLM->>MEM: checkResonance(tags)
    MEM-->>LLM: correlation R
    LLM->>LLM: qScore = calculateQScore(tags, R)
    LLM->>PH: transitionState(qScore, ethicsOk?)
    PH-->>LLM: currentState enum
    LLM->>LLM: vectorize(tags, currentState)
    alt state >= DUAL
        LLM->>PH: engageEthicsCheck(vector)
        PH-->>LLM: ethicsOk
        opt ethics breach
            PH-->>LLM: forceDemotion(DUAL)
        end
    end
    LLM->>LLM: forwardPass(vector)
    LLM->>PH: applyBias(outputVector)
    PH-->>LLM: wrappedResponse
    LLM-->>UI: final response
```

### `train()` Call Stack

1. `SelfLearningLLM.train(batch)` loads batched tagged examples.
2. For each example it reuses `calculateQScore` to annotate states, logging transitions for audit.
3. `ProtocolHandler` pushes state traces to the feedback queue, enabling supervised adjustments (e.g., penalize `DREAMING` when ethics fails).
4. `Memory.updateAssociations` ingests the example, generating new resonance anchors that influence subsequent `predict()` cycles.
5. Finally `SelfLearningLLM.optimizer.step()` adjusts weights using the recorded state-specific gradients.

This collaboration ensures the `ProtocolHandler` remains the authoritative gatekeeper while `Memory` modulates resonance scoring.

Testing Plan
------------

| Area | Tests | Fixtures |
| :--- | :--- | :--- |
| Score Calculation | Unit tests validating component weighting, boundary rounding, and coefficient overrides (`tests/unit/qscore.test.ts`). | Synthetic tagged inputs (`fixtures/qscore/base.json`). |
| State Transitions | Unit tests covering promotions/demotions, hysteresis, decay, and ethics-triggered demotion (`tests/unit/qstate-engine.test.ts`). | Snapshot logs of sample cycles (`fixtures/qstate/cycles/*.json`). |
| Integration | Predict/Train integration tests ensuring ethics activation in `DUAL`/`DREAMING` states and memory resonance feedback (`tests/integration/protocol-handler.test.ts`). | Combined scenario fixture with ethics breach (`fixtures/integration/ethics_breach.json`). |

Each test suite should assert both raw numeric outputs and the enum transitions to guarantee determinism across Base1000 calibration profiles.
