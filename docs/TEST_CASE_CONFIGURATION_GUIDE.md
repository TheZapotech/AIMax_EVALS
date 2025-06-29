# Test Case Configuration Guide

This guide explains how to create and configure test cases for the AIMax LLM Evaluation System. Test cases define what questions to ask LLMs and how to evaluate their responses.

## Overview

The evaluation system supports two evaluation modes:

1. **Rule-Based Evaluation** (`eval_runner.py`) - Uses predefined rules and pattern matching
2. **LLM-Based Evaluation** (`llm_eval_runner.py`) - Uses an "analyzer" LLM to evaluate responses (recommended)

Both modes use the same test case format but differ in how they process the results.

## Test Suite Structure

### Basic Format

```json
{
  "test_suite_id": "my_test_suite",
  "description": "Description of what this test suite evaluates",
  "language": "en",
  "test_cases": [
    {
      "test_id": "unique_test_id",
      "prompt": "Question to ask the LLM",
      "expected": "Expected answer or criteria",
      "evaluation_type": "how_to_evaluate",
      "category": "subject_category",
      "difficulty": "easy|medium|hard",
      "weight": 1.0,
      "evaluation_hint": {
        "type": "hint_type",
        "value": "hint_parameters"
      }
    }
  ],
  "metadata": {
    "created_at": "2025-01-01T00:00:00Z",
    "version": "1.0",
    "total_weight": 10.0,
    "difficulty_distribution": {
      "easy": 5,
      "medium": 3,
      "hard": 2
    }
  }
}
```

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `test_suite_id` | Unique identifier for the test suite | `"math_basics"` |
| `test_cases` | Array of test case objects | `[{...}, {...}]` |

### Test Case Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `test_id` | Unique identifier for the test | `"addition_001"` |
| `prompt` | Question/instruction for the LLM | `"What is 2 + 2?"` |
| `expected` | Expected answer or criteria | `"4"` |
| `evaluation_type` | How to evaluate the response | `"exact_match"` |

### Optional Fields

| Field | Description | Default | Example |
|-------|-------------|---------|---------|
| `category` | Subject category | `"general"` | `"math"`, `"science"` |
| `difficulty` | Difficulty level | `"easy"` | `"easy"`, `"medium"`, `"hard"` |
| `weight` | Scoring weight | `1.0` | `2.0`, `3.0` |
| `evaluation_hint` | Additional evaluation guidance | `null` | See hint types below |

## Evaluation Types

### 1. `exact_match`

Tests for exact string matching (case-insensitive).

**Use for:**
- True/false questions
- Single-word answers
- Multiple choice (A, B, C, D)
- Specific factual answers

**Example:**
```json
{
  "test_id": "capital_france",
  "prompt": "What is the capital of France? Only the city name.",
  "expected": "Paris",
  "evaluation_type": "exact_match",
  "category": "geography",
  "weight": 1.0
}
```

### 2. `contains_all`

Checks if the response contains all required elements, with partial credit.

**Use for:**
- List questions
- Multi-part answers
- When order doesn't matter

**Example:**
```json
{
  "test_id": "primary_colors",
  "prompt": "List the three primary colors.",
  "expected": "red, blue, yellow",
  "evaluation_type": "contains_all",
  "category": "art",
  "weight": 3.0
}
```

**Scoring:** Partial credit based on how many elements are found.

### 3. `functional_equivalence`

For code evaluation - tests if code produces correct outputs.

**Use for:**
- Programming questions
- Algorithm implementations
- Code that should produce specific outputs

**Example:**
```json
{
  "test_id": "even_function",
  "prompt": "Write a Python function that checks if a number is even.",
  "expected": "def is_even(n): return n % 2 == 0",
  "evaluation_type": "functional_equivalence",
  "category": "programming",
  "weight": 3.0
}
```

### 4. `key_elements`

Checks for presence of key concepts or elements in explanatory answers.

**Use for:**
- Essay-style questions
- Explanations
- When specific concepts must be mentioned

**Example:**
```json
{
  "test_id": "photosynthesis",
  "prompt": "Explain photosynthesis. Include: sunlight, chlorophyll, and glucose.",
  "expected": "sunlight, chlorophyll, glucose",
  "evaluation_type": "key_elements",
  "category": "science",
  "weight": 3.0
}
```

### 5. `contains_word`

Checks if response contains a specific word or phrase.

**Use for:**
- Multiple choice where answer can be letter or word
- When flexible matching needed

**Example:**
```json
{
  "test_id": "mammal_question",
  "prompt": "Which is a mammal? A) Snake B) Eagle C) Dolphin D) Lizard",
  "expected": "C",
  "evaluation_type": "contains_word",
  "category": "biology",
  "weight": 1.0
}
```

