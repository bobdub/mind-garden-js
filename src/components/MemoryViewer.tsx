import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Trash2, RefreshCw } from 'lucide-react';
import { SelfLearningLLM } from '@/lib/neural/SelfLearningLLM';
import { toast } from 'sonner';

interface MemoryViewerProps {
  llm: SelfLearningLLM;
  refreshTrigger: number;
}

export const MemoryViewer = ({ llm, refreshTrigger }: MemoryViewerProps) => {
  const [stats, setStats] = useState(llm.getStats());

  useEffect(() => {
    setStats(llm.getStats());
  }, [refreshTrigger, llm]);

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all memories? This cannot be undone.')) {
      llm.clearMemory();
      setStats(llm.getStats());
      toast.success('Memory cleared successfully');
    }
  };

  const handleRefresh = () => {
    setStats(llm.getStats());
    toast.success('Memory refreshed');
  };

  return (
    <Card className="p-6 bg-card shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-neural" />
          <h2 className="text-lg font-semibold">Memory Dashboard</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className="h-8 w-8"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleClear}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-4 rounded-lg">
          <div className="text-2xl font-bold text-primary mono">
            {stats.totalMemories}
          </div>
          <div className="text-sm text-muted-foreground">Training Entries</div>
        </div>
        <div className="glass-card p-4 rounded-lg">
          <div className="text-2xl font-bold text-neural mono">
            {stats.vocabularySize}
          </div>
          <div className="text-sm text-muted-foreground">Vocabulary Size</div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
          Recent Training
        </h3>
        <div className="space-y-2">
          {stats.recentMemories.length === 0 ? (
            <div className="glass-card p-4 rounded-lg text-center text-muted-foreground text-sm">
              No training data yet. Start by training the model!
            </div>
          ) : (
            stats.recentMemories.map((memory, index) => (
              <div
                key={index}
                className="glass-card p-3 rounded-lg space-y-2 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-sm text-foreground mb-1">
                      <span className="text-primary">Q:</span> {memory.prompt}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="text-success">A:</span> {memory.response}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {memory.tags.slice(0, 4).map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs bg-secondary rounded-full mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};
