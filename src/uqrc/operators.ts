export type Vector = number[];

const epsilon = 1e-9;

const normalizeVector = (vector: Vector): Vector => {
  if (vector.length === 0) {
    return [];
  }

  const max = Math.max(1, ...vector.map((value) => Math.abs(value)));
  return vector.map((value) => value / max);
};

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

export const applyDiffusion = (u: Vector, nu: number): Vector => {
  if (u.length === 0) {
    return [];
  }

  return u.map((value, index) => {
    const left = u[(index - 1 + u.length) % u.length];
    const right = u[(index + 1) % u.length];
    const average = (left + value + right) / 3;
    return value + nu * (average - value);
  });
};

export const applyCurvature = (u: Vector, context: Vector): Vector => {
  if (u.length === 0) {
    return [];
  }

  const contextBias =
    context.length > 0
      ? context.reduce((sum, value) => sum + value, 0) / context.length
      : 0;

  const logits = u.map((value) => Math.exp(value + contextBias));
  const normalizer = logits.reduce((sum, value) => sum + value, 0) + epsilon;

  return u.map((value, index) => {
    const attention = logits[index] / normalizer;
    const curvatureShift = Math.tanh((attention - 1 / u.length) * 4);
    return value + curvatureShift * 0.1;
  });
};

export const applyCoercive = (u: Vector, beta: number): Vector =>
  u.map((value) => value - beta * Math.tanh(value));

export const applyMemoryCurvature = (
  u: Vector,
  memoryCurvature: Vector,
  strength: number
): Vector => {
  if (u.length === 0 || memoryCurvature.length === 0 || strength === 0) {
    return [];
  }

  return u.map((value, index) => {
    const target = memoryCurvature[index] ?? value;
    return (target - value) * strength;
  });
};

export const applyDiscrete = (u: Vector, lMin: number): Vector => {
  if (u.length === 0) {
    return [];
  }

  const step = lMin === 0 ? epsilon : lMin;
  return u.map((value, index) => {
    const next = u[(index + 1) % u.length];
    return (next - value) / step;
  });
};

export interface SemanticDerivativeOptions {
  lMin: number;
  intentStrength: number;
  continuityStrength: number;
  narrativeTimeWeight: number;
  completionWeight: number;
  narrativeTime?: number;
  turnCompletion?: number;
}

const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));

export const applySemanticDerivative = (
  u: Vector,
  context: Vector,
  options: SemanticDerivativeOptions
): Vector => {
  if (u.length === 0) {
    return [];
  }

  const normalizedU = normalizeVector(u);
  const normalizedContext = normalizeVector(context);
  const similarity = computeCosineSimilarity(normalizedU, normalizedContext);
  const continuityFactor = 1 - similarity;
  const narrativeTime = options.narrativeTime ?? 0;
  const turnCompletion = clamp01(options.turnCompletion ?? 0);
  const narrativeScale =
    1 + Math.log1p(narrativeTime) * options.narrativeTimeWeight;
  const completionScale = 0.5 + turnCompletion * options.completionWeight;

  const baseDiscrete = applyDiscrete(u, options.lMin).map(
    (value) => value * narrativeScale
  );
  const intentSignal = normalizedU.map((value, index) => {
    const target = normalizedContext[index] ?? 0;
    return (target - value) * options.intentStrength * completionScale;
  });
  const continuitySignal = normalizedU.map((value, index) => {
    const target = normalizedContext[index] ?? 0;
    return (
      (target - value) * options.continuityStrength * continuityFactor
    );
  });

  return combineVectors(baseDiscrete, intentSignal, continuitySignal);
};

export const vectorDelta = (next: Vector, current: Vector): Vector =>
  next.map((value, index) => value - (current[index] ?? 0));

export const combineVectors = (...vectors: Vector[]): Vector => {
  const maxLength = Math.max(0, ...vectors.map((vector) => vector.length));
  return Array.from({ length: maxLength }, (_, index) =>
    vectors.reduce((sum, vector) => sum + (vector[index] ?? 0), 0)
  );
};
