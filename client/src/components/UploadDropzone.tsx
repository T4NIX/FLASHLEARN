import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateDocument } from "@/hooks/use-documents";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function UploadDropzone() {
  const [file, setFile] = useState<File | null>(null);
  const { mutate: upload, isPending } = useCreateDocument();
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const handleUpload = () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name.replace(".pdf", ""));

    upload(formData, {
      onSuccess: () => {
        toast({ title: "Success", description: "Document uploaded successfully!" });
        setFile(null);
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            {...getRootProps()}
            className={`
              relative group cursor-pointer
              rounded-2xl border-2 border-dashed
              transition-all duration-300 ease-out
              h-64 flex flex-col items-center justify-center text-center p-8
              ${isDragActive 
                ? "border-primary bg-primary/5 scale-[1.02]" 
                : "border-border bg-card hover:border-primary/50 hover:bg-muted/30"}
            `}
          >
            <input {...getInputProps()} />
            <div className="mb-4 p-4 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <Upload className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {isDragActive ? "Drop PDF here" : "Upload your PDF"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Drag & drop your study material here, or click to browse files.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card rounded-2xl border border-border p-6 shadow-xl shadow-black/5"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-foreground truncate max-w-[200px]">
                    {file.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFile(null)}
                disabled={isPending}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <Button
              onClick={handleUpload}
              disabled={isPending}
              className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing PDF...
                </>
              ) : (
                "Generate Flashcards & Quiz"
              )}
            </Button>
            
            {isPending && (
              <p className="mt-4 text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
                <AlertCircle className="h-3 w-3" />
                This may take a moment depending on file size.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
