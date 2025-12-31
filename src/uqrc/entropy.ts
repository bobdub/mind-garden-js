import { Vector } from "./operators";

const epsilon = 1e-9;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const computeCosineSimilarity = (left: Vector, right: Vector): number => {
  const length = Math.min(left.length, right.length);
  if (length === 0) {
    return 0;
  }

  let dot = 0;
  let leftMag = 0;
  let rightMag = 0;
  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftMag += leftValue * leftValue;
    rightMag += rightValue * rightValue;
  }

  const magnitude = Math.sqrt(leftMag * rightMag);
  return magnitude === 0 ? 0 : dot / magnitude;
};

const normalizeVector = (vector: Vector): Vector => {
  if (vector.length === 0) {
    return [];
  }

  const max = Math.max(1, ...vector.map((value) => Math.abs(value)));
  return vector.map((value) => value / max);
};

const pseudoRandom = (seed: number): number => {
  const value = Math.sin(seed) * 43758.5453123;
  return value - Math.floor(value);
};

export const computeVectorMagnitude = (vector: Vector): number => {
  if (vector.length === 0) {
    return 0;
  }

  const sum = vector.reduce((acc, value) => acc + value * value, 0);
  return Math.sqrt(sum / (vector.length + epsilon));
};

export const computeMemoryAlignment = (
  current: Vector,
  memory?: Vector
): number => {
  if (!memory || memory.length === 0 || current.length === 0) {
    return 0;
  }

  return computeCosineSimilarity(
    normalizeVector(current),
    normalizeVector(memory)
  );
};

export interface EntropyGateConfig {
  curvatureThreshold: number;
  attractorThreshold: number;
  memoryThreshold: number;
}

export interface EntropyGateInputs {
  curvatureMagnitude: number;
  attractorDistance: number;
  memoryAlignment: number;
}

export const computeEntropyGate = (
  inputs: EntropyGateInputs,
  config: EntropyGateConfig
): number => {
  const curvatureScore =
    config.curvatureThreshold > 0
      ? clamp01(1 - inputs.curvatureMagnitude / config.curvatureThreshold)
      : 0;
  const attractorScore =
    config.attractorThreshold > 0
      ? clamp01(1 - inputs.attractorDistance / config.attractorThreshold)
      : 0;
  const memoryScore =
    config.memoryThreshold >= 1
      ? inputs.memoryAlignment >= config.memoryThreshold
        ? 1
        : 0
      : clamp01(
          (inputs.memoryAlignment - config.memoryThreshold) /
            (1 - config.memoryThreshold)
        );

  return curvatureScore * attractorScore * memoryScore;
};

export const buildEntropyVector = (
  u: Vector,
  strength: number,
  gate: number
): Vector => {
  if (u.length === 0 || strength === 0 || gate === 0) {
    return [];
  }

  const scaledStrength = strength * gate;
  return u.map((value, index) => {
    const noise = pseudoRandom(value * 12.9898 + index * 78.233);
    return (noise * 2 - 1) * scaledStrength;
  });
};
