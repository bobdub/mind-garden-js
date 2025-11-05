import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { BookOpen, Zap } from 'lucide-react';
import { SelfLearningLLM } from '@/lib/neural/SelfLearningLLM';
import { AnalyticsTracker } from '@/lib/analytics/AnalyticsTracker';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';

interface TrainingPanelProps {
  llm: SelfLearningLLM;
  onTrained: () => void;
}

export const TrainingPanel = ({ llm, onTrained }: TrainingPanelProps) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [threshold, setThreshold] = useState(() => llm.getTagSimilarityThreshold());

  const handleThresholdChange = useCallback((value: number[]) => {
    const next = value[0] ?? SelfLearningLLM.DEFAULT_TAG_SIMILARITY_THRESHOLD;
    setThreshold(next);
    llm.setTagSimilarityThreshold(next);
  }, [llm]);

  const handleTrain = async () => {
    const trimmedPrompt = prompt.trim();
    const trimmedResponse = response.trim();

    if (!trimmedPrompt || !trimmedResponse) {
      toast.error('Please provide both prompt and response');
      return;
    }

    setIsTraining(true);

    // Simulate training time
    await new Promise(resolve => setTimeout(resolve, 800));

    llm.learnFrom(trimmedPrompt, trimmedResponse);

    const tags = llm.tag(trimmedPrompt);
    const promptWords = trimmedPrompt ? trimmedPrompt.split(/\s+/).filter(Boolean).length : 0;
    const responseWords = trimmedResponse ? trimmedResponse.split(/\s+/).filter(Boolean).length : 0;

    AnalyticsTracker.trackLessonCompleted({
      promptLength: trimmedPrompt.length,
      responseLength: trimmedResponse.length,
      promptWordCount: promptWords,
      responseWordCount: responseWords,
      tagCount: tags.length
    });

    toast.success('Training completed! The model learned this pattern.', {
      description: `Prompt: "${trimmedPrompt.substring(0, 30)}..."`,
    });

    setPrompt('');
    setResponse('');
    setIsTraining(false);
    onTrained();
  };

  return (
    <Card className="p-6 bg-card shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-warning" />
        <h2 className="text-lg font-semibold">Training Mode</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            When user says:
          </label>
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., What's your name?"
            className="bg-input"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            Tag similarity threshold: <span className="font-medium text-foreground">{threshold.toFixed(2)}</span>
          </label>
          <Slider
            value={[threshold]}
            onValueChange={handleThresholdChange}
            min={0}
            max={1}
            step={0.05}
            className="pt-2"
            aria-label="Tag similarity threshold"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Lower values let the model reuse responses from loosely related prompts, while higher values restrict replay to very close matches.
          </p>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            Respond with:
          </label>
          <Input
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="e.g., I'm a JavaScript LLM!"
            className="bg-input"
          />
        </div>

        <Button
          onClick={handleTrain}
          disabled={isTraining || !prompt.trim() || !response.trim()}
          className="w-full shadow-glow"
        >
          {isTraining ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              Training...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Train Model
            </>
          )}
        </Button>
      </div>

      <div className="mt-6 p-4 glass-card rounded-lg">
        <p className="text-xs text-muted-foreground">
          <strong>Tip:</strong> Threshold tuning adjusts how closely new prompts must match saved tags before a learned response is reused.
          Lower the slider to encourage broader retrieval; raise it to fall back to fresh replies when prompts differ.
        </p>
      </div>
    </Card>
  );
};
