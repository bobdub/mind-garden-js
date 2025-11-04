import { Card } from '@/components/ui/card';
import { Network, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

export const NeuralVisualizer = () => {
  const [pulseIndex, setPulseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIndex(prev => (prev + 1) % 3);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const layers = [
    { name: 'Input', nodes: 32 },
    { name: 'Hidden 1', nodes: 16 },
    { name: 'Hidden 2', nodes: 16 },
    { name: 'Output', nodes: 32 },
  ];

  return (
    <Card className="p-6 bg-card shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-5 h-5 text-success" />
        <h2 className="text-lg font-semibold">Neural Architecture</h2>
      </div>

      <div className="flex justify-between items-center h-64 px-4">
        {layers.map((layer, layerIndex) => (
          <div key={layerIndex} className="flex flex-col items-center gap-2">
            <div className="text-xs text-muted-foreground mono mb-2">
              {layer.name}
            </div>
            <div className="flex flex-col gap-1">
              {Array(Math.min(layer.nodes, 8))
                .fill(0)
                .map((_, nodeIndex) => (
                  <div
                    key={nodeIndex}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      layerIndex === pulseIndex
                        ? 'bg-primary shadow-glow'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              {layer.nodes > 8 && (
                <div className="text-xs text-muted-foreground mono">
                  +{layer.nodes - 8}
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground mono">
              {layer.nodes}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 glass-card p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Network Status</span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Architecture:</span>
            <span className="mono text-foreground">32→16→16→32</span>
          </div>
          <div className="flex justify-between">
            <span>Activation:</span>
            <span className="mono text-foreground">Sigmoid</span>
          </div>
          <div className="flex justify-between">
            <span>Learning:</span>
            <span className="mono text-success">Active</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
