import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

// Topics
export function useTopic(id: number) {
  return useQuery({
    queryKey: [api.topics.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.topics.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch topic");
      return api.topics.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Flashcards
export function useReviewFlashcard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, difficulty }: { id: number; difficulty: 'easy' | 'medium' | 'hard' }) => {
      const url = buildUrl(api.flashcards.review.path, { id });
      const res = await fetch(url, {
        method: api.flashcards.review.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to review flashcard");
      return api.flashcards.review.responses[200].parse(await res.json());
    },
    // We invalidate the topic query because that's usually where flashcards are loaded from
    // But ideally we'd invalidate flashcard specific keys if we had them listed separately
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.topics.get.path] }); 
      // Also potentially invalidate document queries if they include flashcard counts
    },
  });
}

// Quizzes
export function useQuiz(id: number) {
  return useQuery({
    queryKey: [api.quizzes.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.quizzes.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch quiz");
      return api.quizzes.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, answers }: { id: number; answers: Record<number, string> }) => {
      const url = buildUrl(api.quizzes.submit.path, { id });
      const res = await fetch(url, {
        method: api.quizzes.submit.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit quiz");
      return api.quizzes.submit.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
    },
  });
}

// Analytics
export function useAnalytics() {
  return useQuery({
    queryKey: [api.analytics.dashboard.path],
    queryFn: async () => {
      const res = await fetch(api.analytics.dashboard.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return api.analytics.dashboard.responses[200].parse(await res.json());
    },
  });
}
