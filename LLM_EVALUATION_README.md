m # LLM-Based Evaluation Guide

This guide focuses specifically on the LLM-based evaluation functionality in the AI Cookbook Evals system.

## What is LLM-Based Evaluation?

LLM-based evaluation uses a language model (the "analyzer") to evaluate responses from other language models, instead of using rule-based evaluation methods. This provides:

- More accurate and nuanced evaluations
- Better handling of complex or open-ended questions
- Detailed explanations for why a response is correct or incorrect

## Setup

### 1. Configure the Analyzer

In `config.json`, add an "analyzer" section:

```json
{
  "openai": {
    "api_key": "your-openai-api-key",
    "models": ["gpt-3.5-turbo", "gpt-4o-mini"]
  },
  "analyzer": {
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "system_prompt": "You are an expert evaluator tasked with determining if a response correctly answers a given question."
  }
}
```

The analyzer configuration requires:
- `provider`: Which provider to use (e.g., "openai")
- `model`: Which model to use (e.g., "gpt-3.5-turbo")
- `system_prompt`: Instructions for the evaluation process

### 2. Install Dependencies

Make sure you have the necessary dependencies:

```bash
pip install openai>=1.0.0 anthropic>=0.5.0 requests>=2.31.0 aiohttp>=3.9.0
```

## Running LLM-Based Evaluations

### Basic Usage

Run an evaluation with all configured models:

```bash
python llm_eval_runner.py
```

This will:
1. Load test cases from `test_cases/sample_test_suite.json`
2. Run each test case with all models in your config
3. Use the analyzer LLM to evaluate the responses
4. Save results to the `results/evaluations/` directory

### Specific Model

Evaluate a specific model:

```bash
python llm_eval_runner.py --provider openai --model gpt-3.5-turbo
```

### Custom Test Suite

Use a custom test suite:

```bash
python llm_eval_runner.py --test-suite my_custom_suite.json
```

### All Available Options

| Option | Description |
|--------|-------------|
| `--list` | List available models and test suites |
| `--provider` | LLM provider (e.g., openai, anthropic) |
| `--model` | Model name (e.g., gpt-3.5-turbo, claude-2) |
| `--test-suite` | Test suite file (e.g., sample_test_suite.json) |
| `--all-models` | Run evaluation with all available models |
| `--quiet` | Reduce output verbosity |

### Convenience Script

For easier usage, use the shell script:

```bash
./run_llm_eval.sh openai gpt-3.5-turbo
```

Or compare two models:

```bash
./run_llm_eval.sh compare gpt-3.5-turbo gpt-4o-mini
```

## How It Works

1. **Test Case Processing**: The system loads test cases from the specified JSON file
2. **Response Generation**: For each test case, it sends the prompt to the specified LLM
3. **LLM Evaluation**: The analyzer LLM evaluates each response using a specialized prompt
4. **Result Extraction**: The system extracts the evaluation result and explanation
5. **Scoring**: Scores are calculated based on the LLM's evaluation
6. **Results Storage**: Results are saved to a JSON file

### Evaluation Process

For each response, the analyzer LLM receives a prompt like:

```
I need you to evaluate if the following response correctly answers the question.

QUESTION:
What is the capital of France?

EXPECTED ANSWER:
Paris

ACTUAL RESPONSE:
The capital of France is Paris.

EVALUATION TYPE: exact_match

Based on the evaluation type "exact_match", determine if the response is:
1. Correct (full credit)
2. Partially correct (half credit)
3. Incorrect (no credit)

Provide your evaluation in the following format:
CORRECT: [Yes/No/Partial]
EXPLANATION: [Brief explanation of your evaluation]
```

The analyzer then provides a structured response that the system parses to determine the score.

## Results Format

Results are saved in JSON format:

```json
{
  "evaluation_id": "llm_eval_20250308",
  "model": "gpt-3.5-turbo",
  "analyzer": {
    "provider": "openai",
    "model": "gpt-3.5-turbo"
  },
  "results": [
    {
      "test_id": "test_001",
      "prompt": "What is the capital of France?",
      "response": "The capital of France is Paris.",
      "expected": "Paris",
      "evaluation": {
        "score": 1.0,
        "max_score": 1.0,
        "llm_evaluation": {
          "correct": true,
          "explanation": "The response correctly identifies Paris as the capital of France.",
          "response_time": 0.82
        }
      }
    }
  ],
  "summary": {
    "accuracy": 100.0,
    "total_tokens": 428,
    "analyzer_tokens": 312
  }
}
```

## Troubleshooting

If you encounter the error "LLM Evaluation: Fallback to traditional evaluation due to LLM error":

1. Check your API key:
   ```bash
   python check_openai_api.py
   ```

2. Run the diagnostic script:
   ```bash
   ./diagnose_llm_evaluator.sh
   ```

3. See the troubleshooting guide:
   ```
   LLM_EVALUATOR_TROUBLESHOOTING.md
   ```

## Files Used

When you run `llm_eval_runner.py`, these files are used:

1. **Main Script**: `llm_eval_runner.py`
2. **Configuration**: `config.json`
3. **Backend Modules**:
   - `backend/evaluator/llm_evaluator.py`
   - `backend/evaluator/evaluator.py`
   - `backend/evaluator/hint_processor.py`
   - `backend/llm/llm_connector.py`
   - `backend/storage/json_handler.py`
4. **Test Cases**: `test_cases/sample_test_suite.json` (or specified file)
5. **Results**: Files created in `results/evaluations/`

## Tips for Best Results

1. **Choose the Right Analyzer**: Use a model that's at least as capable as the models being evaluated
2. **Customize the System Prompt**: Tailor the prompt for your specific evaluation needs
3. **Use Evaluation Hints**: They provide additional guidance to the analyzer
4. **Test with Simple Cases First**: Start with straightforward test cases before complex ones
5. **Check Token Usage**: Monitor token usage to manage costs