export class Tagger {
  private intentKeywords: Map<string, string[]> = new Map([
    ['question', ['what', 'why', 'how', 'when', 'where', 'who', 'which', '?']],
    ['greeting', ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good evening']],
    ['farewell', ['bye', 'goodbye', 'see you', 'farewell', 'take care']],
    ['affirmative', ['yes', 'yeah', 'sure', 'okay', 'ok', 'alright']],
    ['negative', ['no', 'nope', 'nah', 'not really']],
  ]);

  extractTags(text: string): string[] {
    const tags: Set<string> = new Set();
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);

    // Add word tokens
    words.forEach(word => {
      if (word.length > 2) {
        tags.add(word);
      }
    });

    // Detect intent
    this.intentKeywords.forEach((keywords, intent) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        tags.add(`intent:${intent}`);
      }
    });

    // Add length indicator
    if (words.length < 5) {
      tags.add('length:short');
    } else if (words.length < 15) {
      tags.add('length:medium');
    } else {
      tags.add('length:long');
    }

    return Array.from(tags);
  }

  similarity(tags1: string[], tags2: string[]): number {
    const set1 = new Set(tags1);
    const set2 = new Set(tags2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }
}
