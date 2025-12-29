import { Vector } from "./operators";
import { UQRCParams } from "./loop";

const epsilon = 1e-9;

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

export const computeLoss = (
  prediction: Vector,
  target: Vector,
  entropyWeight = 0.05
): number => {
  const taskLoss = computeTaskLoss(prediction, target);
  const entropyPenalty = computeEntropyPenalty(prediction);
  return taskLoss + entropyWeight * entropyPenalty;
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
});
