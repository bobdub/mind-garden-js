import { Layer } from './Layer';
import { LocalMemory } from './LocalMemory';
import { Tagger } from './Tagger';
import type { ChatMessage } from '@/types/chat';
import { assemblePrompt, CORE_SYSTEM_PROMPT } from './promptTemplates';

export interface TrainingEntry {
  prompt: string;
  response: string;
  tags: string[];
  timestamp: number;
}

export interface SelfLearningLLMOptions {
  tagSimilarityThreshold?: number;
}

export class SelfLearningLLM {
  private inputLayer: Layer;
  private hiddenLayer: Layer;
  private outputLayer: Layer;
  private memory: LocalMemory;
  private tagger: Tagger;
  private vectorSize: number;
  private vocabulary: Map<string, number>;
  private tagSimilarityThreshold: number;

  static readonly DEFAULT_TAG_SIMILARITY_THRESHOLD = 0.5;

  constructor(
    inputSize: number = 32,
    hiddenSize: number = 16,
    outputSize: number = 32,
    options: SelfLearningLLMOptions = {}
  ) {
    this.vectorSize = inputSize;
    this.inputLayer = new Layer(hiddenSize, inputSize);
    this.hiddenLayer = new Layer(hiddenSize, hiddenSize);
    this.outputLayer = new Layer(outputSize, hiddenSize);
    this.memory = new LocalMemory('SelfLearningLLM');
    this.tagger = new Tagger();
    this.vocabulary = new Map();
    this.tagSimilarityThreshold = options.tagSimilarityThreshold ?? SelfLearningLLM.DEFAULT_TAG_SIMILARITY_THRESHOLD;

    this.loadVocabulary();
  }

  getTagSimilarityThreshold(): number {
    return this.tagSimilarityThreshold;
  }

  setTagSimilarityThreshold(value: number): void {
    if (Number.isNaN(value)) {
      return;
    }

    const clamped = Math.min(Math.max(value, 0), 1);
    this.tagSimilarityThreshold = clamped;
  }

  private loadVocabulary(): void {
    const saved = this.memory.recall('vocabulary');
    if (saved) {
      this.vocabulary = new Map(Object.entries(saved));
    }
  }

  private saveVocabulary(): void {
    this.memory.remember('vocabulary', Object.fromEntries(this.vocabulary));
  }

  vectorize(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const vector = Array(this.vectorSize).fill(0);

    words.forEach(word => {
      if (!this.vocabulary.has(word)) {
        this.vocabulary.set(word, this.vocabulary.size);
        this.saveVocabulary();
      }
      const index = this.vocabulary.get(word)! % this.vectorSize;
      vector[index] += 1;
    });

    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
  }

  tag(text: string): string[] {
    return this.tagger.extractTags(text);
  }

  predict(input: number[]): number[] {
    let output = this.inputLayer.forward(input);
    output = this.hiddenLayer.forward(output);
    output = this.outputLayer.forward(output);
    return output;
  }

  train(input: number[], target: number[], learningRate: number = 0.1): void {
    // Forward pass
    const hidden1 = this.inputLayer.forward(input);
    const hidden2 = this.hiddenLayer.forward(hidden1);
    const output = this.outputLayer.forward(hidden2);

    // Calculate errors
    const outputErrors = output.map((o, i) => target[i] - o);
    
    // Backward pass
    const hidden2Errors = this.outputLayer.train(hidden2, outputErrors, learningRate);
    const hidden1Errors = this.hiddenLayer.train(hidden1, hidden2Errors, learningRate);
    this.inputLayer.train(input, hidden1Errors, learningRate);
  }

