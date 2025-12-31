import { MemoryStore } from "./memory";
import { defaultParams, initializeState, UQRCParams, UQRCState, updateState } from "./loop";
import { Vector } from "./operators";
import { TrainingHook } from "./trainingHooks";
import { evaluateSemanticClosure, SemanticClosureOptions, SemanticClosureResult } from "./closure";

export interface InteractionResult {
  output: string;
  state: UQRCState;
  closure: SemanticClosureResult;
}

export interface InteractionOptions {
  params?: Partial<UQRCParams>;
  memory?: MemoryStore;
  dimension?: number;
  feedback?: number;
  trainingHooks?: TrainingHook[];
  closure?: SemanticClosureOptions & {
    maxHoldSteps?: number;
  };
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

export const getOutputDictionary = (input: string): string[] => {
  const tokens = input.split(/\s+/).filter(Boolean);
  const fallback = ["dream", "echo", "signal", "loop", "pulse"];
  return tokens.length > 0 ? tokens : fallback;
};

export const decodeOutput = (
  u: Vector,
  input: string,
  dictionary: string[] = getOutputDictionary(input)
): string => {
  const resolvedDictionary = dictionary.length > 0 ? dictionary : ["dream"];

  const ranked = u
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value)
    .slice(0, Math.min(3, resolvedDictionary.length))
    .map(({ index }) => resolvedDictionary[index % resolvedDictionary.length]);

  return ranked.join(" ");
};

export const runInteractionStep = (
  input: string,
  state: UQRCState,
  options: InteractionOptions = {}
): InteractionResult => {
  const params = { ...defaultParams, ...options.params };
  const encoded = encodeInput(input, state.u.length);
  const dictionary = getOutputDictionary(input);
  const minTokens = Math.min(
    options.closure?.minTokens ?? 2,
    Math.max(1, dictionary.length)
  );
  const closureConfig = {
    ...options.closure,
    minTokens,
  };
  let nextState = updateState(state, params, encoded);
  const normalizedInput = input.trim();
  const trainingHooks = options.trainingHooks ?? [];
  const matchedHook = trainingHooks.find(
    (hook) => hook.message.trim() === normalizedInput
  );
  const matchedIncurSentence = trainingHooks.find((hook) => {
    const incurSentence = hook.incurSentence.trim();
    if (!incurSentence) {
      return false;
    }
    return normalizedInput.toLowerCase().includes(incurSentence.toLowerCase());
  });

  let output = decodeOutput(nextState.u, input, dictionary);
  let lockedOutput = false;
  if (matchedHook) {
    output = matchedHook.reply;
    lockedOutput = true;
  } else if (matchedIncurSentence && options.memory) {
    const memories = options.memory.list();
    const matchedMemory = [...memories]
      .reverse()
      .find((entry) => entry.input.trim() === normalizedInput);
    if (matchedMemory) {
      output = matchedMemory.output;
      lockedOutput = true;
    }
  }

  let closure = lockedOutput
    ? { status: "allow", score: 1, reasons: ["locked_output"] }
    : evaluateSemanticClosure(output, closureConfig);
  if (!lockedOutput) {
    const maxHoldSteps = options.closure?.maxHoldSteps ?? 2;
    let holdSteps = 0;
    while (closure.status === "hold" && holdSteps < maxHoldSteps) {
      nextState = updateState(nextState, params, encoded);
      output = decodeOutput(nextState.u, input, dictionary);
      closure = evaluateSemanticClosure(output, closureConfig);
      holdSteps += 1;
    }
    if (closure.status === "hold") {
      closure = {
        ...closure,
        status: "allow",
        forced: true,
        reasons: [...closure.reasons, "max_hold_steps_reached"],
      };
    }
  }

  if (options.memory) {
    const entry = {
      input,
      output,
      u: nextState.u,
      feedback: options.feedback,
      timestamp: Date.now(),
    };
    options.memory.addWorkingEntry(entry);
    if (closure.status === "allow") {
      options.memory.commitEntry(entry);
    }
  }

  return { output, state: nextState, closure };
};

export const initializeInteractionState = (
  options: InteractionOptions = {}
): UQRCState =>
  initializeState(options.dimension ?? 8, options.memory?.latestSeed() ?? 0);
