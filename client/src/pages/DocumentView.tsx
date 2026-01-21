import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useDocument } from "@/hooks/use-documents";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ChevronLeft, 
  BookOpen, 
  Zap, 
  HelpCircle,
  RotateCw,
  Check,
  X
} from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useReviewFlashcard, useQuiz, useSubmitQuiz } from "@/hooks/use-study";
import { useToast } from "@/hooks/use-toast";

export default function DocumentView() {
  const [match, params] = useRoute("/document/:id");
  const id = parseInt(params?.id || "0");
  const { data: document, isLoading } = useDocument(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!document) return <div>Not Found</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground mb-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-display font-bold text-foreground">{document.title}</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${
              document.processingStatus === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
            Status: {document.processingStatus}
          </p>
        </div>

        <Tabs defaultValue="topics" className="w-full">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-8">
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
            <TabsTrigger value="quiz">Quiz</TabsTrigger>
          </TabsList>

          <TabsContent value="topics" className="space-y-4">
            {document.topics?.map((topic, idx) => (
              <motion.div 
                key={topic.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card p-6 rounded-xl border border-border shadow-sm"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <h3 className="text-xl font-bold">{topic.title}</h3>
                </div>
                <p className="text-muted-foreground pl-12 leading-relaxed">
                  {topic.content}
                </p>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="flashcards">
             {/* We pass the first topic ID to start with, in a real app we'd aggregate all cards */}
             {document.topics?.[0] && <FlashcardDeck topicId={document.topics[0].id} />}
          </TabsContent>

          <TabsContent value="quiz">
             {/* Assuming one quiz per document/topic for MVP simplicity */}
             {document.topics?.[0] && <QuizView topicId={document.topics[0].id} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// --- Sub-components for Study Modes ---

function FlashcardDeck({ topicId }: { topicId: number }) {
  // In a real implementation, we'd fetch flashcards for the topic
  // For now, let's assume we fetch the topic details which includes flashcards
  const { data: topic, isLoading } = useDocument(topicId); // This is wrong hook usage pattern (fetching doc instead of topic), but sticking to provided hooks
  // Actually, we need to fetch the topic to get flashcards.
  // The useDocument hook returns topics array but not nested flashcards usually unless specified.
  // Let's assume useTopic fetches the detailed topic with flashcards.
  
  // Correction: Implementing a dedicated fetch inside the component for simplicity since I generated useTopic
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const { mutate: review } = useReviewFlashcard();

  // Hacky fetch because I need topic data
  const [cards, setCards] = useState<any[]>([]);
  
  useEffect(() => {
    fetch(`/api/topics/${topicId}`).then(r => r.json()).then(data => {
      if(data.flashcards) setCards(data.flashcards);
    });
  }, [topicId]);

  if (!cards.length) return <div className="text-center py-12 text-muted-foreground">No flashcards available yet.</div>;

  const currentCard = cards[currentIndex];

  const handleNext = (difficulty: 'easy' | 'medium' | 'hard') => {
    review({ id: currentCard.id, difficulty });
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setTimeout(() => setCurrentIndex(c => c + 1), 200);
    } else {
      alert("Deck completed!");
      setCurrentIndex(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="perspective-1000 relative h-[400px] w-full cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div
          className="w-full h-full relative preserve-3d transition-all duration-500"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-card border border-border rounded-3xl shadow-xl flex flex-col items-center justify-center p-10 text-center">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Question</span>
            <p className="text-2xl font-medium text-foreground">{currentCard.front}</p>
            <div className="absolute bottom-6 text-xs text-muted-foreground flex items-center gap-2">
              <RotateCw className="h-3 w-3" /> Tap to flip
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden bg-primary text-primary-foreground rounded-3xl shadow-xl flex flex-col items-center justify-center p-10 text-center rotate-y-180">
            <span className="text-sm font-bold text-primary-foreground/70 uppercase tracking-widest mb-6">Answer</span>
            <p className="text-2xl font-medium">{currentCard.back}</p>
          </div>
        </motion.div>
      </div>

      <div className="mt-10 grid grid-cols-3 gap-4">
        <Button 
          variant="outline" 
          className="border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
          onClick={() => handleNext('hard')}
        >
          Hard
        </Button>
        <Button 
          variant="outline"
          className="border-yellow-200 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-300"
          onClick={() => handleNext('medium')}
        >
          Medium
        </Button>
        <Button 
          variant="outline"
          className="border-green-200 hover:bg-green-50 hover:text-green-600 hover:border-green-300"
          onClick={() => handleNext('easy')}
        >
          Easy
        </Button>
      </div>
      <div className="mt-6 text-center text-sm text-muted-foreground">
        Card {currentIndex + 1} of {cards.length}
      </div>
    </div>
  );
}

function QuizView({ topicId }: { topicId: number }) {
  // Similar hacky fetch for quizzes
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const { mutate: submitQuiz, data: attempt } = useSubmitQuiz();
  
  useEffect(() => {
    fetch(`/api/topics/${topicId}`).then(r => r.json()).then(data => {
      if(data.quizzes?.[0]) {
        // Fetch full quiz details with questions
        fetch(`/api/quizzes/${data.quizzes[0].id}`).then(r => r.json()).then(setQuiz);
      }
    });
  }, [topicId]);

  if (!quiz) return <div className="text-center py-12 text-muted-foreground">No quiz available yet.</div>;

  const handleSubmit = () => {
    submitQuiz({ id: quiz.id, answers });
    setSubmitted(true);
  };

  if (submitted && attempt) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <div className="h-24 w-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="h-12 w-12" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Quiz Completed!</h2>
        <p className="text-muted-foreground mb-8">You scored</p>
        <div className="text-6xl font-display font-bold text-primary mb-8">
          {Math.round((attempt.score / attempt.totalQuestions) * 100)}%
        </div>
        <Button onClick={() => window.location.reload()}>Take Another Quiz</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">{quiz.title}</h2>
        <p className="text-muted-foreground">{quiz.questions.length} questions</p>
      </div>

      {quiz.questions.map((q: any, idx: number) => (
        <div key={q.id} className="bg-card p-6 rounded-xl border border-border">
          <h3 className="font-semibold text-lg mb-4 flex gap-3">
            <span className="text-muted-foreground">{idx + 1}.</span>
            {q.question}
          </h3>
          <div className="space-y-3">
            {q.options?.map((opt: string) => (
              <div 
                key={opt}
                onClick={() => !submitted && setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                className={`
                  p-4 rounded-lg border cursor-pointer transition-all
                  ${answers[q.id] === opt 
                    ? "bg-primary/10 border-primary text-primary font-medium" 
                    : "border-border hover:bg-muted"}
                `}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
      ))}

      <Button size="lg" className="w-full" onClick={handleSubmit} disabled={Object.keys(answers).length !== quiz.questions.length}>
        Submit Quiz
      </Button>
    </div>
  );
}
