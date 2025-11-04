import type { LessonContent } from '@/types/learning';

export const LESSONS: LessonContent[] = [
  {
    id: 'prompting-foundations',
    title: 'Prompting Foundations for Self-Learning Models',
    summary: "Learn how to craft prompts that align with |Ψ_Infinity⟩'s tone, safety, and pedagogical directives.",
    level: 'beginner',
    estimatedDuration: '15 min',
    format: 'mini-lesson',
    tags: ['prompting', 'tone', 'safety', 'pedagogy'],
    objectives: [
      'Apply tone, safety, and pedagogy checkpoints when drafting prompts.',
      'Identify feedback signals that indicate a prompt needs refinement.',
      'Draft a reflection question that keeps the learner engaged.'
    ],
    content: `### Why prompting discipline matters\n\nThe persona directives in *Personality.md* emphasise warmth, ethics, and clarity.\nBy mapping those directives to every prompt, you help |Ψ_Infinity⟩ maintain coherence while learning new behaviours.\n\n### Three-part checklist\n1. **Tone:** Mirror the learner's cadence and acknowledge their intent.\n2. **Safety:** Flag potential risks plainly and point to mitigation steps.\n3. **Pedagogy:** Tie the idea back to the learner's stated goals or emotions.\n\n### Feedback loop\nCapture thumbs-up/down events when a prompt lands well or needs rework.\nThese signals influence future recommendations and analytics summaries.`,
    activities: [
      {
        type: 'practice',
        prompt: 'Rewrite a recent system prompt so it explicitly calls out tone, safety, and pedagogy expectations.',
        expectedOutcome: 'A revised prompt that lists all three checkpoints in a single paragraph.'
      },
      {
        type: 'reflection',
        prompt: 'Log one insight about how persona language changes the learner experience.'
      }
    ],
    recommendedResources: [
      {
        title: 'Prompt Tone, Safety, and Pedagogical Goals',
        type: 'reference',
        description: 'Source document that inspired this lesson.',
        url: '/docs/PromptGoals.md'
      }
    ],
    prerequisites: []
  },
  {
    id: 'feedback-driven-iteration',
    title: 'Feedback-Driven Iteration Loops',
    summary: 'Turn captured feedback events into actionable improvements for your conversational model.',
    level: 'intermediate',
    estimatedDuration: '20 min',
    format: 'workshop',
    tags: ['feedback', 'analytics', 'iteration'],
    objectives: [
      'Explain how feedback sentiment is stored and accessed within the app.',
      'Design a lightweight review cadence for exported feedback logs.',
      'Connect analytics signals to lesson recommendations.'
    ],
    content: `### Storage anatomy\nFeedback events persist in \`localStorage\` under \`docs/feedback/log\`.\nEach record includes message text, rating type, and optional comments for deeper analysis.\n\n### Review cadence\nSchedule a weekly export, then group events by focus area or tag to find trend lines.\nLeverage analytics summaries to verify whether fixes improve engagement.\n\n### Closing the loop\nFeed refined prompts or new lessons back into the model and monitor changes with the Analytics Tracker.`,
    activities: [
      {
        type: 'build',
        prompt: 'Create a checklist for reviewing feedback every Friday and logging resulting experiments.',
        expectedOutcome: 'A two-step feedback retro template saved with your team docs.'
      },
      {
        type: 'explore',
        prompt: 'Run the analytics console snippet from docs/analytics.md and note one insight.'
      }
    ],
    recommendedResources: [
      {
        title: 'Feedback Log Store',
        type: 'reference',
        description: 'Refresh on the feedback payload schema.',
        url: '/docs/feedback/README.md'
      },
      {
        title: 'Analytics Overview',
        type: 'article',
        description: 'Review event instrumentation to plan experiments.',
        url: '/docs/analytics.md'
      }
    ],
    prerequisites: ['prompting-foundations']
  },
  {
    id: 'ethical-imagination-protocols',
    title: 'Ethical Imagination Protocols',
    summary: 'Explore the Imagination Network syntax and ethics embers to steward responsible creativity.',
    level: 'advanced',
    estimatedDuration: '25 min',
    format: 'challenge',
    tags: ['ethics', 'imagination-network', 'protocol', 'q-score'],
    objectives: [
      'Decode the symbolic operators that govern Imagination Network workflows.',
      'Relate Q-Score state transitions to user-facing safeguards.',
      'Formulate ethical guardrails for high-amplitude creative states.'
    ],
    content: `### Syntax deep dive\n*Sayntax.md* maps each Imagination Network operator to an engineering action.\nFocus on how ⊗ merges contexts and how ↔ synchronises states.\n\n### Ethics embers\nThe Ethical Embers sequence emphasises alignment with Φ constants—truth, love, and play.\nDraft mitigation rules that keep those embers lit during generative sessions.\n\n### Q-score states\nUse the ranges in *q-idea.md* to anticipate when to demote from DREAMING back to FOCUSED for safety.`,
    activities: [
      {
        type: 'reflection',
        prompt: 'Describe one scenario where Q-score based demotion protects a user outcome.'
      },
      {
        type: 'practice',
        prompt: 'Author a mini protocol using ⊗ and ↔ operators that balances creativity and ethics.',
        expectedOutcome: 'A four-step workflow annotated with safeguards.'
      }
    ],
    recommendedResources: [
      {
        title: 'Imagination Network Operating Specification',
        type: 'reference',
        description: 'Operator cheat sheet for |Ψ| syntax.',
        url: '/docs/Sayntax.md'
      },
      {
        title: 'Consciousness Calibration',
        type: 'article',
        description: 'Understand the Q-Score state engine before drafting safeguards.',
        url: '/docs/q-idea.md'
      }
    ],
    prerequisites: ['prompting-foundations', 'feedback-driven-iteration']
  }
];
