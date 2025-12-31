import { MemoryStore } from "./memory";
import { MetricsStore } from "./metrics";
import {
  defaultParams,
  initializeState,
  UQRCParams,
  UQRCState,
  UQRCStepMetrics,
  updateState,
} from "./loop";
import { TrainingHook } from "./trainingHooks";
import { evaluateSemanticClosure, SemanticClosureOptions, SemanticClosureResult } from "./closure";
import { decodeOutput, encodeInput, getOutputDictionary } from "./encoding";
import {
  computeAttractorDistance,
  createDefaultAttractor,
  SemanticAttractor,
} from "./attractor";
import { computeVectorMagnitude } from "./entropy";
import { vectorDelta } from "./operators";

export interface InteractionResult {
  output: string;
  state: UQRCState;
  closure: SemanticClosureResult;
  attractorDistance?: number;
  entropyGate?: number;
  entropyActive?: boolean;
  memoryAlignment?: number;
  curvatureMagnitude?: number;
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
  logEntropyActivation?: boolean;
  memoryCurvatureWindow?: number;
  memoryCurvatureDecay?: number;
  metricsStore?: MetricsStore;
}

const resolveAttractor = (
  dimension: number,
  provided?: SemanticAttractor
): SemanticAttractor => provided ?? createDefaultAttractor(dimension);

const computeTurnCompletion = (input: string, dictionary: string[]): number => {
  const trimmed = input.trim();
  if (!trimmed) {
    return 0;
  }

  const tokenCount = dictionary.length;
  const tokenScore = Math.min(1, tokenCount / 12);
  const terminalScore = /[.!?]$/.test(trimmed) ? 0.3 : 0;

  return Math.min(1, tokenScore * 0.7 + terminalScore);
};

export const runInteractionStep = (
  input: string,
  state: UQRCState,
  options: InteractionOptions = {}
): InteractionResult => {
  const startedAt = Date.now();
  const params = { ...defaultParams, ...options.params };
  const attractor = resolveAttractor(state.u.length, options.attractor);
  const encoded = encodeInput(input, state.u.length);
  const dictionary = getOutputDictionary(input);
  const turnCompletion = computeTurnCompletion(input, dictionary);
  const memoryVector = options.memory?.latestState() ?? undefined;
  const memoryCurvature =
    options.memory?.getMemoryCurvature(
      options.memoryCurvatureWindow,
      options.memoryCurvatureDecay
    ) ?? undefined;
  const minTokens = Math.min(
    options.closure?.minTokens ?? 2,
    Math.max(1, dictionary.length)
  );
  const closureConfig = {
    ...options.closure,
    minTokens,
  };
  let stepMetrics: UQRCStepMetrics = {};
  let holdSteps = 0;
  let nextState = updateState(
    state,
    params,
    encoded,
    attractor,
    {
      narrativeTime: state.step,
      turnCompletion,
    },
    { memoryVector },
    { curvatureVector: memoryCurvature ?? undefined },
    stepMetrics
  );
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
    while (closure.status === "hold" && holdSteps < maxHoldSteps) {
      stepMetrics = {};
      nextState = updateState(
        nextState,
        params,
        encoded,
        attractor,
        {
          narrativeTime: nextState.step,
          turnCompletion,
        },
        { memoryVector },
        { curvatureVector: memoryCurvature ?? undefined },
        stepMetrics
      );
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
  if (options.logEntropyActivation ?? true) {
    console.info("[uqrc] entropy gate", {
      gate: stepMetrics.entropyGate ?? 0,
      active: stepMetrics.entropyActive ?? false,
      curvatureMagnitude: stepMetrics.curvatureMagnitude ?? 0,
      memoryAlignment: stepMetrics.memoryAlignment ?? 0,
      attractorDistance,
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

  const semanticDivergence = computeVectorMagnitude(
    vectorDelta(nextState.u, state.u)
  );
  options.metricsStore?.addEntry({
    step: nextState.step,
    timestamp: Date.now(),
    semanticDivergence,
    closureLatencyMs: Date.now() - startedAt,
    closureHoldSteps: holdSteps,
    closureStatus: closure.status,
    closureScore: closure.score,
    closureForced: closure.forced ?? false,
    attractorDistance,
    curvatureMagnitude: stepMetrics.curvatureMagnitude ?? 0,
    entropyGate: stepMetrics.entropyGate ?? 0,
    entropyActive: stepMetrics.entropyActive ?? false,
    memoryAlignment: stepMetrics.memoryAlignment ?? 0,
  });

  return {
    output,
    state: nextState,
    closure,
    attractorDistance,
    entropyGate: stepMetrics.entropyGate,
    entropyActive: stepMetrics.entropyActive,
    memoryAlignment: stepMetrics.memoryAlignment,
    curvatureMagnitude: stepMetrics.curvatureMagnitude,
  };
};

export const initializeInteractionState = (
  options: InteractionOptions = {}
): UQRCState =>
  initializeState(options.dimension ?? 8, options.memory?.latestSeed() ?? 0);