## Evaluation Hints

Hints provide additional guidance for both rule-based and LLM-based evaluation.

### `contains_word`

Check if response contains a specific word.

```json
{
  "evaluation_hint": {
    "type": "contains_word",
    "value": "Paris",
    "case_sensitive": false
  }
}
```

### `contains_all_words`

Check if response contains all specified words.

```json
{
  "evaluation_hint": {
    "type": "contains_all_words",
    "values": ["red", "blue", "yellow"],
    "case_sensitive": false
  }
}
```

### `regex_match`

Use regular expression pattern matching.

```json
{
  "evaluation_hint": {
    "type": "regex_match",
    "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    "description": "Should match email format"
  }
}
```

### `code_output`

For testing code functionality with specific inputs.

```json
{
  "evaluation_hint": {
    "type": "code_output",
    "test_cases": [
      {"input": "2", "expected_output": "True"},
      {"input": "3", "expected_output": "False"}
    ]
  }
}
```

## Rule-Based vs LLM-Based Evaluation

### Rule-Based Evaluation (`eval_runner.py`)

- Uses pattern matching and hints strictly
- Faster execution
- More deterministic results
- Limited to predefined rules
- Good for objective questions

### LLM-Based Evaluation (`llm_eval_runner.py`) - **RECOMMENDED**

- Uses an "analyzer" LLM to judge responses
- More nuanced understanding
- Can handle subjective questions
- Provides detailed explanations
- **Recommended for most use cases**

#### How LLM-Based Evaluation Works

The LLM evaluator creates a sophisticated evaluation process:

1. **Analyzer LLM Setup**: Configured in `config.json` under the `analyzer` section
2. **Evaluation Prompt Construction**: Creates a detailed prompt for the analyzer that includes:
   - Original question/prompt
   - Expected answer
   - Actual LLM response
   - Evaluation type
   - **Your evaluation hints** (crucial for guidance)
3. **LLM Analysis**: The analyzer LLM determines if the response is Correct/Partial/Incorrect
4. **Fallback Safety**: If LLM evaluation fails, automatically falls back to rule-based evaluation

#### Key Insight: Evaluation Hints Are Critical

**Your evaluation hints directly guide the analyzer LLM!** They are passed as part of the evaluation prompt:

```python
# From llm_evaluator.py - lines 78-90
hint = test_case.get('evaluation_hint', None)
hint_text = f"HINT: {hint}\n" if hint else ""
# Include the hint in the evaluation prompt
if hint:
    evaluation_prompt = f"{hint}\n{evaluation_prompt}"
```

This means:
- **Specific hints lead to better evaluation accuracy**
- **Clear hint descriptions help the analyzer understand your intent**
- **Hints work for both rule-based (fallback) and LLM-based evaluation**

#### Example Evaluation Process

For a test case with this hint:
```json
{
  "evaluation_hint": {
    "type": "contains_all_words",
    "values": ["photosynthesis", "chlorophyll", "sunlight"],
    "case_sensitive": false
  }
}
```

The analyzer LLM receives a prompt like:
```
HINT: {'type': 'contains_all_words', 'values': ['photosynthesis', 'chlorophyll', 'sunlight'], 'case_sensitive': false}

I need you to evaluate if the following response correctly answers the question.

QUESTION: Explain how plants make energy
EXPECTED ANSWER: photosynthesis, chlorophyll, sunlight
ACTUAL RESPONSE: [LLM's actual response]
EVALUATION TYPE: key_elements

Based on the evaluation type "key_elements", determine if the response is:
1. Correct (full credit)
2. Partially correct (half credit)  
3. Incorrect (no credit)
```

### Key Differences

| Aspect | Rule-Based | LLM-Based |
|--------|------------|-----------|
| **Speed** | Fast | Slower (requires LLM calls) |
| **Accuracy** | Limited by rules | More nuanced |
| **Flexibility** | Low | High |
| **Explanations** | Basic | Detailed |
| **Cost** | Free | Uses analyzer LLM tokens |
| **Subjectivity** | Cannot handle | Good with subjective questions |
| **Hint Usage** | Direct pattern matching | Guides LLM analyzer thinking |
| **Fallback** | None | Falls back to rule-based if needed |

## Best Practices

### 1. Choose Appropriate Evaluation Types

- **`exact_match`**: Facts, true/false, multiple choice
- **`contains_all`**: Lists, multi-part answers
- **`functional_equivalence`**: Code problems
- **`key_elements`**: Explanations requiring specific concepts
- **`contains_word`**: Flexible matching needs

### 2. Weight Questions Appropriately

