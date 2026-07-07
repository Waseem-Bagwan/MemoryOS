import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Brain, Zap, GitBranch, Eye, Shield, Clock,
  CheckCircle2, RefreshCw, GitMerge, MinusCircle, XCircle,
  ArrowRight, Cpu, Database, Server,
  Star, BarChart3, Layers, MessageSquare,
} from "lucide-react";

// Github icon as SVG since lucide-react version doesn't export it
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return { count, ref };
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// â”€â”€â”€ Navbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-white">MemoryOS</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "Architecture", "Tech Stack"].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`}
              className="text-sm text-muted hover:text-white transition-colors">
              {item}
            </a>
          ))}
          <a href="https://github.com/Waseem-Bagwan/MemoryOS" target="_blank" rel="noreferrer"
            className="text-sm text-muted hover:text-white transition-colors flex items-center gap-1.5">
            <GithubIcon className="w-3.5 h-3.5" /> GitHub
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-muted hover:text-white transition-colors">
            Sign In
          </Link>
          <Link to="/login"
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-all shadow-glow-sm">
            Launch App
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

// â”€â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FLOATING_CARDS = [
  { action: "STORE",  content: "User is a TypeScript developer",  color: "text-success",   bg: "bg-success/10 border-success/20",   x: -500, y: -100  },
  { action: "UPDATE", content: "User lives in Bangalore",          color: "text-secondary", bg: "bg-secondary/10 border-secondary/20", x: 280,  y: -150  },
  { action: "IGNORE", content: "ok thanks",                        color: "text-muted",     bg: "bg-zinc-800/60 border-zinc-700/40",  x: -380, y: 190  },
  { action: "MERGE",  content: "User prefers backend development",  color: "text-primary",   bg: "bg-primary/10 border-primary/20",   x: 300,  y: 100  },
];

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/6 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[300px] bg-secondary/4 rounded-full blur-3xl" />
      </div>

      {/* Floating memory cards */}
      {FLOATING_CARDS.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.7, scale: 1, y: [0, -8, 0] }}
          transition={{
            opacity: { duration: 0.6, delay: 0.8 + i * 0.15 },
            scale:   { duration: 0.6, delay: 0.8 + i * 0.15 },
            y:       { duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 },
          }}
          style={{ position: "absolute", left: `calc(50% + ${card.x}px)`, top: `calc(50% + ${card.y}px)` }}
          className={`hidden lg:flex items-center gap-2.5 px-3.5 py-2 rounded-xl border backdrop-blur-sm text-xs font-medium ${card.bg}`}
        >
          <span className={`font-mono font-bold ${card.color}`}>{card.action}</span>
          <span className="text-zinc-400">{card.content}</span>
        </motion.div>
      ))}

      {/* Hero content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          🏆 Built for Cognee Cloud Hackathon 2026
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-white leading-[1.1] tracking-tight mb-6"
        >
          Give AI a Memory
          <br />
          <span className="text-gradient">That Thinks.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg text-muted max-w-2xl mx-auto leading-relaxed mb-4"
        >
          MemoryOS is an intelligent memory operating system that decides what AI should
          remember, update, merge, ignore, or forget automatically.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center justify-center gap-4"
        >
          <Link to="/login"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium transition-all shadow-glow text-sm">
            Launch MemoryOS <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="https://github.com/Waseem-Bagwan/MemoryOS" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium border border-border transition-all text-sm">
            <GithubIcon className="w-4 h-4" /> GitHub
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-20 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border border-zinc-700 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-zinc-600" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// â”€â”€â”€ Problem Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PROBLEMS = [
  {
    icon: MessageSquare, title: "Traditional Chatbots",
    items: ["Forget everything on session end", "No memory across conversations", "User repeats themselves every time"],
  },
  {
    icon: Database, title: "RAG Only",
    items: ["Retrieves docs but can't manage memory", "No conflict resolution", "No lifecycle management"],
  },
  {
    icon: Layers, title: "Store Everything",
    items: ["Creates noisy duplicate memories", "No importance scoring", "Context window explosion"],
  },
];

function ProblemSection() {
  return (
    <section className="py-32 px-6 max-w-7xl mx-auto">
      <FadeIn className="text-center mb-16">
        <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-4">The Problem</p>
        <h2 className="text-4xl font-semibold text-white mb-4">Every approach has a fatal flaw.</h2>
        <p className="text-muted max-w-xl mx-auto">Existing solutions either forget everything or remember too much. Neither approach is intelligent.</p>
      </FadeIn>

      <div className="grid md:grid-cols-3 gap-5 mb-12">
        {PROBLEMS.map((p, i) => (
          <FadeIn key={p.title} delay={i * 0.1}>
            <div className="bg-surface border border-border rounded-2xl p-6 h-full">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center">
                  <p.icon className="w-4 h-4 text-danger" />
                </div>
                <div>
                  <p className="text-xs text-danger font-medium">âŒ Problem</p>
                  <p className="text-sm font-semibold text-white">{p.title}</p>
                </div>
              </div>
              <ul className="space-y-2">
                {p.items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted">
                    <XCircle className="w-3.5 h-3.5 text-danger/60 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
            </ul>
            </div>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={0.3}>
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <p className="text-white font-semibold text-lg">MemoryOS solves all three.</p>
          </div>
          <p className="text-muted text-sm max-w-lg mx-auto">
            By adding an intelligent decision layer between your agent and its memory backend,
            MemoryOS ensures only meaningful, conflict-free, properly classified memories are stored.
          </p>
        </div>
      </FadeIn>
    </section>
  );
}

// â”€â”€â”€ Pipeline Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PIPELINE_STEPS = [
  { label: "User Message",      icon: MessageSquare, color: "text-white",      bg: "bg-zinc-800",        desc: "Raw text input from the user"            },
  { label: "Decision Engine",   icon: Brain,         color: "text-primary",    bg: "bg-primary/15",      desc: "GPT-4o-mini classifies and decides"       },
  { label: "STORE / UPDATE / MERGE / IGNORE / FORGET", icon: GitBranch, color: "text-secondary", bg: "bg-secondary/15", desc: "One of five intelligent actions taken" },
  { label: "Cognee Cloud",      icon: Database,      color: "text-purple-400", bg: "bg-purple-500/15",   desc: "Graph + vector memory updated"            },
  { label: "Persistent Memory", icon: Shield,        color: "text-success",    bg: "bg-success/15",      desc: "Clean, distilled facts stored forever"    },
  { label: "AI Response",       icon: Zap,           color: "text-warning",    bg: "bg-warning/15",      desc: "Agent replies with full memory context"   },
];

function PipelineSection() {
  return (
    <section className="py-32 px-6 bg-surface/30" id="features">
      <div className="max-w-4xl mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-4">How It Works</p>
          <h2 className="text-4xl font-semibold text-white mb-4">The Memory Decision Pipeline</h2>
          <p className="text-muted max-w-xl mx-auto">Every message passes through an intelligent pipeline before anything is stored.</p>
        </FadeIn>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-[27px] top-8 bottom-8 w-px bg-gradient-to-b from-primary/40 via-secondary/40 to-success/40 hidden md:block" />

          <div className="space-y-4">
            {PIPELINE_STEPS.map((step, i) => (
              <FadeIn key={step.label} delay={i * 0.08}>
                <div className="flex items-start gap-5 group">
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${step.bg} border-current/20`}>
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <div className="flex-1 bg-surface border border-border rounded-2xl px-5 py-4 group-hover:border-zinc-600 transition-colors">
                    <p className="text-sm font-semibold text-white mb-1 font-mono">{step.label}</p>
                    <p className="text-xs text-muted">{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// â”€â”€â”€ Features Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FEATURES = [
  { icon: Brain,        title: "Explainable Decisions",   desc: "Every memory operation returns action, reasoning, confidence, and pipeline timing."              },
  { icon: GitBranch,    title: "Conflict Resolution",     desc: "Automatically detects when new information contradicts existing memories and resolves it."        },
  { icon: RefreshCw,    title: "Memory Lifecycle",        desc: "Memories progress through: active â†’ archived â†’ forgotten with full audit trail."                  },
  { icon: Layers,       title: "Importance Scoring",      desc: "Every memory receives a 0â€“1 importance score based on recency, novelty, and relevance."           },
  { icon: Eye,          title: "Memory Distillation",     desc: "Raw messages are distilled into clean third-person facts before storage."                         },
  { icon: Clock,        title: "Decision Timeline",       desc: "Git-style history of every memory decision with full pipeline trace on click."                    },
  { icon: BarChart3,    title: "Agent Context Builder",   desc: "Automatically assembles the right memories into LLM context â€” no manual retrieval logic."         },
  { icon: GitMerge,     title: "Memory Consolidation",    desc: "Similar memories are merged and strengthened rather than duplicated."                             },
  { icon: Star,         title: "Interactive Graph",       desc: "Visualize the AI's memory as an interactive graph grouped by Profile, Preferences, Knowledge."   },
];

function FeaturesSection() {
  return (
    <section className="py-32 px-6 max-w-7xl mx-auto">
      <FadeIn className="text-center mb-16">
        <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-4">Features</p>
        <h2 className="text-4xl font-semibold text-white mb-4">Everything memory needs to think.</h2>
        <p className="text-muted max-w-xl mx-auto">MemoryOS handles the full lifecycle of AI memory so developers don't have to.</p>
      </FadeIn>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f, i) => (
          <FadeIn key={f.title} delay={i * 0.05}>
            <div className="bg-surface border border-border rounded-2xl p-5 hover:border-zinc-600 transition-all group h-full">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm font-semibold text-white mb-2">{f.title}</p>
              <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// â”€â”€â”€ Architecture Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ARCH = [
  { label: "React + Vite",    icon: Cpu,          color: "text-cyan-400",    desc: "Frontend UI"             },
  { label: "Express",         icon: Server,       color: "text-green-400",   desc: "REST API"                },
  { label: "Decision Engine", icon: Brain,        color: "text-primary",     desc: "GPT-4o-mini pipeline"    },
  { label: "Cognee Cloud",    icon: Database,     color: "text-purple-400",  desc: "Graph + vector memory"   },
  { label: "Redis",           icon: Zap,          color: "text-red-400",     desc: "Hot session cache"       },
  { label: "PostgreSQL",      icon: Layers,       color: "text-blue-400",    desc: "Metadata + audit trail"  },
  { label: "OpenAI",          icon: MessageSquare,color: "text-emerald-400", desc: "Language model"          },
  { label: "Prisma",          icon: GitBranch,    color: "text-indigo-400",  desc: "Type-safe ORM"           },
];

function ArchitectureSection() {
  return (
    <section className="py-32 px-6 bg-surface/30" id="architecture">
      <div className="max-w-7xl mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-4">Architecture</p>
          <h2 className="text-4xl font-semibold text-white mb-4">Built on proven infrastructure.</h2>
          <p className="text-muted max-w-xl mx-auto">Every layer is purpose-built for intelligent memory management.</p>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ARCH.map((a, i) => (
            <FadeIn key={a.label} delay={i * 0.06}>
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-surface border border-border rounded-2xl p-5 cursor-default"
              >
                <div className={`w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4`}>
                  <a.icon className={`w-5 h-5 ${a.color}`} />
                </div>
                <p className="text-sm font-semibold text-white font-mono mb-1">{a.label}</p>
                <p className="text-xs text-muted">{a.desc}</p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// â”€â”€â”€ Stats Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STATS = [
  { label: "Memory Actions",    target: 5,    suffix: "",  desc: "STORE Â· UPDATE Â· MERGE Â· IGNORE Â· FORGET" },
  { label: "Memory Types",      target: 4,    suffix: "",  desc: "Profile Â· Preference Â· Knowledge Â· Experience" },
  { label: "Avg Latency",       target: 4,    suffix: "s", desc: "End-to-end decision + storage" },
  { label: "Pipeline Stages",   target: 6,    suffix: "",  desc: "Classify â†’ Score â†’ Detect â†’ Decide â†’ Execute â†’ Log" },
];

function StatsSection() {
  return (
    <section className="py-32 px-6 max-w-7xl mx-auto">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((s, i) => {
          const { count, ref } = useCounter(s.target);
          return (
            <FadeIn key={s.label} delay={i * 0.1}>
              <div ref={ref} className="text-center">
                <p className="text-5xl font-bold text-white font-mono mb-2">
                  {count}{s.suffix}
                </p>
                <p className="text-sm font-semibold text-white mb-1">{s.label}</p>
                <p className="text-xs text-muted">{s.desc}</p>
              </div>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}

// â”€â”€â”€ Decision showcase â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DECISIONS = [
  { action: "STORE" as const,  input: "I am a TypeScript developer",           distilled: "User is a TypeScript developer",   icon: CheckCircle2, color: "text-success",   bg: "bg-success/10 border-success/20"    },
  { action: "UPDATE" as const, input: "I moved to Bangalore last month",        distilled: "User lives in Bangalore",           icon: RefreshCw,    color: "text-secondary", bg: "bg-secondary/10 border-secondary/20" },
  { action: "MERGE" as const,  input: "I mostly build backend systems",         distilled: "User prefers backend development",  icon: GitMerge,     color: "text-primary",   bg: "bg-primary/10 border-primary/20"    },
  { action: "IGNORE" as const, input: "ok thanks!",                             distilled: "",                                  icon: MinusCircle,  color: "text-muted",     bg: "bg-zinc-800/50 border-zinc-700/40"  },
];

function DecisionShowcase() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % DECISIONS.length), 2500);
    return () => clearInterval(t);
  }, []);

  const d = DECISIONS[active];
  const Icon = d.icon;

  return (
    <section className="py-32 px-6 bg-surface/30">
      <div className="max-w-4xl mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-4">Live Demo Preview</p>
          <h2 className="text-4xl font-semibold text-white mb-4">Watch the engine decide.</h2>
          <p className="text-muted max-w-xl mx-auto">Every user message triggers a real-time memory decision with full reasoning.</p>
        </FadeIn>

        <FadeIn>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            {/* Mock chat header */}
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-white font-medium">AI Agent</span>
              <span className="text-xs text-muted ml-auto font-mono">session-demo-001</span>
            </div>

            <div className="grid md:grid-cols-2 gap-0">
              {/* Left: chat */}
              <div className="p-6 border-r border-border">
                <p className="text-xs text-muted font-medium mb-4">User message</p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-primary/10 border border-primary/20 rounded-xl rounded-tr-sm px-4 py-3 mb-4"
                  >
                    <p className="text-sm text-white">"{d.input}"</p>
                  </motion.div>
                </AnimatePresence>
                <div className="flex gap-1.5 mt-8">
                  {DECISIONS.map((_, i) => (
                    <button key={i} onClick={() => setActive(i)}
                      className={`h-1 rounded-full transition-all ${i === active ? "w-6 bg-primary" : "w-3 bg-zinc-700"}`}
                    />
                  ))}
                </div>
              </div>

              {/* Right: decision */}
              <div className="p-6">
                <p className="text-xs text-muted font-medium mb-4">Memory Engine decision</p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="space-y-3"
                  >
                    <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border ${d.bg}`}>
                      <Icon className={`w-4 h-4 ${d.color}`} />
                      <span className={`text-sm font-bold font-mono ${d.color}`}>{d.action}</span>
                    </div>
                    {d.distilled && (
                      <div className="bg-zinc-800/60 rounded-xl p-3 border border-zinc-700/50">
                        <p className="text-xs text-muted mb-1">Stored as</p>
                        <p className="text-sm text-white font-medium">"{d.distilled}"</p>
                      </div>
                    )}
                    {!d.distilled && (
                      <div className="bg-zinc-800/40 rounded-xl p-3">
                        <p className="text-xs text-muted">Conversational filler â€” not worth storing.</p>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted pt-1">
                      <span>importance: {d.action === "IGNORE" ? "0.0" : "0.8"}</span>
                      <span>confidence: {d.action === "IGNORE" ? "0.95" : "0.92"}</span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// â”€â”€â”€ CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CTA() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <FadeIn>
          <div className="bg-surface border border-border rounded-3xl p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-8">
                <Brain className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-4xl font-semibold text-white mb-4">
                Ready to build AI that
                <br />actually remembers?
              </h2>
              <p className="text-muted mb-10 max-w-lg mx-auto">
                Stop writing memory rules. Let MemoryOS handle every decision automatically â€” with full transparency.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link to="/login"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium transition-all shadow-glow text-sm">
                  Launch MemoryOS <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="https://github.com/Waseem-Bagwan/MemoryOS" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium border border-border transition-all text-sm">
                  <GithubIcon className="w-4 h-4" /> GitHub
                </a>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// â”€â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Footer() {
  return (
    <footer className="border-t border-border py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-white">MemoryOS</span>
        </div>
        <p className="text-xs text-muted text-center">
          Built for <span className="text-white">WeMakeDevs Ã— Cognee Hackathon 2026</span> Â· Made by <span className="text-white">Waseem Bagwan</span>
        </p>
        <div className="flex items-center gap-5">
          <a href="https://github.com/Waseem-Bagwan/MemoryOS" target="_blank" rel="noreferrer"
            className="text-xs text-muted hover:text-white transition-colors flex items-center gap-1.5">
            <GithubIcon className="w-3.5 h-3.5" /> GitHub
          </a>
          <Link to="/login" className="text-xs text-muted hover:text-white transition-colors">Sign In</Link>
        </div>
      </div>
    </footer>
  );
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Landing() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Reading progress bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-0.5 bg-primary z-[60] origin-left"
      />
      <Navbar />
      <Hero />
      <ProblemSection />
      <PipelineSection />
      <DecisionShowcase />
      <FeaturesSection />
      <ArchitectureSection />
      <StatsSection />
      <CTA />
      <Footer />
    </div>
  );
}

