// AI Service for OpenAI integration
// This service will be implemented with API routes to keep API keys secure

export interface TranscriptionResult {
  text: string;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
}

export interface SummaryResult {
  summary: string;
}

export interface SearchResult {
  content: string;
  score: number;
  metadata: any;
}

export const aiService = {
  async transcribeMedia(mediaFileId: string): Promise<TranscriptionResult> {
    const response = await fetch("/api/ai/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaFileId })
    });

    if (!response.ok) {
      throw new Error("Failed to transcribe media");
    }

    return response.json();
  },

  async generateSummary(content: string, type: "document" | "media" | "project"): Promise<SummaryResult> {
    const response = await fetch("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, type })
    });

    if (!response.ok) {
      throw new Error("Failed to generate summary");
    }

    return response.json();
  },

  async semanticSearch(projectId: string, query: string): Promise<SearchResult[]> {
    const response = await fetch("/api/ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, query })
    });

    if (!response.ok) {
      throw new Error("Failed to perform search");
    }

    return response.json();
  },

  async askQuestion(projectId: string, question: string): Promise<{ answer: string; sources: any[] }> {
    const response = await fetch("/api/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, question })
    });

    if (!response.ok) {
      throw new Error("Failed to get answer");
    }

    return response.json();
  },

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch("/api/ai/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error("Failed to generate embedding");
    }

    const data = await response.json();
    return data.embedding;
  }
};