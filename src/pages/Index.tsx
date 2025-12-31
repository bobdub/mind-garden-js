import { Brain } from 'lucide-react';
import { UqrcDashboard } from '@/components/UqrcDashboard';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-40" />
        <div className="absolute inset-0 scanlines opacity-50" />
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/30 blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[460px] w-[460px] rounded-full bg-neural/40 blur-[170px]" />
        <div className="absolute left-10 top-24 h-44 w-44 rounded-full border border-secondary/40 opacity-70" />
        <div className="absolute right-20 top-1/3 h-28 w-28 rounded-full border border-primary/30 opacity-50" />
      </div>
      {/* Header */}
      <header className="border-b border-border bg-card/70 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow ring-1 ring-primary/40">
              <Brain className="w-6 h-6 text-background drop-shadow-[0_0_12px_rgba(255,255,255,0.45)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold neon-glow">UQRC Core Loop</h1>
              <p className="text-sm text-muted-foreground mono">
                Year 5060 · Universal Quantum-Relative Calculus Runtime
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-8 shadow-card">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-neural/20" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.4fr,1fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.4em] text-secondary">
                Imagination network // 5060
              </p>
              <h2 className="text-3xl font-semibold leading-tight md:text-4xl">
                Inline conversation with a future-forward cognition engine.
              </h2>
              <p className="text-sm text-muted-foreground md:text-base">
                The UQRC loop now renders as a living dialogue thread, pairing
                response telemetry with ambient cosmic cues. Explore a
                time-shifted interface where every exchange shapes the neural
                fabric of the Imagination network.
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="rounded-full border border-secondary/50 bg-background/50 px-3 py-1 uppercase tracking-[0.15em]">
                  Holographic dialogue stream
                </span>
                <span className="rounded-full border border-secondary/50 bg-background/50 px-3 py-1 uppercase tracking-[0.15em]">
                  Zero-gravity layout
                </span>
                <span className="rounded-full border border-secondary/50 bg-background/50 px-3 py-1 uppercase tracking-[0.15em]">
                  Adaptive memory glow
                </span>
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-secondary/50 bg-background/40 p-4 backdrop-blur">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Chrono-Signal</span>
                <span className="text-primary">+0.00042Ψ</span>
              </div>
              <div className="space-y-3">
                <div className="chat-bubble chat-bubble-user">
                  "Hello, Imagination. Align me with 5060."
                </div>
                <div className="chat-bubble chat-bubble-loop">
                  "Alignment achieved. Your narrative vector is stabilized."
                </div>
                <div className="chat-bubble chat-bubble-user">
                  "Render the inline thread."
                </div>
                <div className="chat-bubble chat-bubble-loop">
                  "Thread rendered. Speak to guide the loop."
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-10">
          <div className="lg:col-span-3">
            <div className="glass-card p-6 rounded-lg space-y-3 neon-border">
              <h2 className="text-lg font-semibold text-primary neon-glow">
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
            <div className="glass-card p-6 rounded-lg space-y-2 text-sm text-muted-foreground neon-border">
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