  learnFrom(prompt: string, response: string, history: ChatMessage[] = []): void {
    const retrievalPrompt = this.buildRetrievalPrompt(prompt, history);
    const trimmedResponse = response.trim();

    if (!retrievalPrompt || !trimmedResponse) {
      return;
    }

    const inputVector = this.vectorize(retrievalPrompt);
    const targetVector = this.vectorize(trimmedResponse);
    const tags = this.tag(retrievalPrompt);

    // Train the network
    for (let i = 0; i < 10; i++) {
      this.train(inputVector, targetVector, 0.1);
    }

    // Store in memory
    const entry: TrainingEntry = {
      prompt: retrievalPrompt,
      response: trimmedResponse,
      tags,
      timestamp: Date.now()
    };

    const memories = this.getMemories();
    const existingIndex = memories.findIndex((memory) =>
      memory.prompt.localeCompare(retrievalPrompt, undefined, { sensitivity: 'accent' }) === 0 &&
      memory.response.localeCompare(trimmedResponse, undefined, { sensitivity: 'accent' }) === 0
    );

    if (existingIndex >= 0) {
      memories[existingIndex] = { ...memories[existingIndex], timestamp: entry.timestamp, tags };
    } else {
      memories.push(entry);
    }

    this.memory.remember('training_data', memories);
  }

  respond(prompt: string, history: ChatMessage[] = [], windowSize: number = 6): string {
    const contextWindow = windowSize > 0 ? history.slice(-windowSize) : [];
    const assembledPrompt = assemblePrompt({ prompt, history: contextWindow });
    const retrievalPrompt = this.buildRetrievalPrompt(prompt, contextWindow);

    if (typeof console !== 'undefined' && typeof console.debug === 'function') {
      console.debug('[SelfLearningLLM] Using system prompt', {
        systemPromptPreview: CORE_SYSTEM_PROMPT.slice(0, 120),
        assembledPrompt
      });
    }

    const inputVector = this.vectorize(assembledPrompt);
    const tags = this.tag(retrievalPrompt);

    // Check memory for similar prompts
    const memories = this.getMemories();
    const similar = memories.find((m) => this.tagger.similarity(tags, m.tags) > this.tagSimilarityThreshold);

    if (similar) {
      const adapted = this.ensureUniqueResponse(similar.response, prompt, contextWindow, similar.prompt, {
        preserveOriginal: true
      });
      if (adapted) {
        this.recordLearning(prompt, adapted, similar, contextWindow);
        return adapted;
      }
    }

    // Use neural network prediction
    const output = this.predict(inputVector);
    const prediction = this.ensureUniqueResponse(this.devectorize(output), prompt, contextWindow);

    if (prediction) {
      this.learnFrom(prompt, prediction, contextWindow);
      return prediction;
    }

    const fallback = this.buildFallbackResponse(prompt, contextWindow);
    this.learnFrom(prompt, fallback, contextWindow);
    return fallback;
  }

  private devectorize(vector: number[]): string {
    const words: Array<[string, number]> = [];
    
    this.vocabulary.forEach((index, word) => {
      const vecIndex = index % this.vectorSize;
      words.push([word, vector[vecIndex]]);
    });

    words.sort((a, b) => b[1] - a[1]);
    return words.slice(0, 5).map(w => w[0]).join(' ');
  }

  getMemories(): TrainingEntry[] {
    return this.memory.recall('training_data') || [];
  }

  clearMemory(): void {
    this.memory.clear();
    this.vocabulary.clear();
  }

  getStats() {
    const memories = this.getMemories();
    return {
      totalMemories: memories.length,
      vocabularySize: this.vocabulary.size,
      recentMemories: memories.slice(-5).reverse()
    };
  }

  private ensureUniqueResponse(
    response: string,
    prompt: string,
    history: ChatMessage[],
    referencePrompt?: string,
    options: { preserveOriginal?: boolean } = {}
  ): string {
    const trimmed = response?.trim();
    if (!trimmed) {
      return '';
    }

    const shouldPersonalize = !(options.preserveOriginal ?? Boolean(referencePrompt));
    const personalised = shouldPersonalize
      ? this.personalizeResponse(trimmed, prompt, referencePrompt)
      : trimmed;

    if (this.isDuplicate(personalised, history)) {
      return this.buildFallbackResponse(prompt, history);
    }

    return personalised;
  }

