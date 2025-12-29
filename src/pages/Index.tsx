import { useEffect } from 'react';
import { Brain } from 'lucide-react';
import { UqrcDashboard } from '@/components/UqrcDashboard';
import { UqrcConsole } from '@/components/UqrcConsole';

const Index = () => {
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
              <h1 className="text-xl font-bold">UQRC Core Loop</h1>
              <p className="text-sm text-muted-foreground mono">
                v0.2.0 | Universal Quantum-Relative Calculus Runtime
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <div className="glass-card p-6 rounded-lg space-y-3">
              <h2 className="text-lg font-semibold text-primary">
                Imagination Engine
              </h2>
              <p className="text-sm text-muted-foreground">
                The UQRC runtime encodes input into a latent state, applies
                diffusion, curvature, coercive regulation, and discrete stepping
                operators, and returns an emergent response. Memory is persisted
                locally to capture learning with and from the user.
              </p>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="glass-card p-6 rounded-lg space-y-2 text-sm text-muted-foreground">
              <p>
                u(t+1) = u(t) + 𝒪<sub>UQRC</sub>(u(t)) + Σ 𝒟<sub>μ</sub>u(t)
              </p>
              <p>𝒪<sub>UQRC</sub>(u) := νΔu + ℛu + L<sub>S</sub>u</p>
              <p>𝒟<sub>μ</sub>u(x) := (u(x + ℓ<sub>min</sub>e<sub>μ</sub>) - u(x)) / ℓ<sub>min</sub></p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <UqrcDashboard />
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
