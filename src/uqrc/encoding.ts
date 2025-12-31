import { Vector } from "./operators";

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
