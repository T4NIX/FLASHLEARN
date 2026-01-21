import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { GraduationCap, Upload, Zap, BarChart3, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold">FlashLearn</span>
          </div>
          <Link href="/api/login">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-accent/20 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 text-center">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={item} className="mb-6 flex justify-center">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                🚀 AI-Powered Learning Assistant
              </span>
            </motion.div>
            
            <motion.h1 variants={item} className="text-5xl md:text-7xl font-display font-bold leading-[1.1] mb-6 tracking-tight">
              Turn your PDFs into <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Superpowers
              </span>
            </motion.h1>

            <motion.p variants={item} className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload any document and instantly get summaries, flashcards, and quizzes. 
              Master any subject with personalized AI tutoring.
            </motion.p>

            <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/api/login">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1">
                  Start Learning for Free
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-secondary/30 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Upload className="h-8 w-8 text-blue-500" />}
              title="Instant Processing"
              description="Drag and drop your PDFs. Our AI analyzes content and structures it into digestible topics in seconds."
              delay={0}
            />
            <FeatureCard 
              icon={<Zap className="h-8 w-8 text-yellow-500" />}
              title="Smart Flashcards"
              description="Adaptive spaced repetition ensures you focus on what you need to learn, maximizing retention."
              delay={0.1}
            />
            <FeatureCard 
              icon={<BarChart3 className="h-8 w-8 text-green-500" />}
              title="Track Progress"
              description="Visualize your mastery with detailed analytics. See your quiz scores and study streaks grow."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 FlashLearn. Built with Replit.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="bg-card p-8 rounded-2xl border border-border hover:border-primary/50 transition-colors shadow-sm"
    >
      <div className="mb-6 p-4 rounded-xl bg-background border border-border w-fit shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
