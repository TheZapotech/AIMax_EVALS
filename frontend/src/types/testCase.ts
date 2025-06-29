export interface TestCase {
  test_id: string;
  prompt: string;
  expected: string;
  evaluation_type: 'exact_match' | 'contains_all' | 'functional_equivalence' | 'key_elements' | 'contains_word' | 'llm_judge';
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  weight: number;
  language?: string;
  evaluation_hint: EvaluationHint;
}

export interface EvaluationHint {
  type: 'contains_word' | 'contains_all_words' | 'regex_match' | 'code_output';
  value?: string;
  values?: string[];
  pattern?: string;
  description?: string;
  case_sensitive?: boolean;
  test_cases?: CodeTestCase[];
}

export interface CodeTestCase {
  input: string;
  expected_output: string;
}

export interface TestSuite {
  test_suite_id: string;
  description: string;
  language: string;
  test_cases: TestCase[];
  metadata: TestSuiteMetadata;
}

export interface TestSuiteMetadata {
  created_at: string;
  version: string;
  total_weight: number;
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}