import { useMemo, useState } from "react";
import {
  createBrowserMemoryStore,
  createBrowserMetricsStore,
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
  const metricsStore = useMemo(
    () => createBrowserMetricsStore("uqrc-metrics"),
    []
  );
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
    intentStrength: 0.12,
    continuityStrength: 0.1,
    narrativeTimeWeight: 0.15,
    completionWeight: 0.4,
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
  const [metricsEntries, setMetricsEntries] = useState(
    metricsStore.list()
  );

  const handleRun = () => {
    if (!input.trim()) {
      return;
    }

    const result = runInteractionStep(input, state, {
      memory,
      metricsStore,
      params,
      feedback,
      trainingHooks,
    });
    setState(result.state);
    setLastOutput(result.output);
    setMetricsEntries(metricsStore.list());
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
      metricsStore,
      params,
      feedback,
      trainingHooks,
    });
    setState(result.state);
    setChatHistory((prev) => [
      ...prev,
      {
        input: chatInput,
        output: result.output,
        step: result.state.step,
      },
    ]);
    setMetricsEntries(metricsStore.list());
    setChatInput("");
  };

  const normalized = state.u.map((value) =>
    Math.max(-1, Math.min(1, value))
  );
  const memoryEntries = memory.list().slice(-5).reverse();
  const recentMetrics = metricsEntries.slice(-5).reverse();
  const latestMetrics = metricsStore.latest();

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-primary">Inline Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Exchange in-line prompts with the loop. Messages thread in sequence,
            with each step emitted as a paired response.
          </p>
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
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleChatSend}>Send Message</Button>
            <span className="text-xs text-muted-foreground">
              Shift + Enter for a new line
            </span>
          </div>
          <div className="space-y-4 max-h-72 overflow-y-auto rounded-xl border border-border/60 bg-background/40 p-4">
            {chatHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No chat messages yet. Send a prompt to see the loop respond.
              </p>
            ) : (
              chatHistory.map((entry) => (
                <div key={`${entry.step}-${entry.input}`} className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Step {entry.step}</span>
                    <span>Inline thread</span>
                  </div>
                  <div className="grid gap-3">
                    <div className="chat-bubble chat-bubble-user justify-self-end">
                      <span className="font-medium">You</span>: {entry.input}
                    </div>
                    <div className="chat-bubble chat-bubble-loop justify-self-start">
                      <span className="font-medium text-foreground">Loop</span>:{" "}
                      {entry.output}
                    </div>
                  </div>
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

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-primary">Phase 7 Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {latestMetrics ? (
            <div className="rounded-md border border-border/60 bg-background/50 p-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Step {latestMetrics.step} ·{" "}
                {new Date(latestMetrics.timestamp).toLocaleTimeString()}
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Semantic divergence</p>
                  <p className="font-medium">
                    {formatValue(latestMetrics.semanticDivergence)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Closure latency</p>
                  <p className="font-medium">
                    {latestMetrics.closureLatencyMs} ms ·{" "}
                    {latestMetrics.closureHoldSteps} holds
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Attractor distance</p>
                  <p className="font-medium">
                    {formatValue(latestMetrics.attractorDistance)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Curvature magnitude</p>
                  <p className="font-medium">
                    {formatValue(latestMetrics.curvatureMagnitude)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Entropy gate</p>
                  <p className="font-medium">
                    {formatValue(latestMetrics.entropyGate)} ·{" "}
                    {latestMetrics.entropyActive ? "active" : "idle"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Memory alignment</p>
                  <p className="font-medium">
                    {formatValue(latestMetrics.memoryAlignment)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No metrics captured yet. Run a step to collect Phase 7 signals.
            </p>
          )}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Recent metric logs</p>
            {recentMetrics.length === 0 ? (
              <p className="text-muted-foreground">
                No metric entries recorded.
              </p>
            ) : (
              recentMetrics.map((entry) => (
                <div
                  key={`${entry.timestamp}-${entry.step}`}
                  className="rounded-md border border-border/60 bg-background/50 p-3"
                >
                  <p className="text-xs text-muted-foreground">
                    Step {entry.step} ·{" "}
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="text-muted-foreground">
                    Divergence {formatValue(entry.semanticDivergence)} · Closure{" "}
                    {formatValue(entry.closureScore)} · Entropy{" "}
                    {formatValue(entry.entropyGate)}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
