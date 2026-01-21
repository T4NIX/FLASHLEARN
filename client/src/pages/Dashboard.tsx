import { useAuth } from "@/hooks/use-auth";
import { useDocuments } from "@/hooks/use-documents";
import { useAnalytics } from "@/hooks/use-study";
import { UploadDropzone } from "@/components/UploadDropzone";
import { Navigation } from "@/components/Navigation";
import { Link } from "wouter";
import { 
  FileText, 
  ArrowRight, 
  Clock, 
  BookOpen, 
  Trophy,
  Loader2,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeleteDocument } from "@/hooks/use-documents";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: documents, isLoading: docsLoading } = useDocuments();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const { mutate: deleteDoc } = useDeleteDocument();

  if (docsLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Upload & Documents */}
          <div className="lg:col-span-2 space-y-10">
            {/* Welcome Section */}
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                Welcome back, {user?.firstName}
              </h1>
              <p className="text-muted-foreground">
                Ready to turn some documents into knowledge?
              </p>
            </div>

            {/* Upload Section */}
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl p-1 border border-primary/10">
              <div className="bg-card/50 backdrop-blur-sm rounded-[1.3rem] p-8">
                <UploadDropzone />
              </div>
            </div>

            {/* Recent Documents */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Your Library
                </h2>
                <Link href="/documents">
                  <Button variant="ghost" className="text-primary hover:text-primary/80">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {documents && documents.length > 0 ? (
                <div className="grid gap-4">
                  {documents.slice(0, 3).map((doc: any) => (
                    <div 
                      key={doc.id}
                      className="group bg-card rounded-xl p-4 border border-border shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                    >
                      <Link href={`/document/${doc.id}`} className="flex-1 flex items-center gap-4 cursor-pointer">
                        <div className="h-12 w-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {doc.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(doc.createdAt), "MMM d, yyyy")}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                              {doc.processingStatus}
                            </span>
                          </div>
                        </div>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm("Delete this document?")) deleteDoc(doc.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
                  <p className="text-muted-foreground">No documents yet. Upload one above!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Analytics */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Progress Stats
              </h3>
              
              <div className="space-y-6">
                <StatItem 
                  label="Documents Processed"
                  value={analytics?.totalDocuments || 0}
                  color="bg-blue-500"
                />
                <StatItem 
                  label="Flashcards Reviewed"
                  value={analytics?.totalFlashcardsReviewed || 0}
                  color="bg-purple-500"
                />
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Avg. Quiz Score</span>
                    <span className="text-2xl font-bold text-foreground">{analytics?.averageQuizScore || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${analytics?.averageQuizScore || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-b from-primary to-primary/80 rounded-2xl p-6 text-white shadow-lg shadow-primary/20">
              <h3 className="font-bold text-lg mb-2">Pro Tip 💡</h3>
              <p className="text-white/90 text-sm leading-relaxed">
                Reviewing flashcards within 24 hours of reading a new document increases retention by up to 60%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
}