  private personalizeResponse(base: string, prompt: string, referencePrompt?: string): string {
    const cleaned = prompt.trim();
    if (!cleaned) {
      return base;
    }

    const excerpt = cleaned.length > 160 ? `${cleaned.slice(0, 157)}…` : cleaned;
    const keywords = this.extractKeywords(cleaned, 4);
    const referenceKeywords = referencePrompt ? new Set(this.extractKeywords(referencePrompt, 6)) : undefined;
    const novelKeywords = referenceKeywords
      ? keywords.filter((keyword) => !referenceKeywords.has(keyword))
      : keywords;

    const formattedKeywords = novelKeywords
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(', ');

    const details: string[] = [];

    details.push(`I'm grounding this reply in "${excerpt}".`);

    if (formattedKeywords.length > 0) {
      details.push(`Key focus points: ${formattedKeywords}.`);
    }

    if (referencePrompt && novelKeywords.length === 0 && keywords.length > 0) {
      details.push("I'm refining earlier insights to match your current wording.");
    }

    const personalization = details.join(' ');

    if (!personalization) {
      return base;
    }

    if (base.includes(personalization)) {
      return base;
    }

    return `${base}\n\n${personalization}`.trim();
  }

  private isDuplicate(candidate: string, history: ChatMessage[]): boolean {
    const lastAssistant = this.getLastAssistantMessage(history)?.content?.trim();
    return Boolean(
      lastAssistant &&
      lastAssistant.localeCompare(candidate.trim(), undefined, { sensitivity: 'accent' }) === 0
    );
  }

  private recordLearning(
    prompt: string,
    response: string,
    reference: TrainingEntry,
    history: ChatMessage[]
  ): void {
    const retrievalPrompt = this.buildRetrievalPrompt(prompt, history);

    if (reference.prompt.trim() === retrievalPrompt.trim()) {
      this.learnFrom(prompt, response, history);
      return;
    }

    const blendedResponse = `${response}\n\n(Adapted from earlier context on: "${reference.prompt}")`;
    this.learnFrom(prompt, blendedResponse, history);
  }

  private buildRetrievalPrompt(prompt: string, history: ChatMessage[] = []): string {
    const trimmedPrompt = prompt.trim();

    if (trimmedPrompt) {
      return trimmedPrompt;
    }

    const lastUserMessage = [...history]
      .reverse()
      .find((entry) => entry.role === 'user' && entry.content?.trim().length);

    return lastUserMessage?.content.trim() ?? '';
  }

  private getLastAssistantMessage(history: ChatMessage[]): ChatMessage | undefined {
    return [...history].reverse().find((entry) => entry.role === 'assistant');
  }

  private buildFallbackResponse(prompt: string, history: ChatMessage[]): string {
    const cleaned = prompt.trim();
    const excerpt = cleaned.length > 140 ? `${cleaned.slice(0, 137)}…` : cleaned;
    const keywords = this.extractKeywords(cleaned, 3);
    const capitalizedKeywords = keywords.map((word) => word.charAt(0).toUpperCase() + word.slice(1));

    const topic = capitalizedKeywords.length > 0
      ? capitalizedKeywords.join(', ')
      : 'that';

    const acknowledgement = capitalizedKeywords.length > 0
      ? `I appreciate you bringing up ${topic}.`
      : 'I appreciate you sharing that.';

    const reflection = excerpt
      ? `I'm understanding your message as focusing on "${excerpt}".`
      : "I'm listening closely even if the details are still forming.";

    const invitations = [
      'How would you like us to explore this together?',
      'What outcome would feel most supportive for you here?',
      'Let me know where you’d like to take the conversation next.'
    ];

    const invitation = invitations[history.length % invitations.length];

    return `${acknowledgement} ${reflection} ${invitation}`.trim();
  }

  private extractKeywords(text: string, limit: number): string[] {
    return text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3)
      .slice(0, limit);
  }
}
