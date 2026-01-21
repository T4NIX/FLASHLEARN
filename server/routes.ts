import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerAuthRoutes, setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerAudioRoutes } from "./replit_integrations/audio";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register Integrations
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);
  registerImageRoutes(app);
  registerAudioRoutes(app);

  // Application Routes

  // Documents
  app.get(api.documents.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    let docs = await storage.getUserDocuments(userId);

    if (docs.length === 0) {
      await seedUser(userId);
      docs = await storage.getUserDocuments(userId);
    }
    
    res.json(docs);
  });

  app.post(api.documents.create.path, isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      
      // Simulate file upload logic (in a real app, upload to storage bucket)
      const fileUrl = `/uploads/${req.file.originalname}`; 

      const doc = await storage.createDocument({
        userId,
        title: req.body.title || req.file.originalname,
        filename: req.file.originalname,
        fileUrl: fileUrl,
      });

      // Simulate async processing (OCR, etc.)
      // In a real app, this would be a background job
      setTimeout(async () => {
        try {
          await storage.updateDocumentStatus(doc.id, "processing");
          
          // Simulate extraction & AI generation
          // 1. Create Topics
          const topic1 = await storage.createTopic({
            documentId: doc.id,
            title: "Introduction",
            content: "Simulated content extraction...",
            order: 1
          });

          // 2. Create Flashcards
          await storage.createFlashcard({
            topicId: topic1.id,
            front: "What is this document?",
            back: "A simulated upload.",
            difficulty: "easy"
          });

          await storage.updateDocumentStatus(doc.id, "completed", 5);
        } catch (e) {
          await storage.updateDocumentStatus(doc.id, "failed");
        }
      }, 2000);

      res.status(201).json(doc);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.get(api.documents.get.path, isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const doc = await storage.getDocument(id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    
    const topics = await storage.getTopics(id);
    res.json({ ...doc, topics });
  });

  app.delete(api.documents.delete.path, isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteDocument(id);
    res.status(204).send();
  });

  // Topics
  app.get(api.topics.get.path, isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const topic = await storage.getTopic(id);
    if (!topic) return res.status(404).json({ message: "Topic not found" });

    const flashcards = await storage.getFlashcards(id);
    const quizzes = await storage.getQuizzes(topic.documentId); // Simplified: getting doc quizzes for now or topic specific

    res.json({ ...topic, flashcards, quizzes });
  });

  // Flashcards
  app.put(api.flashcards.update.path, isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const input = api.flashcards.update.input.parse(req.body);
    const card = await storage.updateFlashcard(id, input);
    res.json(card);
  });

  app.post(api.flashcards.review.path, isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const { difficulty } = req.body;
    // Simple Spaced Repetition Logic simulation
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + (difficulty === 'easy' ? 3 : difficulty === 'medium' ? 1 : 0));
    
    const card = await storage.updateFlashcard(id, { 
      difficulty, 
      lastReviewed: new Date(),
      nextReview: nextReview
    });
    res.json(card);
  });

  // Quizzes
  app.get(api.quizzes.get.path, isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const quiz = await storage.getQuiz(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const questions = await storage.getQuizQuestions(id);
    res.json({ ...quiz, questions });
  });

  app.post(api.quizzes.submit.path, isAuthenticated, async (req: any, res) => {
    const id = Number(req.params.id);
    const { answers } = req.body;
    const userId = req.user.claims.sub;

    const questions = await storage.getQuizQuestions(id);
    let score = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    const attempt = await storage.createQuizAttempt({
      quizId: id,
      userId,
      score,
      totalQuestions: questions.length,
    });

    res.json(attempt);
  });

  // Analytics
  app.get(api.analytics.dashboard.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const docs = await storage.getUserDocuments(userId);
    const attempts = await storage.getQuizAttempts(userId);
    
    const avgScore = attempts.length > 0 
      ? attempts.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions), 0) / attempts.length * 100
      : 0;

    res.json({
      totalDocuments: docs.length,
      totalFlashcardsReviewed: 0, // Placeholder
      averageQuizScore: Math.round(avgScore),
      recentActivity: attempts.slice(0, 5)
    });
  });

  return httpServer;
}

async function seedUser(userId: string) {
  try {
    const doc = await storage.createDocument({
      userId,
      title: "Welcome to Flash Learn",
      filename: "welcome.pdf",
      fileUrl: "/assets/welcome_guide.pdf", // Placeholder
      pageCount: 3,
      processingStatus: "completed"
    });

    const topic = await storage.createTopic({
      documentId: doc.id,
      title: "Getting Started",
      content: "Flash Learn helps you master any subject by converting your PDFs into active recall tools.",
      order: 1
    });

    await storage.createFlashcard({
      topicId: topic.id,
      front: "What is Flash Learn?",
      back: "An AI-powered ed-tech app for creating flashcards and quizzes from PDFs.",
      difficulty: "easy"
    });

    await storage.createFlashcard({
      topicId: topic.id,
      front: "How do I upload?",
      back: "Click the 'Upload PDF' button on the dashboard.",
      difficulty: "medium"
    });
    
    const quiz = await storage.createQuiz({
      documentId: doc.id,
      topicId: topic.id,
      title: "Quick Start Quiz"
    });
    
    await storage.createQuizQuestion({
      quizId: quiz.id,
      question: "What is the primary input for Flash Learn?",
      options: ["Videos", "PDFs", "Audio"],
      correctAnswer: "PDFs",
      type: "mcq",
      difficulty: "easy"
    });

  } catch (err) {
    console.error("Error seeding user:", err);
  }
}
