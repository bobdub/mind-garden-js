export type ClosureStatus = "allow" | "hold";

export interface SemanticClosureOptions {
  minTokens?: number;
  disallowedEndings?: string[];
}

export interface SemanticClosureResult {
  status: ClosureStatus;
  score: number;
  reasons: string[];
  forced?: boolean;
}

const DEFAULT_DISALLOWED_ENDINGS = [
  "and",
  "or",
  "but",
  "because",
  "so",
  "to",
  "the",
  "a",
  "an",
  "of",
  "with",
  "for",
  "in",
];

export const evaluateSemanticClosure = (
  output: string,
  options: SemanticClosureOptions = {}
): SemanticClosureResult => {
  const tokens = output.split(/\s+/).filter(Boolean);
  const minTokens = Math.max(1, options.minTokens ?? 2);
  const disallowed = new Set(
    (options.disallowedEndings ?? DEFAULT_DISALLOWED_ENDINGS).map((value) =>
      value.toLowerCase()
    )
  );

  const reasons: string[] = [];
  const lastToken = tokens[tokens.length - 1]?.toLowerCase();
  let score = 1;

  if (tokens.length < minTokens) {
    reasons.push("below_min_tokens");
    score -= 0.6;
  }

  if (lastToken && disallowed.has(lastToken)) {
    reasons.push("ends_with_connector");
    score -= 0.4;
  }

  score = Math.max(0, Math.min(1, score));

  return {
    status: reasons.length === 0 ? "allow" : "hold",
    score,
    reasons,
  };
};
