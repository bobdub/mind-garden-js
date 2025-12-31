import { Vector } from "./operators";
import { UQRCParams } from "./loop";

const epsilon = 1e-9;

export interface LossWeights {
  task: number;
  entropy: number;
  fluency: number;
  memory: number;
  redundancy: number;
  verifiability: number;
  creativity: number;
}

export interface LossInputs {
  prediction: Vector;
  target?: Vector;
  previous?: Vector;
  paraphrase?: Vector;
  evidence?: Vector;
  creativitySamples?: Vector[];
}

export interface LossBreakdown {
  task: number;
  entropy: number;
  fluency: number;
  memory: number;
  redundancy: number;
  verifiability: number;
  creativity: number;
  total: number;
}

export const defaultLossWeights: LossWeights = {
  task: 1,
  entropy: 0.05,
  fluency: 0.1,
  memory: 0.1,
  redundancy: 0.1,
  verifiability: 0.1,
  creativity: 0.05,
};

const softmax = (vector: Vector): Vector => {
  const max = Math.max(...vector, 0);
  const exp = vector.map((value) => Math.exp(value - max));
  const sum = exp.reduce((acc, value) => acc + value, 0) + epsilon;
  return exp.map((value) => value / sum);
};

export const computeTaskLoss = (prediction: Vector, target: Vector): number => {
  if (prediction.length === 0 || target.length === 0) {
    return 0;
  }

  const length = Math.min(prediction.length, target.length);
  const mse =
    prediction
      .slice(0, length)
      .reduce((sum, value, index) => {
        const diff = value - target[index];
        return sum + diff * diff;
      }, 0) / length;

  return mse;
};

export const computeEntropyPenalty = (vector: Vector): number => {
  if (vector.length === 0) {
    return 0;
  }

  const probabilities = softmax(vector);
  return -probabilities.reduce(
    (sum, value) => sum + value * Math.log(value + epsilon),
    0
  );
};

export const computeFluencyLoss = (vector: Vector): number => {
  if (vector.length < 2) {
    return 0;
  }

  const diffs = vector.slice(1).map((value, index) => {
    const previous = vector[index];
    const diff = value - previous;
    return diff * diff;
  });

  const total = diffs.reduce((sum, value) => sum + value, 0);
  return total / diffs.length;
};

const computeMeanVector = (samples: Vector[]): Vector => {
  const length = Math.max(0, ...samples.map((sample) => sample.length));
  if (length === 0) {
    return [];
  }

  return Array.from({ length }, (_, index) => {
    const sum = samples.reduce((acc, sample) => acc + (sample[index] ?? 0), 0);
    return sum / samples.length;
  });
};

const computeSampleVariance = (samples: Vector[]): number => {
  if (samples.length < 2) {
    return 0;
  }

  const mean = computeMeanVector(samples);
  const squaredDistances = samples.map((sample) => {
    const length = Math.min(sample.length, mean.length);
    if (length === 0) {
      return 0;
    }

    const distance =
      sample
        .slice(0, length)
        .reduce((sum, value, index) => {
          const diff = value - mean[index];
          return sum + diff * diff;
        }, 0) / length;
    return distance;
  });

  return (
    squaredDistances.reduce((sum, value) => sum + value, 0) /
    squaredDistances.length
  );
};

export const computeCreativityLoss = (samples: Vector[]): number => {
  if (samples.length < 2) {
    return 0;
  }

  const variance = computeSampleVariance(samples);
  return 1 / (variance + epsilon);
};

export const computeUqrcLearningLoss = (
  inputs: LossInputs,
  weights: LossWeights = defaultLossWeights
): LossBreakdown => {
  const task = inputs.target
    ? computeTaskLoss(inputs.prediction, inputs.target)
    : 0;
  const entropy = computeEntropyPenalty(inputs.prediction);
  const fluency = computeFluencyLoss(inputs.prediction);
  const memory =
    inputs.previous && inputs.previous.length > 0
      ? computeTaskLoss(inputs.prediction, inputs.previous)
      : 0;
  const redundancy =
    inputs.paraphrase && inputs.paraphrase.length > 0
      ? computeTaskLoss(inputs.prediction, inputs.paraphrase)
      : 0;
  const verifiability =
    inputs.evidence && inputs.evidence.length > 0
      ? computeTaskLoss(inputs.prediction, inputs.evidence)
      : 0;
  const creativity =
    inputs.creativitySamples && inputs.creativitySamples.length > 1
      ? computeCreativityLoss(inputs.creativitySamples)
      : 0;

  const total =
    weights.task * task +
    weights.entropy * entropy +
    weights.fluency * fluency +
    weights.memory * memory +
    weights.redundancy * redundancy +
    weights.verifiability * verifiability +
    weights.creativity * creativity;

  return {
    task,
    entropy,
    fluency,
    memory,
    redundancy,
    verifiability,
    creativity,
    total,
  };
};

export const computeLoss = (
  prediction: Vector,
  target: Vector,
  entropyWeight = 0.05
): number => {
  const result = computeUqrcLearningLoss(
    { prediction, target },
    { ...defaultLossWeights, entropy: entropyWeight }
  );
  return result.total;
};

export const updateParameters = (
  params: UQRCParams,
  loss: number,
  learningRate = 0.01
): UQRCParams => ({
  ...params,
  nu: Math.max(0, params.nu - learningRate * loss),
  beta: Math.max(0, params.beta - learningRate * loss * 0.5),
  curvatureStrength: Math.max(
    0,
    params.curvatureStrength - learningRate * loss * 0.2
  ),
  attractorStrength: Math.max(
    0,
    params.attractorStrength - learningRate * loss * 0.1
  ),
  intentStrength: Math.max(
    0,
    params.intentStrength - learningRate * loss * 0.08
  ),
  continuityStrength: Math.max(
    0,
    params.continuityStrength - learningRate * loss * 0.08
  ),
  narrativeTimeWeight: Math.max(
    0,
    params.narrativeTimeWeight - learningRate * loss * 0.05
  ),
  completionWeight: Math.max(
    0,
    params.completionWeight - learningRate * loss * 0.05
  ),
});
