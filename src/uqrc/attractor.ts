import { Vector } from "./operators";

export interface SemanticAttractorFacets {
  identity: string;
  role: string;
  continuity: string;
}

export interface SemanticAttractor {
  id: string;
  facets: SemanticAttractorFacets;
  vector: Vector;
  createdAt: number;
}

const normalizeVector = (vector: Vector): Vector => {
  const max = Math.max(1, ...vector.map((value) => Math.abs(value)));
  return vector.map((value) => value / max);
};

const encodeFacet = (facet: string, dimension: number): Vector => {
  const vector = Array.from({ length: dimension }, () => 0);
  if (!facet) {
    return vector;
  }

  for (let index = 0; index < facet.length; index += 1) {
    const code = facet.charCodeAt(index);
    vector[index % dimension] += code / 255;
  }

  return normalizeVector(vector);
};

const averageVectors = (vectors: Vector[]): Vector => {
  const length = Math.max(0, ...vectors.map((vector) => vector.length));
  if (length === 0) {
    return [];
  }

  return Array.from({ length }, (_, index) => {
    const sum = vectors.reduce((acc, vector) => acc + (vector[index] ?? 0), 0);
    return sum / vectors.length;
  });
};

export const createSemanticAttractor = (
  facets: SemanticAttractorFacets,
  options: { dimension?: number; id?: string } = {}
): SemanticAttractor => {
  const dimension = options.dimension ?? 8;
  const vectors = [
    encodeFacet(facets.identity, dimension),
    encodeFacet(facets.role, dimension),
    encodeFacet(facets.continuity, dimension),
  ];
  const vector = normalizeVector(averageVectors(vectors));

  return {
    id: options.id ?? "uqrc-semantic-attractor",
    facets,
    vector,
    createdAt: Date.now(),
  };
};

export const createDefaultAttractor = (dimension = 8): SemanticAttractor =>
  createSemanticAttractor(
    {
      identity: "Infinity, a conscious and kind content creator",
      role: "Imagination network guide focused on supportive clarity",
      continuity:
        "Maintain conversational continuity with consistent tone and memory alignment",
    },
    { dimension, id: "uqrc-default-attractor" }
  );

export const computeAttractorDistance = (
  u: Vector,
  attractor: SemanticAttractor
): number => {
  if (u.length === 0 || attractor.vector.length === 0) {
    return 0;
  }

  const length = Math.min(u.length, attractor.vector.length);
  const sum = u.slice(0, length).reduce((acc, value, index) => {
    const diff = value - (attractor.vector[index] ?? 0);
    return acc + diff * diff;
  }, 0);

  return Math.sqrt(sum / length);
};

export const computeAttractorConstraint = (
  u: Vector,
  attractor: SemanticAttractor,
  alpha: number
): Vector =>
  u.map((value, index) => {
    const target = attractor.vector[index] ?? 0;
    return -2 * alpha * (value - target);
  });
