# AI Cookbook Evals - Quick Start Guide

This guide provides the essential steps to get started with the AI Cookbook Evals system.

## 1. Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Or install core packages directly
pip install openai>=1.0.0 anthropic>=0.5.0 requests>=2.31.0 aiohttp>=3.9.0
```

## 2. Configuration

Edit `config.json` with your API keys:

```json
{
  "openai": {
    "api_key": "your-openai-api-key",
    "models": ["gpt-3.5-turbo", "gpt-4o-mini"]
  },
  "analyzer": {
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "system_prompt": "You are an expert evaluator..."
  }
}
```

## 3. Running Evaluations

### Standard Rule-Based Evaluation

```bash
# Basic usage
python run_evaluation.py

# Enhanced CLI
python eval_runner.py --provider openai --model gpt-3.5-turbo --test-suite sample_test_suite.json
```

### LLM-Based Evaluation

```bash
# Basic usage
python llm_eval_runner.py

# With specific model
python llm_eval_runner.py --provider openai --model gpt-3.5-turbo
```

### Convenience Scripts

```bash
# Rule-based evaluation
./run_eval.sh openai gpt-3.5-turbo

# LLM-based evaluation
./run_llm_eval.sh openai gpt-3.5-turbo

# Compare models
./run_llm_eval.sh compare gpt-3.5-turbo gpt-4o-mini
```

## 4. Test Cases

Test cases are defined in JSON files in the `test_cases/` directory:

```json
{
  "test_suite_id": "my_test_suite",
  "test_cases": [
    {
      "test_id": "test_001",
      "prompt": "What is the capital of France?",
      "expected": "Paris",
      "evaluation_type": "exact_match",
      "weight": 1.0
    }
  ]
}
```

## 5. Results

Results are saved to the `results/evaluations/` directory in JSON format.

## 6. Troubleshooting

If you encounter issues:

```bash
# Run diagnostic tools
./diagnose_llm_evaluator.sh

# Check API key
python check_openai_api.py

# Test LLM evaluation
python test_llm_eval.py
```

## 7. Available Commands

| Command | Description |
|---------|-------------|
| `python run_evaluation.py` | Run basic evaluation |
| `python eval_runner.py` | Run rule-based evaluation with CLI options |
| `python llm_eval_runner.py` | Run LLM-based evaluation with CLI options |
| `./run_eval.sh` | Convenience script for rule-based evaluation |
| `./run_llm_eval.sh` | Convenience script for LLM-based evaluation |
| `./diagnose_llm_evaluator.sh` | Run diagnostic tools |

## 8. Command-Line Options

| Option | Description |
|--------|-------------|
| `--list` | List available models and test suites |
| `--provider` | LLM provider (e.g., openai, anthropic) |
| `--model` | Model name (e.g., gpt-3.5-turbo) |
| `--test-suite` | Test suite file (e.g., sample_test_suite.json) |
| `--all-models` | Run evaluation with all available models |
| `--quiet` | Reduce output verbosity |

## 9. Documentation

- `README.md` - Main documentation
- `LLM_EVALUATION_README.md` - LLM-based evaluation guide
- `DIAGNOSTIC_TOOLS_README.md` - Diagnostic tools guide
- `LLM_EVALUATOR_TROUBLESHOOTING.md` - Troubleshooting guide