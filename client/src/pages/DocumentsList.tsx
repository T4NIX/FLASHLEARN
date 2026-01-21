import { useDocuments } from "@/hooks/use-documents";
import { Navigation } from "@/components/Navigation";
import { Link } from "wouter";
import { FileText, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function DocumentsList() {
  const { data: documents, isLoading } = useDocuments();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold">My Library</h1>
          <Link href="/dashboard">
            <Button>Upload New</Button>
          </Link>
        </div>

        <div className="grid gap-4">
          {documents?.map((doc: any) => (
            <Link key={doc.id} href={`/document/${doc.id}`}>
              <div className="bg-card p-6 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer group flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <span>{format(new Date(doc.createdAt), "MMMM d, yyyy")}</span>
                      <span>•</span>
                      <span className="capitalize">{doc.processingStatus}</span>
                      <span>•</span>
                      <span>{doc.pageCount || 0} pages</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
          
          {documents?.length === 0 && (
            <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border">
              <p className="text-muted-foreground">No documents found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
