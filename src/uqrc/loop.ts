import {
  applyCoercive,
  applyCurvature,
  applyDiffusion,
  applySemanticDerivative,
  combineVectors,
  Vector,
  vectorDelta,
} from "./operators";
import { computeAttractorConstraint, SemanticAttractor } from "./attractor";

export interface UQRCState {
  u: Vector;
  step: number;
}

export interface UQRCParams {
  nu: number;
  beta: number;
  lMin: number;
  curvatureStrength: number;
  attractorStrength: number;
  intentStrength: number;
  continuityStrength: number;
  narrativeTimeWeight: number;
  completionWeight: number;
}

export const defaultParams: UQRCParams = {
  nu: 0.2,
  beta: 0.05,
  lMin: 1,
  curvatureStrength: 1,
  attractorStrength: 0.08,
  intentStrength: 0.12,
  continuityStrength: 0.1,
  narrativeTimeWeight: 0.15,
  completionWeight: 0.4,
};

export const initializeState = (dimension = 8, seed = 0): UQRCState => ({
  u: Array.from({ length: dimension }, (_, index) =>
    Math.sin(seed + index * 0.7)
  ),
  step: 0,
});

export const updateState = (
  state: UQRCState,
  params: UQRCParams,
  context: Vector = [],
  attractor?: SemanticAttractor,
  derivativeContext?: {
    narrativeTime?: number;
    turnCompletion?: number;
  }
): UQRCState => {
  const diffusion = vectorDelta(applyDiffusion(state.u, params.nu), state.u);
  const curvature = vectorDelta(
    applyCurvature(state.u, context).map(
      (value, index) =>
        state.u[index] + (value - state.u[index]) * params.curvatureStrength
    ),
    state.u
  );
  const coercive = vectorDelta(applyCoercive(state.u, params.beta), state.u);
  const derivative = applySemanticDerivative(state.u, context, {
    lMin: params.lMin,
    intentStrength: params.intentStrength,
    continuityStrength: params.continuityStrength,
    narrativeTimeWeight: params.narrativeTimeWeight,
    completionWeight: params.completionWeight,
    narrativeTime: derivativeContext?.narrativeTime ?? state.step,
    turnCompletion: derivativeContext?.turnCompletion,
  });
  const attractorConstraint =
    attractor && params.attractorStrength > 0
      ? computeAttractorConstraint(state.u, attractor, params.attractorStrength)
      : [];

  const delta = combineVectors(
    diffusion,
    curvature,
    coercive,
    derivative,
    attractorConstraint
  );
  const nextU = state.u.map((value, index) => value + (delta[index] ?? 0));

  return {
    u: nextU,
    step: state.step + 1,
  };
};
