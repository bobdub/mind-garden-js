import { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import { SelfLearningLLM } from '@/lib/neural/SelfLearningLLM';
import { ChatInterface } from '@/components/ChatInterface';
import { TrainingPanel } from '@/components/TrainingPanel';
import { MemoryViewer } from '@/components/MemoryViewer';
import { NeuralVisualizer } from '@/components/NeuralVisualizer';
import { LearningGoalsPanel } from '@/components/LearningGoalsPanel';

const Index = () => {
  const [llm] = useState(() => new SelfLearningLLM());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTrained = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Brain className="w-6 h-6 text-background" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Self-Learning LLM</h1>
              <p className="text-sm text-muted-foreground mono">
                v0.1.1 | JavaScript Neural Network
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chat Interface */}
          <div className="lg:col-span-2">
            <ChatInterface llm={llm} />
          </div>

          {/* Right Column - Controls & Stats */}
          <div className="space-y-6">
            <TrainingPanel llm={llm} onTrained={handleTrained} />
            <LearningGoalsPanel />
            <MemoryViewer llm={llm} refreshTrigger={refreshTrigger} />
            <NeuralVisualizer />
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="glass-card p-6 rounded-lg">
            <h3 className="font-semibold mb-2 text-primary">🧠 Neural Learning</h3>
            <p className="text-sm text-muted-foreground">
              Uses a 3-layer feedforward network with backpropagation to learn patterns from your training data.
            </p>
          </div>
          <div className="glass-card p-6 rounded-lg">
            <h3 className="font-semibold mb-2 text-success">💾 Persistent Memory</h3>
            <p className="text-sm text-muted-foreground">
              All training is saved to localStorage, so your model remembers across sessions.
            </p>
          </div>
          <div className="glass-card p-6 rounded-lg">
            <h3 className="font-semibold mb-2 text-warning">🏷️ Semantic Tagging</h3>
            <p className="text-sm text-muted-foreground">
              Automatically extracts tags and intent from text to improve response matching.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground mono">
            |Ψ_Principle⟩ = "Bridge imagination with functional structure."
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
