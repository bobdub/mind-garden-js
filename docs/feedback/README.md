# Feedback Log Store

The chat interface captures structured feedback for each assistant message. Events are persisted locally using the browser's `localStorage` under the key `docs/feedback/log` so that they can be exported for offline review.  

If a backend endpoint is configured via `VITE_FEEDBACK_ENDPOINT` (or the legacy `VITE_FEEDBACK_API`), the application will also forward every event to that endpoint using `navigator.sendBeacon` when available, falling back to a standard `fetch` POST request.

## Event shape

Each entry saved in the store follows this schema:

```json
{
  "id": "uuid-string",
  "messageId": "uuid of the assistant message",
  "messageContent": "assistant message text",
  "type": "thumbs_up | thumbs_down | issue",
  "timestamp": 1700000000000,
  "comment": "optional textual note for issue reports",
  "metadata": {
    "source": "chat-interface",
    "interaction": "rating | issue-report"
  }
}
```

## Exporting feedback

To export the locally captured events for training review, execute the following snippet in the browser console:

```js
const data = localStorage.getItem('docs/feedback/log');
const blob = new Blob([data ?? '[]'], { type: 'application/json' });
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = `feedback-log-${new Date().toISOString()}.json`;
link.click();
```

This will download a JSON file that you can place inside `docs/feedback/` for archival or integrate into downstream tooling.
