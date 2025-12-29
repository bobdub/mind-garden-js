import { MemoryStore } from "./memory";
import { defaultParams, initializeState, UQRCParams, UQRCState, updateState } from "./loop";
import { Vector } from "./operators";

export interface InteractionResult {
  output: string;
  state: UQRCState;
}

export interface InteractionOptions {
  params?: Partial<UQRCParams>;
  memory?: MemoryStore;
  dimension?: number;
  feedback?: number;
}

const normalizeVector = (vector: Vector): Vector => {
  const max = Math.max(1, ...vector.map((value) => Math.abs(value)));
  return vector.map((value) => value / max);
};

export const encodeInput = (input: string, dimension = 8): Vector => {
  const vector = Array.from({ length: dimension }, () => 0);
  if (!input) {
    return vector;
  }

  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    vector[index % dimension] += code / 255;
  }

  return normalizeVector(vector);
};

export const decodeOutput = (u: Vector, input: string): string => {
  const tokens = input.split(/\s+/).filter(Boolean);
  const fallback = ["dream", "echo", "signal", "loop", "pulse"];
  const dictionary = tokens.length > 0 ? tokens : fallback;

  const ranked = u
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value)
    .slice(0, Math.min(3, dictionary.length))
    .map(({ index }) => dictionary[index % dictionary.length]);

  return ranked.join(" ");
};

export const runInteractionStep = (
  input: string,
  state: UQRCState,
  options: InteractionOptions = {}
): InteractionResult => {
  const params = { ...defaultParams, ...options.params };
  const encoded = encodeInput(input, state.u.length);
  const nextState = updateState(state, params, encoded);
  const output = decodeOutput(nextState.u, input);

  if (options.memory) {
    options.memory.addEntry({
      input,
      output,
      u: nextState.u,
      feedback: options.feedback,
      timestamp: Date.now(),
    });
  }

  return { output, state: nextState };
};

export const initializeInteractionState = (
  options: InteractionOptions = {}
): UQRCState =>
  initializeState(options.dimension ?? 8, options.memory?.latestSeed() ?? 0);
