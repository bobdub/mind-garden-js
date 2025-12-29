import {
  applyCoercive,
  applyCurvature,
  applyDiffusion,
  applyDiscrete,
  combineVectors,
  Vector,
  vectorDelta,
} from "./operators";

export interface UQRCState {
  u: Vector;
  step: number;
}

export interface UQRCParams {
  nu: number;
  beta: number;
  lMin: number;
  curvatureStrength: number;
}

export const defaultParams: UQRCParams = {
  nu: 0.2,
  beta: 0.05,
  lMin: 1,
  curvatureStrength: 1,
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
  context: Vector = []
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
  const discrete = applyDiscrete(state.u, params.lMin);

  const delta = combineVectors(diffusion, curvature, coercive, discrete);
  const nextU = state.u.map((value, index) => value + (delta[index] ?? 0));

  return {
    u: nextU,
    step: state.step + 1,
  };
};