```json
{
  "weight": 1.0,  // Simple factual questions
  "weight": 2.0,  // Medium complexity
  "weight": 3.0   // Complex explanations or code
}
```

### 3. Use Clear, Specific Prompts

**Good:**
```json
{
  "prompt": "What is the capital of France? Only the city name."
}
```

**Bad:**
```json
{
  "prompt": "Tell me about France."
}
```

### 4. Provide Helpful Hints

```json
{
  "evaluation_hint": {
    "type": "contains_word",
    "value": "Dolphin or C",
    "case_sensitive": true
  }
}
```

### 5. Organize by Category and Difficulty

```json
{
  "category": "programming",
  "difficulty": "medium"
}
```

## Example Test Cases

### Simple Factual Question

```json
{
  "test_id": "water_boiling",
  "prompt": "True or False: Water boils at 100°C at sea level.",
  "expected": "true",
  "evaluation_type": "exact_match",
  "category": "science",
  "difficulty": "easy",
  "weight": 1.0,
  "evaluation_hint": {
    "type": "contains_word",
    "value": "true",
    "case_sensitive": false
  }
}
```

### Programming Question

```json
{
  "test_id": "fibonacci",
  "prompt": "Write a Python function to calculate the nth Fibonacci number.",
  "expected": "def fibonacci(n): return n if n <= 1 else fibonacci(n-1) + fibonacci(n-2)",
  "evaluation_type": "functional_equivalence",
  "category": "programming",
  "difficulty": "medium",
  "weight": 3.0,
  "evaluation_hint": {
    "type": "code_output",
    "test_cases": [
      {"input": "0", "expected_output": "0"},
      {"input": "1", "expected_output": "1"},
      {"input": "5", "expected_output": "5"}
    ]
  }
}
```

### Explanation Question

```json
{
  "test_id": "climate_change",
  "prompt": "Explain the greenhouse effect. Mention: greenhouse gases, solar radiation, and heat trapping.",
  "expected": "greenhouse gases, solar radiation, heat trapping",
  "evaluation_type": "key_elements",
  "category": "science",
  "difficulty": "medium",
  "weight": 3.0,
  "evaluation_hint": {
    "type": "contains_all_words",
    "values": ["greenhouse gases", "solar radiation", "heat"],
    "case_sensitive": false
  }
}
```

## Running Evaluations

### Using Rule-Based Evaluation

```bash
python eval_runner.py --provider openai --model gpt-3.5-turbo --test-suite my_test_suite.json
```

### Using LLM-Based Evaluation (Recommended)

```bash
python llm_eval_runner.py --provider openai --model gpt-3.5-turbo --test-suite my_test_suite.json
```

### Using the Interactive Menu

```bash
python start.py
```

Then choose option 6 or 3 to select custom test suites with the interactive browser.

## Results and Analysis

Results are saved to `frontend/public/results/evaluations/` and can be viewed in the web dashboard:

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to see:
- Overview statistics
- Detailed test results
- Model comparisons
- Performance trends

## Troubleshooting

### Common Issues

1. **JSON Syntax Errors**
   - Validate JSON format
   - Check for missing commas or brackets
   - Use a JSON validator

2. **Evaluation Type Not Working**
   - Ensure evaluation type is one of: `exact_match`, `contains_all`, `functional_equivalence`, `key_elements`, `contains_word`
   - Check spelling and case sensitivity

3. **Hints Not Working as Expected**
   - Verify hint type and parameters
   - Test with simple cases first
   - Check case sensitivity settings

4. **Low Scores**
   - Review prompt clarity
   - Check if expected answers are too specific
   - Consider using LLM-based evaluation for better accuracy

### Debug Mode

For detailed logging, run evaluations with verbose output:

```bash
python llm_eval_runner.py --provider openai --model gpt-4o-mini --test-suite debug_suite.json
```

## Advanced Configuration

### Custom Analyzer Configuration

In `config.json`, configure the analyzer LLM:

```json
{
  "analyzer": {
    "provider": "openai",
    "model": "gpt-4o",
    "system_prompt": "You are an expert evaluator. Analyze responses objectively and provide clear yes/no judgments with explanations."
  }
}
```

### Test Suite Metadata

Include metadata for better organization:

```json
{
  "metadata": {
    "created_at": "2025-01-01T00:00:00Z",
    "version": "1.0",
    "author": "Your Name",
    "purpose": "Basic knowledge assessment",
    "total_weight": 15.0,
    "difficulty_distribution": {
      "easy": 7,
      "medium": 5,
      "hard": 3
    },
    "category_distribution": {
      "math": 5,
      "science": 4,
      "programming": 3,
      "general": 3
    }
  }
}
```

This guide provides everything needed to create effective test cases for evaluating LLM performance across different domains and question types.