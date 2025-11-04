# Analytics Overview

## Approach
- **Implementation:** Lightweight custom analytics pipeline implemented in `src/lib/analytics/AnalyticsTracker.ts`.
- **Storage:** Events are buffered in `localStorage` under the `analytics/events` key and capped at the 100 most recent records.
- **Transport:** When an environment variable `VITE_ANALYTICS_ENDPOINT` is provided, events are streamed via `navigator.sendBeacon` (with a `fetch` fallback).
- **Privacy Safeguards:**
  - Honors browser and system "Do Not Track" settings as well as a manual opt-out flag stored at `analytics:opt-out`.
  - Skips collection whenever `VITE_ANALYTICS_DISABLED` is set to `true`.
  - Never persists raw message content, prompts, or personally identifying data—only anonymised counts, lengths, and the last six characters of message IDs.

## Event Catalogue
| Event | Trigger | Payload Highlights |
|-------|---------|--------------------|
| `session_start` | Fired once when the React app mounts (`App.tsx`). | Locale & timezone (when available) plus consent mode (`implied` or `explicit`). |
| `lesson_completed` | Emitted after the training workflow finishes (`TrainingPanel.tsx`). | Prompt/response lengths, word counts, and derived tag count only. |
| `feedback_submitted` | Logged from `FeedbackLogger.log` whenever a thumbs-up/down or issue report is stored. | Feedback type, comment presence, partial message identifier, and interaction source metadata. |

### Opting Out
Call `localStorage.setItem('analytics:opt-out', '1')` and refresh to immediately disable analytics. Removing the key or setting it to `'0'` re-enables collection.

## Quick Checks & Reporting
Paste the helper below into the browser console to generate an at-a-glance report. It summarises the persisted analytics without exposing raw content:

```js
(function generateAnalyticsSummary() {
  const raw = localStorage.getItem('analytics/events');
  if (!raw) {
    console.info('[analytics] no events captured yet');
    return;
  }

  const events = JSON.parse(raw);
  const totals = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {});

  const lessonStats = events
    .filter((event) => event.type === 'lesson_completed')
    .reduce((acc, event) => {
      acc.totalPromptWords += event.payload.promptWordCount;
      acc.totalResponseWords += event.payload.responseWordCount;
      acc.totalTags += event.payload.tagCount;
      return acc;
    }, { totalPromptWords: 0, totalResponseWords: 0, totalTags: 0 });

  console.table(totals, ['Events']);
  console.table({ lessonStats });
})();
```

> **Tip:** During development you can clear the analytics buffer by running `localStorage.removeItem('analytics/events')`.

## Future Enhancements
1. Sync batched analytics to a privacy-preserving data warehouse (e.g., PostHog or Supabase) with encryption at rest.
2. Surface the summary snippet above as an in-app admin panel with charts (Recharts is already a dependency).
3. Layer in consent UI toggles so users can opt out without using developer tools.
