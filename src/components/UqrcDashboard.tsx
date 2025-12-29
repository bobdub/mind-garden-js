import { useMemo, useState } from "react";
import {
  computeUqrcLearningLoss,
  createBrowserMemoryStore,
  defaultLossWeights,
  decodeOutput,
  encodeInput,
  initializeInteractionState,
  runInteractionStep,
  updateParameters,
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
  const [params, setParams] = useState({
    nu: 0.2,
    beta: 0.05,
    lMin: 1,
    curvatureStrength: 1,
  });
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(0.5);
  const [trainingTarget, setTrainingTarget] = useState("");
  const [trainingParaphrase, setTrainingParaphrase] = useState("");
  const [trainingEvidence, setTrainingEvidence] = useState("");
  const [lastOutput, setLastOutput] = useState<string | null>(null);
  const [lastLoss, setLastLoss] = useState<number | null>(null);
  const [lossBreakdown, setLossBreakdown] = useState<{
    task: number;
    entropy: number;
    fluency: number;
    memory: number;
    redundancy: number;
    verifiability: number;
    creativity: number;
  } | null>(null);
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
    });
    setState(result.state);
    setLastOutput(result.output);
    setInput("");
  };

  const handleTrain = () => {
    if (!trainingTarget.trim()) {
      return;
    }

    const targetVector = encodeInput(trainingTarget, state.u.length);
    const paraphraseVector = trainingParaphrase.trim()
      ? encodeInput(trainingParaphrase, state.u.length)
      : undefined;
    const evidenceVector = trainingEvidence.trim()
      ? encodeInput(trainingEvidence, state.u.length)
      : undefined;
    const memoryEntriesForTraining = memory.list();
    const previousState =
      memoryEntriesForTraining.length > 1
        ? memoryEntriesForTraining[memoryEntriesForTraining.length - 2]?.u
        : undefined;
    const creativitySamples = memoryEntriesForTraining
      .slice(-3)
      .map((entry) => entry.u);

    const result = computeUqrcLearningLoss(
      {
        prediction: state.u,
        target: targetVector,
        previous: previousState,
        paraphrase: paraphraseVector,
        evidence: evidenceVector,
        creativitySamples,
      },
      { ...defaultLossWeights, entropy: 0.08 }
    );

    setParams((current) => updateParameters(current, result.total, 0.05));
    setLastLoss(result.total);
    setLossBreakdown({
      task: result.task,
      entropy: result.entropy,
      fluency: result.fluency,
      memory: result.memory,
      redundancy: result.redundancy,
      verifiability: result.verifiability,
      creativity: result.creativity,
    });
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) {
      return;
    }

    const result = runInteractionStep(chatInput, state, {
      memory,
      params,
      feedback,
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
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
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
          <CardTitle className="text-primary">Operator Parameters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input
            type="number"
            step={0.05}
            value={params.nu}
            onChange={(event) =>
              setParams((current) => ({
                ...current,
                nu: Number(event.target.value),
              }))
            }
            placeholder="Diffusion ν"
          />
          <Input
            type="number"
            step={0.05}
            value={params.beta}
            onChange={(event) =>
              setParams((current) => ({
                ...current,
                beta: Number(event.target.value),
              }))
            }
            placeholder="Coercive β"
          />
          <Input
            type="number"
            step={0.1}
            value={params.curvatureStrength}
            onChange={(event) =>
              setParams((current) => ({
                ...current,
                curvatureStrength: Number(event.target.value),
              }))
            }
            placeholder="Curvature strength"
          />
          <Input
            type="number"
            step={0.5}
            value={params.lMin}
            onChange={(event) =>
              setParams((current) => ({
                ...current,
                lMin: Number(event.target.value),
              }))
            }
            placeholder="Discrete step ℓmin"
          />
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-primary">Training Hooks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={trainingTarget}
            onChange={(event) => setTrainingTarget(event.target.value)}
            placeholder="Target phrase for training"
          />
          <Input
            value={trainingParaphrase}
            onChange={(event) => setTrainingParaphrase(event.target.value)}
            placeholder="Optional paraphrase (redundancy anchor)"
          />
          <Input
            value={trainingEvidence}
            onChange={(event) => setTrainingEvidence(event.target.value)}
            placeholder="Optional evidence phrase (verifiability anchor)"
          />
          <Button variant="secondary" onClick={handleTrain}>
            Apply Training Update
          </Button>
          {lastLoss !== null && (
            <div className="rounded-md border border-border/60 bg-background/50 p-3 text-sm space-y-1">
              <p className="text-muted-foreground">
                Latest loss: {lastLoss.toFixed(4)}
              </p>
              {lossBreakdown && (
                <ul className="text-xs text-muted-foreground grid gap-1">
                  <li>Task: {formatValue(lossBreakdown.task)}</li>
                  <li>Entropy: {formatValue(lossBreakdown.entropy)}</li>
                  <li>Fluency: {formatValue(lossBreakdown.fluency)}</li>
                  <li>Memory: {formatValue(lossBreakdown.memory)}</li>
                  <li>Redundancy: {formatValue(lossBreakdown.redundancy)}</li>
                  <li>Verifiability: {formatValue(lossBreakdown.verifiability)}</li>
                  <li>Creativity: {formatValue(lossBreakdown.creativity)}</li>
                </ul>
              )}
            </div>
          )}
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
