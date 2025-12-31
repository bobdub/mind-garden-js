import { MetricsEntry } from "./metrics";

export interface HybridMappingComponent {
  name: string;
  transformerAnalogue: string;
  uqrcConstruct: string;
  description: string;
  constraints: string[];
}

export interface HybridMappingThresholds {
  closureAllowRateTarget: number;
  maxAverageDivergence: number;
  maxAverageAttractorDistance: number;
  minAverageMemoryAlignment: number;
  minSamples: number;
}

export interface HybridReadiness {
  sampleCount: number;
  closureAllowRate: number;
  averageDivergence: number;
  averageAttractorDistance: number;
  averageMemoryAlignment: number;
  meetsThresholds: boolean;
  notes: string[];
}

export interface HybridMappingSnapshot {
  createdAt: number;
  components: HybridMappingComponent[];
  thresholds: HybridMappingThresholds;
  readiness: HybridReadiness;
}

const mappingComponents: HybridMappingComponent[] = [
  {
    name: "Attention",
    transformerAnalogue: "Self-attention weights",
    uqrcConstruct: "Semantic curvature minimization + attractor constraint",
    description:
      "Attention focuses token interactions; UQRC uses curvature minimization and attractor constraints to keep state evolution aligned.",
    constraints: [
      "Maintain curvature magnitude within Phase 7 thresholds.",
      "Preserve attractor distance limits to avoid drift.",
    ],
  },
  {
    name: "EOS / Stop Token",
    transformerAnalogue: "End-of-sequence emission",
    uqrcConstruct: "Ω closure gate enforcement",
    description:
      "EOS emission maps to Ω(ALLOW) gating, ensuring semantic closure before release.",
    constraints: [
      "Require closure allow rate ≥ target before emission.",
      "Audit forced closures for false positive risk.",
    ],
  },
  {
    name: "Positional Encoding",
    transformerAnalogue: "Token position embeddings",
    uqrcConstruct: "Narrative time axis derivatives",
    description:
      "Positional encoding becomes narrative time modulation via semantic derivatives.",
    constraints: [
      "Keep derivative contributions stable across turns.",
      "Align narrative time weight with continuity targets.",
    ],
  },
];

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const average = (values: number[]) =>
  values.length === 0 ? 0 : sum(values) / values.length;

export const defaultHybridThresholds: HybridMappingThresholds = {
  closureAllowRateTarget: 0.95,
  maxAverageDivergence: 0.6,
  maxAverageAttractorDistance: 0.6,
  minAverageMemoryAlignment: 0.4,
  minSamples: 5,
};

export const evaluateHybridReadiness = (
  entries: MetricsEntry[],
  thresholds: HybridMappingThresholds = defaultHybridThresholds
): HybridReadiness => {
  const sampleCount = entries.length;
  const closureAllows = entries.filter((entry) => entry.closureStatus === "allow")
    .length;
  const closureAllowRate = sampleCount === 0 ? 0 : closureAllows / sampleCount;
  const averageDivergence = average(entries.map((entry) => entry.semanticDivergence));
  const averageAttractorDistance = average(
    entries.map((entry) => entry.attractorDistance)
  );
  const averageMemoryAlignment = average(
    entries.map((entry) => entry.memoryAlignment)
  );

  const notes: string[] = [];
  if (sampleCount < thresholds.minSamples) {
    notes.push("Not enough samples to verify hybrid readiness.");
  }
  if (closureAllowRate < thresholds.closureAllowRateTarget) {
    notes.push("Closure allow rate below target.");
  }
  if (averageDivergence > thresholds.maxAverageDivergence) {
    notes.push("Semantic divergence above target.");
  }
  if (averageAttractorDistance > thresholds.maxAverageAttractorDistance) {
    notes.push("Attractor distance above target.");
  }
  if (averageMemoryAlignment < thresholds.minAverageMemoryAlignment) {
    notes.push("Memory alignment below target.");
  }

  const meetsThresholds =
    sampleCount >= thresholds.minSamples &&
    closureAllowRate >= thresholds.closureAllowRateTarget &&
    averageDivergence <= thresholds.maxAverageDivergence &&
    averageAttractorDistance <= thresholds.maxAverageAttractorDistance &&
    averageMemoryAlignment >= thresholds.minAverageMemoryAlignment;

  return {
    sampleCount,
    closureAllowRate,
    averageDivergence,
    averageAttractorDistance,
    averageMemoryAlignment,
    meetsThresholds,
    notes,
  };
};

export const createHybridMappingSnapshot = (
  entries: MetricsEntry[],
  thresholds: HybridMappingThresholds = defaultHybridThresholds
): HybridMappingSnapshot => ({
  createdAt: Date.now(),
  components: mappingComponents,
  thresholds,
  readiness: evaluateHybridReadiness(entries, thresholds),
});
