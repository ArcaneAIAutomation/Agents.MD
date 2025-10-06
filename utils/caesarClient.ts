/**
 * Caesar API Client
 * Research engine API for crypto news, market intelligence, and due diligence
 * Mobile-optimized with timeout handling and error recovery
 * 
 * Base URL: https://api.caesar.xyz
 * Auth: Authorization: Bearer <API_KEY>
 * 
 * Note: Caesar is a research/news API, NOT a trading/exchange API
 * Use it for generating crypto news briefs, market research, and intelligence
 */

const BASE_URL = "https://api.caesar.xyz";

export type CreateResearchBody = {
  query: string;
  files?: string[];
  compute_units?: number; // 1-10 (~1 minute per CU)
  system_prompt?: string;
};

export type ResearchStatus = 'queued' | 'researching' | 'completed' | 'failed' | 'cancelled' | 'expired' | 'pending';

export type ResearchResult = {
  id: string;
  score: number;
  title: string;
  url: string;
  citation_index: number;
};

export type ResearchJob = {
  id: string;
  created_at?: string; // ISO 8601 timestamp
  status: ResearchStatus;
  query?: string; // Original query
  results?: ResearchResult[];
  content?: string | null; // Final synthesis (null until completed)
  transformed_content?: string | null; // Formatted output if system_prompt used (null until completed)
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    has_next: boolean;
  };
};

/**
 * Generic Caesar API fetch with authentication
 */
async function caesarFetch(path: string, init: RequestInit = {}) {
  const apiKey = process.env.CAESAR_API_KEY;
  
  if (!apiKey) {
    throw new Error('CAESAR_API_KEY environment variable is not set');
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Caesar ${res.status}: ${msg || res.statusText}`);
  }

  return res.json();
}

/**
 * Caesar API Client
 */
export const Caesar = {
  /**
   * Create a research job
   * Returns job ID to poll for results
   */
  createResearch: (body: CreateResearchBody): Promise<ResearchJob> =>
    caesarFetch("/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  /**
   * Get research job status and results
   */
  getResearch: (id: string): Promise<ResearchJob> =>
    caesarFetch(`/research/${id}`),

  /**
   * List all research jobs (paginated)
   */
  listResearch: (page = 1, limit = 25): Promise<PaginatedResponse<ResearchJob>> =>
    caesarFetch(`/research?page=${page}&limit=${limit}`),

  /**
   * Upload a file (PDF, etc.) for research context
   */
  uploadFile: async (file: File | Blob, filename: string) => {
    const apiKey = process.env.CAESAR_API_KEY;
    if (!apiKey) {
      throw new Error('CAESAR_API_KEY environment variable is not set');
    }

    const form = new FormData();
    form.append("file", file, filename);
    
    const res = await fetch(`${BASE_URL}/research/files`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    
    if (!res.ok) {
      throw new Error(`File upload failed: ${res.statusText}`);
    }
    
    return res.json();
  },

  /**
   * List uploaded files (paginated)
   */
  listFiles: (page = 1, limit = 25) =>
    caesarFetch(`/research/files?page=${page}&limit=${limit}`),

  /**
   * Get raw source content for a specific result
   * Useful for showing full article/source text
   */
  getRawResultContent: (id: string, resultId: string): Promise<{ content: string }> =>
    caesarFetch(`/research/${id}/results/${resultId}/content`),

  /**
   * Poll a research job until completed (with timeout)
   * Returns the completed job or throws on timeout/failure
   */
  pollUntilComplete: async (
    jobId: string,
    maxAttempts = 60,
    intervalMs = 2000
  ): Promise<ResearchJob> => {
    for (let i = 0; i < maxAttempts; i++) {
      const job = await Caesar.getResearch(jobId);
      
      if (job.status === 'completed') {
        return job;
      }
      
      if (job.status === 'failed') {
        throw new Error(`Research job ${jobId} failed`);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error(`Research job ${jobId} timed out after ${maxAttempts} attempts`);
  },
};

// Export types
export type { ResearchJob, ResearchResult, ResearchStatus, PaginatedResponse };
