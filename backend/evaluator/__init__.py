# Make the evaluator directory a Python package
from .evaluator import Evaluator
from .hint_processor import HintProcessor
from .llm_evaluator import LLMEvaluator

__all__ = ['Evaluator', 'HintProcessor', 'LLMEvaluator']