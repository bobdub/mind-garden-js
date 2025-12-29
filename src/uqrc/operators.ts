export type Vector = number[];

const epsilon = 1e-9;

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

export const vectorDelta = (next: Vector, current: Vector): Vector =>
  next.map((value, index) => value - (current[index] ?? 0));

export const combineVectors = (...vectors: Vector[]): Vector => {
  const maxLength = Math.max(0, ...vectors.map((vector) => vector.length));
  return Array.from({ length: maxLength }, (_, index) =>
    vectors.reduce((sum, vector) => sum + (vector[index] ?? 0), 0)
  );
};
