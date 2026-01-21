import { db } from "./db";
import { 
  documents, topics, flashcards, quizzes, quizQuestions, quizAttempts,
  type InsertDocument, type InsertTopic, type InsertFlashcard, type InsertQuiz, type InsertQuizQuestion, type InsertQuizAttempt,
  type Document, type Topic, type Flashcard, type Quiz, type QuizQuestion, type QuizAttempt
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Documents
  createDocument(doc: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getUserDocuments(userId: string): Promise<Document[]>;
  updateDocumentStatus(id: number, status: string, pageCount?: number): Promise<Document>;
  deleteDocument(id: number): Promise<void>;

  // Topics
  createTopic(topic: InsertTopic): Promise<Topic>;
  getTopics(documentId: number): Promise<Topic[]>;
  getTopic(id: number): Promise<Topic | undefined>;

  // Flashcards
  createFlashcard(card: InsertFlashcard): Promise<Flashcard>;
  getFlashcards(topicId: number): Promise<Flashcard[]>;
  getFlashcard(id: number): Promise<Flashcard | undefined>;
  updateFlashcard(id: number, updates: Partial<InsertFlashcard>): Promise<Flashcard>;

  // Quizzes
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  getQuizzes(documentId: number): Promise<Quiz[]>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  getQuizQuestions(quizId: number): Promise<QuizQuestion[]>;

  // Attempts
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttempts(userId: string): Promise<QuizAttempt[]>;
}

export class DatabaseStorage implements IStorage {
  // Documents
  async createDocument(doc: InsertDocument): Promise<Document> {
    const [newDoc] = await db.insert(documents).values(doc).returning();
    return newDoc;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.createdAt));
  }

  async updateDocumentStatus(id: number, status: string, pageCount?: number): Promise<Document> {
    const [doc] = await db.update(documents)
      .set({ processingStatus: status, pageCount: pageCount })
      .where(eq(documents.id, id))
      .returning();
    return doc;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Topics
  async createTopic(topic: InsertTopic): Promise<Topic> {
    const [newTopic] = await db.insert(topics).values(topic).returning();
    return newTopic;
  }

  async getTopics(documentId: number): Promise<Topic[]> {
    return db.select().from(topics).where(eq(topics.documentId, documentId)).orderBy(topics.order);
  }

  async getTopic(id: number): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id));
    return topic;
  }

  // Flashcards
  async createFlashcard(card: InsertFlashcard): Promise<Flashcard> {
    const [newCard] = await db.insert(flashcards).values(card).returning();
    return newCard;
  }

  async getFlashcards(topicId: number): Promise<Flashcard[]> {
    return db.select().from(flashcards).where(eq(flashcards.topicId, topicId));
  }

  async getFlashcard(id: number): Promise<Flashcard | undefined> {
    const [card] = await db.select().from(flashcards).where(eq(flashcards.id, id));
    return card;
  }

  async updateFlashcard(id: number, updates: Partial<InsertFlashcard>): Promise<Flashcard> {
    const [card] = await db.update(flashcards).set(updates).where(eq(flashcards.id, id)).returning();
    return card;
  }

  // Quizzes
  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async getQuizzes(documentId: number): Promise<Quiz[]> {
    return db.select().from(quizzes).where(eq(quizzes.documentId, documentId));
  }

  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const [newQuestion] = await db.insert(quizQuestions).values(question).returning();
    return newQuestion;
  }

  async getQuizQuestions(quizId: number): Promise<QuizQuestion[]> {
    return db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId));
  }

  // Attempts
  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [newAttempt] = await db.insert(quizAttempts).values(attempt).returning();
    return newAttempt;
  }

  async getQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    return db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId)).orderBy(desc(quizAttempts.completedAt));
  }
}

export const storage = new DatabaseStorage();
