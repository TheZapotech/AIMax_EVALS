# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an LLM evaluation system designed for small organizations to evaluate and compare responses from different language models. The system supports two evaluation approaches:

1. **Rule-based evaluation**: Uses predefined rules and patterns to evaluate responses
2. **LLM-based evaluation**: Uses an "analyzer" LLM to evaluate responses from other LLMs (more accurate and nuanced)

Key features:
- Multiple evaluation types (exact match, contains all, functional equivalence, key elements)
- Support for OpenAI and Anthropic models
- Automated evaluation with hints and detailed scoring
- JSON-based test cases and results
- Comprehensive diagnostic and troubleshooting tools

## Setup Instructions

### 1. Initial Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Copy configuration template
cp docs/config.json.template config.json

# Edit config.json with your actual API keys
```

### 2. Configuration
Edit `config.json` with your API keys:
- `openai.api_key`: Your OpenAI API key
- `anthropic.api_key`: Your Anthropic API key (optional)
- `analyzer`: Configuration for the LLM that evaluates responses

## Development Commands

### Installation
```bash
pip install -r requirements.txt
```

### Testing
```bash
# Run tests with pytest
pytest

# Run tests with coverage
pytest --cov=backend --cov-report=html
```

### Running Evaluations

#### Rule-based Evaluation
```bash
# Basic rule-based evaluation
python run_evaluation.py

# Enhanced CLI with rule-based evaluation
python eval_runner.py --provider openai --model gpt-3.5-turbo --test-suite sample_test_suite.json

# List available models and test suites
python eval_runner.py --list

# Run with all available models
python eval_runner.py --all-models --test-suite sample_test_suite.json
```

#### LLM-based Evaluation (Recommended)
```bash
# Basic LLM-based evaluation (uses analyzer from config.json)
python llm_eval_runner.py

# With specific model
python llm_eval_runner.py --provider openai --model gpt-3.5-turbo --test-suite sample_test_suite.json

# List available options
python llm_eval_runner.py --list

# Run with all available models
python llm_eval_runner.py --all-models --test-suite sample_test_suite.json

# Quiet mode (less verbose output)
python llm_eval_runner.py --provider openai --model gpt-4o-mini --quiet
```

### Diagnostic Tools
```bash
# Check API keys and connection
python check_openai_api.py

# Test LLM evaluation with detailed logging
python test_llm_eval.py

# Run all diagnostic tools
./diagnose_llm_evaluator.sh
```

## Code Architecture

### Core Components

1. **Evaluator System** (`backend/evaluator/`)
   - `evaluator.py`: Base evaluator class with rule-based evaluation logic
   - `llm_evaluator.py`: Enhanced evaluator that uses LLMs for answer checking
   - `hint_processor.py`: Processes evaluation hints (contains_word, regex_match, etc.)

2. **LLM Connectors** (`backend/llm/`)
   - `llm_connector.py`: Base connector class and provider-specific implementations (OpenAI, Anthropic)
   - Handles API calls, token counting, and response formatting

3. **Storage Layer** (`backend/storage/`)
   - `json_handler.py`: Handles test case loading and result saving

### Evaluation Types
- `exact_match`: Exact string matching
- `contains_all`: Checks for multiple required elements with partial credit
- `functional_equivalence`: For code evaluation
- `key_elements`: Checks for presence of key concepts

### Configuration
- `config.json`: Contains API keys and model configurations
- Requires `openai` and `anthropic` sections with API keys and model lists
- `analyzer` section configures which LLM to use for evaluation

### Test Cases Structure
- JSON files in `test_cases/` directory define evaluation scenarios
- Each test case includes:
  - `test_id`: Unique identifier
  - `prompt`: The question/prompt to send to the LLM
  - `expected`: Expected answer or criteria
  - `evaluation_type`: How to evaluate (exact_match, contains_all, functional_equivalence, key_elements)
  - `weight`: Scoring weight (default 1.0)
  - `evaluation_hint`: Optional hints to guide evaluation

### Results
- Results saved to `results/evaluations/` in JSON format
- Include detailed scoring, token usage, response times
- LLM-based evaluations include analyzer explanations

### Key Patterns
- Async/await pattern used throughout for LLM API calls
- Factory pattern for creating LLM connectors
- Inheritance pattern: LLMEvaluator extends base Evaluator
- Comprehensive error handling with fallback to rule-based evaluation
- Detailed logging and diagnostic tools for troubleshooting