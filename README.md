# AI Cookbook Evals

A simplified LLM evaluation system designed for small organizations. This system provides an easy way to evaluate and compare responses from different LLM models.

## Features

- Simple JSON-based test cases
- Multiple evaluation types (exact match, contains all, functional equivalence, key elements)
- Automated evaluation with hints
- LLM-based evaluation for more accurate assessments
- Human feedback support
- Detailed scoring and reporting
- Command-line interface for easy evaluation runs
- Diagnostic tools for troubleshooting

## Installation

1. Clone the repository
2. Install all required dependencies:
```bash
pip install -r requirements.txt
```

### Troubleshooting Installation

If you encounter module import errors like `ModuleNotFoundError: No module named 'openai'`, make sure you've installed all the required packages:

```bash
# Install core dependencies
pip install openai anthropic requests aiohttp asyncio

# For specific versions
pip install openai>=1.0.0 anthropic>=0.5.0 requests>=2.31.0 aiohttp>=3.9.0
```

You may need to activate your virtual environment first if you're using one:

```bash
# For conda environments
conda activate myenv

# For venv
source venv/bin/activate  # On Unix/macOS
venv\Scripts\activate     # On Windows
```

## Configuration

Before running evaluations, you need to set up your `config.json` file with API keys and model configurations:

```json
{
  "openai": {
    "api_key": "your-openai-api-key",
    "models": ["gpt-3.5-turbo", "gpt-4o-mini"]
  },
  "anthropic": {
    "api_key": "your-anthropic-api-key",
    "models": ["claude-2"]
  },
  "analyzer": {
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "system_prompt": "You are an expert evaluator tasked with determining if a response correctly answers a given question."
  }
}
```

### Configuration Sections

1. **Provider Sections** (openai, anthropic):
   - `api_key`: Your API key for the provider
   - `models`: Array of model names to use for evaluation

2. **Analyzer Section** (for LLM-based evaluation):
   - `provider`: Which provider to use for evaluation (e.g., "openai")
   - `model`: Which model to use for evaluation (e.g., "gpt-3.5-turbo")
   - `system_prompt`: System prompt to guide the evaluation process

## Quick Start

### Standard Rule-Based Evaluation

Run the default evaluation with all configured models:
```bash
python run_evaluation.py
```

For more control over evaluations, use the enhanced command-line interface:

```bash
python eval_runner.py
```

### LLM-Based Evaluation

For more accurate evaluations using an LLM to check answers:

```bash
python llm_eval_runner.py
```

This uses an LLM (configured in the "analyzer" section of config.json) to evaluate responses instead of rule-based evaluation.

## Command-Line Options

Both `eval_runner.py` and `llm_eval_runner.py` support the same command-line options:

### List Available Models and Test Suites

```bash
python eval_runner.py --list
# OR
python llm_eval_runner.py --list
```

### Run Evaluation with a Specific Model

```bash
python eval_runner.py --provider openai --model gpt-3.5-turbo --test-suite sample_test_suite.json
# OR
python llm_eval_runner.py --provider openai --model gpt-3.5-turbo --test-suite sample_test_suite.json
```

### Run Evaluation with All Available Models

```bash
python eval_runner.py --all-models --test-suite sample_test_suite.json
# OR
python llm_eval_runner.py --all-models --test-suite sample_test_suite.json
```

### Reduce Output Verbosity

```bash
python eval_runner.py --provider openai --model gpt-4 --test-suite sample_test_suite.json --quiet
# OR
python llm_eval_runner.py --provider openai --model gpt-4 --test-suite sample_test_suite.json --quiet
```

### Available Command-Line Options

| Option | Description |
|--------|-------------|
| `--list` | List available models and test suites |
| `--provider` | LLM provider (e.g., openai, anthropic) |
| `--model` | Model name (e.g., gpt-3.5-turbo, claude-2) |
| `--test-suite` | Test suite file (e.g., sample_test_suite.json) |
| `--all-models` | Run evaluation with all available models |
| `--quiet` | Reduce output verbosity |

## Creating Test Cases

Test cases are defined in JSON files. Here's a simple example:

```json
{
  "test_suite_id": "my_test_suite",
  "test_cases": [
    {
      "test_id": "test_001",
      "prompt": "What is the capital of France?",
      "expected": "Paris",
      "evaluation_type": "exact_match",
      "weight": 1.0,
      "evaluation_hint": {
        "type": "contains_word",
        "value": "Paris",
        "case_sensitive": false
      }
    }
  ]
}
```

### Evaluation Types

1. `exact_match`
   - For exact answer matching
   - Used for true/false and multiple choice
   - No partial credit

2. `contains_all`
   - Checks for multiple required elements
   - Partial credit available
   - Good for list-type answers

