import { useMemo, useState } from "react";
import {
  createBrowserMemoryStore,
  createBrowserTrainingHookStore,
  decodeOutput,
  initializeInteractionState,
  runInteractionStep,
  TrainingHook,
} from "@/uqrc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const formatValue = (value: number) => value.toFixed(3);

interface ConsoleEntry {
  input: string;
  output: string;
  step: number;
}

export const UqrcDashboard = () => {
  const memory = useMemo(() => createBrowserMemoryStore("uqrc-memory"), []);
  const trainingHookStore = useMemo(
    () => createBrowserTrainingHookStore("uqrc-training-hooks"),
    []
  );
  const [state, setState] = useState(() => {
    const stored = memory.latestState();
    const initial = initializeInteractionState({
      memory,
      dimension: stored?.length ?? 8,
    });
    if (stored) {
      initial.u = stored;
    }
    return initial;
  });
  const [params] = useState({
    nu: 0.2,
    beta: 0.05,
    lMin: 1,
    curvatureStrength: 1,
    attractorStrength: 0.08,
  });
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(0.5);
  const [trainingMessage, setTrainingMessage] = useState("");
  const [trainingReply, setTrainingReply] = useState("");
  const [trainingIncurSentence, setTrainingIncurSentence] = useState("");
  const [trainingHooks, setTrainingHooks] = useState<TrainingHook[]>(
    trainingHookStore.list()
  );
  const [lastOutput, setLastOutput] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ConsoleEntry[]>([]);

  const handleRun = () => {
    if (!input.trim()) {
      return;
    }

    const result = runInteractionStep(input, state, {
      memory,
      params,
      feedback,
      trainingHooks,
    });
    setState(result.state);
    setLastOutput(result.output);
    setInput("");
  };

  const handleTrain = () => {
    if (!trainingMessage.trim() || !trainingReply.trim()) {
      return;
    }

    const hook: TrainingHook = {
      message: trainingMessage.trim(),
      reply: trainingReply.trim(),
      incurSentence: trainingIncurSentence.trim(),
      createdAt: Date.now(),
    };
    trainingHookStore.addHook(hook);
    setTrainingHooks(trainingHookStore.list());
    setTrainingMessage("");
    setTrainingReply("");
    setTrainingIncurSentence("");
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) {
      return;
    }

    const result = runInteractionStep(chatInput, state, {
      memory,
      params,
      feedback,
      trainingHooks,
    });
    setState(result.state);
    setChatHistory((prev) => [
      {
        input: chatInput,
        output: result.output,
        step: result.state.step,
      },
      ...prev,
    ]);
    setChatInput("");
  };

  const normalized = state.u.map((value) =>
    Math.max(-1, Math.min(1, value))
  );
  const memoryEntries = memory.list().slice(-5).reverse();

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-primary">UQRC Chat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleChatSend();
              }
            }}
            placeholder="Chat with the UQRC loop..."
            rows={4}
          />
          <Button onClick={handleChatSend}>Send Message</Button>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {chatHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No chat messages yet. Send a prompt to see the loop respond.
              </p>
            ) : (
              chatHistory.map((entry) => (
                <div
                  key={`${entry.step}-${entry.input}`}
                  className="rounded-md border border-border/60 bg-background/50 p-3 text-sm"
                >
                  <p className="text-xs text-muted-foreground">
                    Step {entry.step}
                  </p>
                  <p className="font-medium">You: {entry.input}</p>
                  <p className="text-muted-foreground">Loop: {entry.output}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-primary">UQRC Core Loop</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Send a single input through the UQRC update step and observe the
            immediate response from the loop.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleRun();
                }
              }}
              placeholder="Input to encode into the loop"
            />
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={feedback}
              onChange={(event) => setFeedback(Number(event.target.value))}
              placeholder="Feedback (0-1)"
            />
          </div>
          <Button onClick={handleRun}>Run UQRC Step</Button>
          {lastOutput && (
            <div className="rounded-md border border-border/60 bg-background/50 p-3 text-sm">
              <p className="text-muted-foreground">Loop response</p>
              <p className="font-medium">{lastOutput}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-primary">Training Hooks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={trainingMessage}
            onChange={(event) => setTrainingMessage(event.target.value)}
            placeholder="Message (exact match)"
          />
          <Textarea
            value={trainingReply}
            onChange={(event) => setTrainingReply(event.target.value)}
            placeholder="Trained reply"
            rows={3}
          />
          <Input
            value={trainingIncurSentence}
            onChange={(event) => setTrainingIncurSentence(event.target.value)}
            placeholder="Phrase incur sentence"
          />
          <Button variant="secondary" onClick={handleTrain}>
            Apply Training Update
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-primary">Latent State Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Step {state.step} · Predicted cue: {decodeOutput(state.u, input || "")}
          </div>
          <div className="space-y-2">
            {normalized.map((value, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="w-12 text-xs text-muted-foreground">u[{index}]</span>
                <div className="flex-1 rounded-full bg-muted/40 h-2">
                  <div
                    className="h-2 rounded-full bg-primary/80"
                    style={{ width: `${Math.abs(value) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-xs text-muted-foreground">
                  {formatValue(value)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-primary">Recent Memory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {memoryEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No memory entries yet. Run a step to persist data.
            </p>
          ) : (
            memoryEntries.map((entry) => (
              <div
                key={entry.timestamp}
                className="rounded-md border border-border/60 bg-background/50 p-3 text-sm"
              >
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleTimeString()} · feedback:{" "}
                  {entry.feedback ?? "-"}
                </p>
                <p className="font-medium">{entry.input}</p>
                <p className="text-muted-foreground">{entry.output}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
