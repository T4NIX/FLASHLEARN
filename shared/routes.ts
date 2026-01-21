import { z } from 'zod';
import { 
  insertDocumentSchema, 
  insertFlashcardSchema, 
  insertQuizSchema, 
  documents, 
  topics, 
  flashcards, 
  quizzes,
  quizQuestions,
  quizAttempts,
  insertQuizAttemptSchema
} from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  documents: {
    list: {
      method: 'GET' as const,
      path: '/api/documents',
      responses: {
        200: z.array(z.custom<typeof documents.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/documents',
      // input is FormData (multipart), so we don't define a JSON schema here for validation strictly, 
      // but the backend will handle it. We can document it as 'any' or optional for now.
      input: z.any(), 
      responses: {
        201: z.custom<typeof documents.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/documents/:id',
      responses: {
        200: z.custom<typeof documents.$inferSelect & { topics: typeof topics.$inferSelect[] }>(), // Extended with topics
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/documents/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  topics: {
    get: {
      method: 'GET' as const,
      path: '/api/topics/:id',
      responses: {
        200: z.custom<typeof topics.$inferSelect & { flashcards: typeof flashcards.$inferSelect[], quizzes: typeof quizzes.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
  },
  flashcards: {
    update: {
      method: 'PUT' as const,
      path: '/api/flashcards/:id',
      input: insertFlashcardSchema.partial(),
      responses: {
        200: z.custom<typeof flashcards.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    // For spaced repetition review
    review: {
      method: 'POST' as const,
      path: '/api/flashcards/:id/review',
      input: z.object({ difficulty: z.enum(['easy', 'medium', 'hard']) }),
      responses: {
        200: z.custom<typeof flashcards.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  quizzes: {
    get: {
      method: 'GET' as const,
      path: '/api/quizzes/:id',
      responses: {
        200: z.custom<typeof quizzes.$inferSelect & { questions: typeof quizQuestions.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    submit: {
      method: 'POST' as const,
      path: '/api/quizzes/:id/submit',
      input: z.object({ answers: z.record(z.string()) }), // questionId -> answer
      responses: {
        200: z.custom<typeof quizAttempts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  analytics: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/analytics/dashboard',
      responses: {
        200: z.object({
          totalDocuments: z.number(),
          totalFlashcardsReviewed: z.number(),
          averageQuizScore: z.number(),
          recentActivity: z.array(z.any()), // Can refine this
        }),
      },
    },
  },
};

// ============================================
// BUILD URL HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
