import { MemoryStore } from "./memory";
import { defaultParams, initializeState, UQRCParams, UQRCState, updateState } from "./loop";
import { TrainingHook } from "./trainingHooks";
import { evaluateSemanticClosure, SemanticClosureOptions, SemanticClosureResult } from "./closure";
import { decodeOutput, encodeInput, getOutputDictionary } from "./encoding";
import {
  computeAttractorDistance,
  createDefaultAttractor,
  SemanticAttractor,
} from "./attractor";

export interface InteractionResult {
  output: string;
  state: UQRCState;
  closure: SemanticClosureResult;
  attractorDistance?: number;
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
  attractor?: SemanticAttractor;
  logAttractorDistance?: boolean;
}

const resolveAttractor = (
  dimension: number,
  provided?: SemanticAttractor
): SemanticAttractor => provided ?? createDefaultAttractor(dimension);

export const runInteractionStep = (
  input: string,
  state: UQRCState,
  options: InteractionOptions = {}
): InteractionResult => {
  const params = { ...defaultParams, ...options.params };
  const attractor = resolveAttractor(state.u.length, options.attractor);
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
  let nextState = updateState(state, params, encoded, attractor);
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
      nextState = updateState(nextState, params, encoded, attractor);
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

  const attractorDistance = computeAttractorDistance(nextState.u, attractor);
  if (options.logAttractorDistance ?? true) {
    console.info("[uqrc] attractor distance", {
      id: attractor.id,
      distance: attractorDistance,
      step: nextState.step,
    });
  }

  if (options.memory) {
    const entry = {
      input,
      output,
      u: nextState.u,
      feedback: options.feedback,
      timestamp: Date.now(),
      attractorDistance,
    };
    options.memory.addWorkingEntry(entry);
    if (closure.status === "allow") {
      options.memory.commitEntry(entry);
    }
  }

  return { output, state: nextState, closure, attractorDistance };
};

export const initializeInteractionState = (
  options: InteractionOptions = {}
): UQRCState =>
  initializeState(options.dimension ?? 8, options.memory?.latestSeed() ?? 0);
