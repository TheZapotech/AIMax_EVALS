export interface EvaluationResult {
  evaluation_id: string;
  timestamp: string;
  provider: string;
  model: string;
  analyzer: {
    provider: string;
    model: string;
  };
  test_suite_id: string;
  results: TestResult[];
  summary: EvaluationSummary;
}

export interface TestResult {
  test_id: string;
  prompt: string;
  response: string;
  expected: string;
  evaluation: {
    score: number;
    max_score: number;
    evaluation_type: string;
    llm_evaluation: {
      correct: boolean;
      partial: boolean;
      explanation: string;
      raw_response: string;
      response_time: number;
      tokens: {
        prompt: number;
        completion: number;
        total: number;
      };
    };
    timestamp: string;
  };
  category: string;
  difficulty: string;
  llm_metrics: {
    content: string;
    model: string;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    response_time: number;
    timestamp: string;
  };
}

export interface EvaluationSummary {
  total_tests: number;
  total_score: number;
  max_possible_score: number;
  accuracy: number;
  total_tokens: number;
  total_response_time: number;
  analyzer_tokens: number;
  analyzer_response_time: number;
  average_response_time: number;
  average_analyzer_response_time: number;
}

export interface DashboardStats {
  totalRuns: number;
  averageScore: number;
  bestModel: string;
  latestRun: string;
}