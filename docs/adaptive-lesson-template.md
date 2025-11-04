# Adaptive Lesson Template

Use this template to author new lesson cards that the adaptive loader can score and recommend. Files can be authored in Markdown (for readability) and mirrored as JSON or TypeScript objects when shipping inside `src/content/`.

```json
{
  "id": "string — unique slug",
  "title": "string",
  "summary": "string — 1–2 sentence overview",
  "level": "beginner | intermediate | advanced",
  "estimatedDuration": "string — e.g. '15 min'",
  "format": "mini-lesson | workshop | challenge | reference",
  "tags": ["array", "of", "keywords"],
  "objectives": ["learner-facing outcomes"],
  "content": "markdown body rendered in the lesson viewer",
  "activities": [
    {
      "type": "reflection | practice | build | explore",
      "prompt": "call to action",
      "expectedOutcome": "what success looks like"
    }
  ],
  "recommendedResources": [
    {
      "title": "resource label",
      "type": "article | video | reference | sandbox",
      "description": "why it helps",
      "url": "https://optional-link"
    }
  ],
  "prerequisites": ["optional lesson ids or knowledge requirements"]
}
```

## Authoring Guidelines

1. **Tag intentionally:** Use 3–7 tags that match the learner interests/goals vocabulary (`prompting`, `ethics`, `analytics`, etc.).
2. **Objectives drive scoring:** Keep objectives action-oriented; they are surfaced as bullet points alongside recommendations.
3. **Activities reinforce goals:** At least one activity should align with a persona, safety, or analytics outcome so feedback sentiment can map back cleanly.
4. **Keep bodies lightweight:** The `content` field is markdown-rendered; aim for 3 short sections with headings or callouts.
5. **Link to follow-ons:** Use `prerequisites` and cross-links in `recommendedResources` to help the loader chain lessons by depth.
