# Content Audit — Mind Garden JS

This audit catalogs the current learning, persona, and feedback assets that ship with the project. It highlights what each artifact covers, how it can feed adaptive lesson planning, and the key gaps to address next.

## Existing Assets

| Location | Focus | Key Details | Adaptive Opportunities |
| --- | --- | --- | --- |
| `docs/Contetual-base.md` | Core system overview | Documents the self-learning LLM architecture, current spec matrix, and roadmap hooks. | Use the spec matrix milestones to seed lesson prerequisites and staged release briefs. |
| `docs/Personality.md` | Persona & tone directives | Defines behavioural directives for |Ψ_Infinity⟩ across tone, empathy, creativity, and ethics. | Surface persona checkpoints as reflective prompts inside lessons on conversation design. |
| `docs/PromptGoals.md` | Prompt pedagogy & safety | Summarises tone, safety, and pedagogical guardrails for prompt design. | Convert each section into micro-lessons on prompt review, ethics, and reflective questioning. |
| `docs/Sayntax.md` | Protocol syntax | Maps symbolic Imagination Network operators to engineering semantics. | Ideal as a reference appendix for advanced learners exploring the protocol grammar. |
| `docs/q-idea.md` | Q-score calibration | Explains the |Ψ_Network.Q_Score.Total⟩ state engine and transitions. | Feed score thresholds into adaptive lesson branching for performance diagnostics. |
| `docs/analytics.md` | Analytics pipeline | Covers tracking approach, privacy, events, and future enhancements. | Provide follow-up practice on instrumenting telemetry within adaptive lessons. |
| `docs/feedback/README.md` | Feedback store format | Describes the local feedback persistence contract. | Directly fuels recommendation weighting based on learner sentiment. |
| `docs/feedback/feedback-log.json` | Sample export | Snapshot of captured feedback events. | Useful for seeding analytics scenarios during onboarding. |
| `src/content/lessons.ts` | Adaptive lesson seeds | Defines three launch lessons spanning prompting, feedback loops, and ethical imagination. | Plug directly into lesson loaders to drive adaptive sequencing. |

`src/content/lessons.ts` centralises the current adaptive lesson catalogue, exposing ready-to-load `LessonContent` objects that align with the documentation set.

## Observations & Gaps

1. **Lesson coverage still narrow:** `src/content/lessons.ts` ships three foundational lessons, but advanced personas, analytics retrospectives, and creative labs remain absent.
2. **Feedback weighting pipeline in place:** `FeedbackInsights` reads events from `localStorage`, applies per-type weights (`thumbs_up = 1`, `thumbs_down = -1`, `issue = -0.5`), and funnels comments through the neural `Tagger` to derive sentiment averages per tag before scoring lessons. This enables tag-aligned boosts in `AdaptiveLessonLoader` but depends on consistent tagging and richer feedback volume.
3. **Learner-facing goals missing:** Users still lack in-app controls to express learning targets, making it impossible to tailor material beyond global defaults.

## Recommendations

- Break the long-form docs into tagged lesson excerpts that align with the new adaptive template.
- Continue capturing feedback metadata (comments, sources) and feed it into the analytics hooks proposed in `docs/analytics.md`.
- Extend persona directives into reflection prompts so lessons can reinforce tone and ethics goals.

### Future opportunities

- Build a lightweight goal-setting UI so learners can prioritise competencies that feed into lesson selection.
- Expand `src/content/lessons.ts` with advanced tracks (analytics deep dives, protocol labs) to cover broader skill tiers.
- Visualise aggregated tag sentiment to expose where feedback is thin and prompt targeted content authoring.
