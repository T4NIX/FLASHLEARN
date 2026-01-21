import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// Import auth and chat models to re-export or use
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  fileUrl: text("file_url").notNull(), // Could be storage path
  pageCount: integer("page_count").default(0),
  processingStatus: text("processing_status").default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  content: text("content"), // Summary or content chunk
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull().references(() => topics.id, { onDelete: 'cascade' }),
  front: text("front").notNull(),
  back: text("back").notNull(),
  difficulty: text("difficulty").default("medium"), // easy, medium, hard
  lastReviewed: timestamp("last_reviewed"),
  nextReview: timestamp("next_review"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id, { onDelete: 'cascade' }),
  topicId: integer("topic_id").references(() => topics.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  question: text("question").notNull(),
  options: jsonb("options"), // Array of strings for MCQ
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  type: text("type").default("mcq"), // mcq, short_answer
  difficulty: text("difficulty").default("medium"),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Relations
export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, { fields: [documents.userId], references: [users.id] }),
  topics: many(topics),
  quizzes: many(quizzes),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  document: one(documents, { fields: [topics.documentId], references: [documents.id] }),
  flashcards: many(flashcards),
}));

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  topic: one(topics, { fields: [flashcards.topicId], references: [topics.id] }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  document: one(documents, { fields: [quizzes.documentId], references: [documents.id] }),
  topic: one(topics, { fields: [quizzes.topicId], references: [topics.id] }),
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizQuestions.quizId], references: [quizzes.id] }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizAttempts.quizId], references: [quizzes.id] }),
  user: one(users, { fields: [quizAttempts.userId], references: [users.id] }),
}));

// Schemas & Types
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, processingStatus: true, pageCount: true });
export const insertTopicSchema = createInsertSchema(topics).omit({ id: true, createdAt: true });
export const insertFlashcardSchema = createInsertSchema(flashcards).omit({ id: true, createdAt: true, lastReviewed: true, nextReview: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true });
export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({ id: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true, completedAt: true });

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;

export type Flashcard = typeof flashcards.$inferSelect;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;

// Additional Types for API
export type CreateDocumentRequest = InsertDocument;
export type CreateFlashcardRequest = InsertFlashcard;
export type UpdateFlashcardRequest = Partial<InsertFlashcard>;
export type SubmitQuizRequest = { answers: Record<number, string> }; // questionId -> answer
