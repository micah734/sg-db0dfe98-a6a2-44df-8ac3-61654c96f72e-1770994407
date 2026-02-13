import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Mic, Sparkles, Split, FileText, Video } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push("/dashboard");
    } else {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="animate-pulse text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Synapse Notes - AI-Powered Academic Productivity"
        description="Annotate documents, link media, and harness AI intelligence for your research and study projects"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">Synapse Notes</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-slate-700">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-indigo-600 hover:bg-indigo-700">Get Started</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            AI-Powered Academic Productivity
          </div>
          <h1 className="text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Notes that think<br />with you
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Annotate documents, link media timestamps, and let AI help you understand your research. 
            Built for students, researchers, and anyone who thinks deeply.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6">
                Start for Free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FileText className="w-6 h-6" />}
              title="Smart Annotations"
              description="Highlight, draw, and annotate PDFs and documents with a full toolkit designed for academic work."
              gradient="from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={<Video className="w-6 h-6" />}
              title="Media Linking"
              description="Link annotations to exact timestamps in your lecture recordings. Click to jump instantly."
              gradient="from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="AI Intelligence"
              description="Auto-transcribe media, generate summaries, and ask questions about your entire project."
              gradient="from-orange-500 to-red-500"
            />
            <FeatureCard
              icon={<Split className="w-6 h-6" />}
              title="Split View"
              description="View two documents side-by-side. Perfect for comparing sources or referencing while you write."
              gradient="from-green-500 to-emerald-500"
            />
            <FeatureCard
              icon={<Mic className="w-6 h-6" />}
              title="Auto Transcription"
              description="Upload audio or video and get searchable transcripts automatically via Whisper AI."
              gradient="from-indigo-500 to-blue-500"
            />
            <FeatureCard
              icon={<BookOpen className="w-6 h-6" />}
              title="Project Organization"
              description="Organize documents, media, and notes into projects and folders that make sense to you."
              gradient="from-violet-500 to-purple-500"
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-3xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Ready to enhance your learning?</h2>
            <p className="text-xl text-indigo-100 mb-8">
              Join students and researchers using AI to understand their work better.
            </p>
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-100 text-lg px-8 py-6">
                Get Started Free
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-8 text-center text-slate-600">
            <p>© 2026 Synapse Notes. Built for deep thinkers.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

function FeatureCard({ icon, title, description, gradient }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-slate-300 transition-colors">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-6`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}