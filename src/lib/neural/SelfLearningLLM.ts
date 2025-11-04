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

export class SelfLearningLLM {
  private inputLayer: Layer;
  private hiddenLayer: Layer;
  private outputLayer: Layer;
  private memory: LocalMemory;
  private tagger: Tagger;
  private vectorSize: number;
  private vocabulary: Map<string, number>;

  constructor(inputSize: number = 32, hiddenSize: number = 16, outputSize: number = 32) {
    this.vectorSize = inputSize;
    this.inputLayer = new Layer(hiddenSize, inputSize);
    this.hiddenLayer = new Layer(hiddenSize, hiddenSize);
    this.outputLayer = new Layer(outputSize, hiddenSize);
    this.memory = new LocalMemory('SelfLearningLLM');
    this.tagger = new Tagger();
    this.vocabulary = new Map();
    
    this.loadVocabulary();
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

  learnFrom(prompt: string, response: string): void {
    const inputVector = this.vectorize(prompt);
    const targetVector = this.vectorize(response);
    const tags = this.tag(prompt);

    // Train the network
    for (let i = 0; i < 10; i++) {
      this.train(inputVector, targetVector, 0.1);
    }

    // Store in memory
    const entry: TrainingEntry = {
      prompt,
      response,
      tags,
      timestamp: Date.now()
    };

    const memories = this.getMemories();
    memories.push(entry);
    this.memory.remember('training_data', memories);
  }

  respond(prompt: string, history: ChatMessage[] = [], windowSize: number = 6): string {
    const contextWindow = windowSize > 0 ? history.slice(-windowSize) : [];
    const assembledPrompt = assemblePrompt({ prompt, history: contextWindow });
    const contextText = contextWindow
      .map((entry) => `${entry.role === 'user' ? 'User' : 'Assistant'}: ${entry.content}`)
      .join(' ')
      .trim();
    const contextualPrompt = contextText
      ? `${contextText} User: ${prompt}`
      : prompt;

    if (typeof console !== 'undefined' && typeof console.debug === 'function') {
      console.debug('[SelfLearningLLM] Using system prompt', {
        systemPromptPreview: CORE_SYSTEM_PROMPT.slice(0, 120),
        assembledPrompt
      });
    }

    const inputVector = this.vectorize(assembledPrompt);
    const tags = this.tag(contextualPrompt);

    // Check memory for similar prompts
    const memories = this.getMemories();
    const similar = memories.find((m) => this.tagger.similarity(tags, m.tags) > 0.5);

    if (similar) {
      return this.ensureUniqueResponse(similar.response, prompt, contextWindow);
    }

    // Use neural network prediction
    const output = this.predict(inputVector);
    const prediction = this.ensureUniqueResponse(this.devectorize(output), prompt, contextWindow);

    if (prediction) {
      return prediction;
    }

    return this.buildFallbackResponse(
      prompt,
      contextWindow,
      this.getRecentAssistantMessages(contextWindow, 3)
    );
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
    history: ChatMessage[]
  ): string {
    const trimmed = response?.trim();
    const recentAssistantMessages = this.getRecentAssistantMessages(history, 3);

    if (!trimmed) {
      return this.buildFallbackResponse(prompt, history, recentAssistantMessages);
    }

    const isDuplicate = recentAssistantMessages.some(
      (message) => message.localeCompare(trimmed, undefined, { sensitivity: 'accent' }) === 0
    );

    if (isDuplicate) {
      return this.buildFallbackResponse(prompt, history, [...recentAssistantMessages, trimmed]);
    }

    return trimmed;
  }

  private getRecentAssistantMessages(history: ChatMessage[], limit: number = 3): string[] {
    const responses: string[] = [];

    for (let i = history.length - 1; i >= 0 && responses.length < limit; i -= 1) {
      const entry = history[i];
      if (entry.role === 'assistant') {
        const content = entry.content?.trim();
        if (content) {
          responses.push(content);
        }
      }
    }

    return responses;
  }

  private buildFallbackResponse(
    prompt: string,
    history: ChatMessage[],
    disallowed: string[] = []
  ): string {
    const cleaned = prompt.trim();
    const excerpt = cleaned.length > 140 ? `${cleaned.slice(0, 137)}…` : cleaned;
    const keywords = this.extractKeywords(cleaned, 3);
    const capitalizedKeywords = keywords.map((word) => word.charAt(0).toUpperCase() + word.slice(1));

    const topic = this.buildTopicPhrase(capitalizedKeywords);
    const normalizedDisallowed = new Set(
      disallowed.map((entry) => entry.trim().toLowerCase()).filter(Boolean)
    );

    const acknowledgementVariants = capitalizedKeywords.length > 0
      ? [
          `I appreciate you bringing up ${topic}.`,
          `Thanks for opening up about ${topic}.`,
          `Your perspective on ${topic} helps me understand where to focus.`
        ]
      : [
          'I appreciate you sharing that.',
          'Thank you for letting me know.',
          'I’m listening and taking in what you’re saying.'
        ];

    const reflectionVariants = excerpt
      ? [
          `I'm understanding your message as focusing on "${excerpt}".`,
          `It sounds like you're exploring "${excerpt}".`,
          `I'm hearing curiosity around "${excerpt}".`
        ]
      : [
          "I'm listening closely even if the details are still forming.",
          "I'm here with you even as the ideas are taking shape.",
          "Even if it's still unfolding, I'm following along with you."
        ];

    const focus = this.buildFocusPrompt(topic, keywords);
    const invitationVariants = [
      'How would you like us to explore this together?',
      'What outcome would feel most supportive for you here?',
      `Is there a particular aspect of ${focus} you'd like to unpack next?`,
      `Would it help if I shared a few perspectives on ${focus}, or is there another angle you’d prefer?`
    ];

    const combinations: string[] = [];
    acknowledgementVariants.forEach((acknowledgement) => {
      reflectionVariants.forEach((reflection) => {
        invitationVariants.forEach((invitation) => {
          combinations.push(`${acknowledgement} ${reflection} ${invitation}`.trim());
        });
      });
    });

    const baseIndex = this.computeDeterministicIndex(cleaned || topic, combinations.length);
    for (let offset = 0; offset < combinations.length; offset += 1) {
      const candidate = combinations[(baseIndex + offset) % combinations.length];
      if (!normalizedDisallowed.has(candidate.toLowerCase())) {
        return candidate;
      }
    }

    return combinations[baseIndex % combinations.length];
  }

  private extractKeywords(text: string, limit: number): string[] {
    return text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3)
      .slice(0, limit);
  }

  private buildTopicPhrase(keywords: string[]): string {
    if (keywords.length === 0) {
      return 'that';
    }

    if (keywords.length === 1) {
      return keywords[0];
    }

    if (keywords.length === 2) {
      return `${keywords[0]} and ${keywords[1]}`;
    }

    return `${keywords.slice(0, -1).join(', ')}, and ${keywords[keywords.length - 1]}`;
  }

  private buildFocusPrompt(topic: string, keywords: string[]): string {
    if (keywords.length === 0) {
      return 'this topic';
    }

    if (keywords.length === 1) {
      return keywords[0];
    }

    if (keywords.length === 2) {
      return `${keywords[0]} or ${keywords[1]}`;
    }

    const lowerTopic = topic.toLowerCase();
    return `${keywords[0]} or related ideas around ${lowerTopic}`;
  }

  private computeDeterministicIndex(seed: string, modulo: number): number {
    if (modulo <= 0) {
      return 0;
    }

    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) % 2147483647;
    }

    return hash % modulo;
  }
}