3. `functional_equivalence`
   - For code evaluation
   - Checks if solutions are functionally equivalent
   - Partial credit possible

4. `key_elements`
   - Checks for presence of key concepts
   - Partial credit available
   - Good for explanations/definitions

5. `llm_judge`
   - Leverages the analyzer LLM for nuanced, subjective evaluations (e.g., translations, creative content, complex explanations).
   - See `docs/TEST_CASE_CONFIGURATION_GUIDE.md` for more details.

### Evaluation Hints

Hints help guide the automated evaluation:

1. `contains_word`
```json
{
  "type": "contains_word",
  "value": "specific_word",
  "case_sensitive": false
}
```

2. `contains_all_words`
```json
{
  "type": "contains_all_words",
  "values": ["word1", "word2"],
  "case_sensitive": false
}
```

3. `regex_match`
```json
{
  "type": "regex_match",
  "pattern": "\\d+\\.\\d+",
  "description": "Should contain a decimal number"
}
```

## Scoring System

- Full weight: Perfect match or all elements present
- Half weight: Partial match or some elements present
- Zero: No match or no required elements

## Results

Results are saved in JSON format in the `results/evaluations/` directory:
```json
{
  "evaluation_id": "eval_20250224",
  "model": "model_name",
  "results": [...],
  "summary": {
    "total_score": 10.0,
    "max_possible_score": 15.0,
    "accuracy": 66.67
  }
}
```

## Troubleshooting

If you encounter issues with the LLM evaluator, use the diagnostic tools:

```bash
# Run all diagnostic tools in sequence
./diagnose_llm_evaluator.sh

# Or run individual tools
python check_openai_api.py    # Check if your OpenAI API key is working
python test_llm_eval.py       # Run a test evaluation with detailed logging
```

### Common Issues

If you encounter the error "LLM Evaluation: Fallback to traditional evaluation due to LLM error", check:

1. **API Key Issues**: Make sure your OpenAI API key is valid and not expired
2. **Configuration**: Ensure the "analyzer" section in config.json is correctly configured
3. **Dependencies**: Make sure all required packages are installed
4. **Network Issues**: Check if your network can connect to the OpenAI API

For more detailed troubleshooting:
- See `LLM_EVALUATOR_TROUBLESHOOTING.md` for a comprehensive guide
- Run `python check_openai_api.py` to verify your API key
- Check `llm_eval_test.log` for detailed error messages

## Project Structure

```
AI_Cookbook_Evals/
├── backend/                      # Core evaluation logic
│   ├── evaluator/                # Evaluation components
│   │   ├── evaluator.py          # Base evaluator (rule-based)
│   │   ├── hint_processor.py     # Processes evaluation hints
│   │   └── llm_evaluator.py      # LLM-based evaluator
│   ├── llm/                      # LLM API connections
│   │   └── llm_connector.py      # Connects to LLM providers
│   └── storage/                  # Data storage
│       └── json_handler.py       # Handles JSON files
├── test_cases/                   # Test case definitions
│   └── sample_test_suite.json    # Sample test suite
├── results/                      # Evaluation results
│   └── evaluations/              # JSON result files
├── config.json                   # Configuration file
├── requirements.txt              # Dependencies
├── run_evaluation.py             # Basic evaluation script
├── eval_runner.py                # Enhanced CLI (rule-based)
├── llm_eval_runner.py            # LLM-based evaluation
├── diagnostic tools/             # Troubleshooting tools
│   ├── check_openai_api.py       # API key checker
│   ├── test_llm_eval.py          # Test evaluation
│   ├── debug_llm_evaluator.py    # Debugging tool
│   └── diagnose_llm_evaluator.sh # All-in-one diagnostic
└── documentation/                # Documentation
    ├── DIAGNOSTIC_TOOLS_README.md    # Diagnostic tools guide
    ├── LLM_EVALUATOR_TROUBLESHOOTING.md # Troubleshooting guide
    └── LLM_EVALUATOR_FIXES.md     # Fixes and improvements
```

## LLM-Based Evaluation

The LLM-based evaluation uses an LLM (configured in the "analyzer" section of config.json) to evaluate responses instead of rule-based evaluation. This provides several advantages:

1. **More Accurate Evaluation**: LLMs can understand context and nuance better than rule-based systems
2. **Flexible Evaluation**: Works well for open-ended questions and complex responses
3. **Detailed Feedback**: Provides explanations for why a response is correct or incorrect

The LLM evaluator:
- Uses the evaluation hints as guidance
- Constructs a specialized prompt based on the evaluation type
- Asks the LLM to determine if the response is correct, partially correct, or incorrect
- Extracts the evaluation result and explanation

## License

MIT License - feel free to use and modify for your needs.