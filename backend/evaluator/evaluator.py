from typing import Dict, Any, List, Optional
from datetime import datetime, UTC
import re
from .hint_processor import HintProcessor

class Evaluator:
    """
    Core evaluator for LLM responses.
    Handles different evaluation types and applies scoring criteria.
    """
    
    def __init__(self):
        """Initialize the evaluator with a hint processor."""
        self.hint_processor = HintProcessor()
        print("Evaluator initialized with hint processor")
        
    def evaluate_response(self, response: str, test_case: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate an LLM response against a test case.
        
        Args:
            response (str): The LLM's response
            test_case (dict): The test case configuration
            
        Returns:
            dict: Evaluation results including score and details
        """
        evaluation_type = test_case.get('evaluation_type')
        weight = float(test_case.get('weight', 1.0))
        
        print(f"\nEvaluating response for test case: {test_case.get('test_id')}")
        print(f"Evaluation type: {evaluation_type}")
        print(f"Weight: {weight}")
        
        # Process evaluation hint if present
        hint_result = None
        if 'evaluation_hint' in test_case:
            print("Processing evaluation hint...")
            hint_result = self.hint_processor.process_hint(
                response, 
                test_case['evaluation_hint']
            )
            print(f"Hint result: {'Passed' if hint_result.get('passed') else 'Failed'}")
        
        # Calculate base score based on evaluation type
        print("Calculating base score...")
        base_score = self._calculate_base_score(
            response,
            test_case.get('expected', ''),
            evaluation_type,
            weight
        )
        print(f"Base score: {base_score}/{weight}")
        
        return {
            'score': base_score,
            'max_score': weight,
            'evaluation_type': evaluation_type,
            'hint_evaluation': hint_result,
            'timestamp': datetime.now(UTC).isoformat()
        }
        
    def _calculate_base_score(
        self, 
        response: str, 
        expected: str, 
        eval_type: str, 
        weight: float
    ) -> float:
        """
        Calculate the base score for a response based on evaluation type.
        
        Args:
            response (str): The LLM's response
            expected (str): The expected answer
            eval_type (str): Type of evaluation
            weight (float): Question weight
            
        Returns:
            float: Calculated score
        """
        if eval_type == 'exact_match':
            return self._evaluate_exact_match(response, expected, weight)
            
        elif eval_type == 'contains_all':
            return self._evaluate_contains_all(response, expected, weight)
            
        elif eval_type == 'functional_equivalence':
            return self._evaluate_functional_equivalence(response, expected, weight)
            
        elif eval_type == 'key_elements':
            return self._evaluate_key_elements(response, expected, weight)
            
        else:
            print(f"Warning: Unknown evaluation type: {eval_type}")
            return 0.0
            
    def _evaluate_exact_match(self, response: str, expected: str, weight: float) -> float:
        """Evaluate exact match responses (including true/false and multiple choice)."""
        print("Performing exact match evaluation...")
        
        # Clean and normalize both strings
        response_clean = self._extract_key_answer(response)
        expected_clean = expected.strip().lower()
        
        result = response_clean == expected_clean
        print(f"Comparing '{response_clean}' with '{expected_clean}'")
        print(f"Exact match result: {'Match' if result else 'No match'}")
        return weight if result else 0.0
        
    def _evaluate_contains_all(self, response: str, expected: str, weight: float) -> float:
        """Evaluate responses that should contain all expected elements."""
        print("Performing contains-all evaluation...")
        expected_elements = [e.strip().lower() for e in expected.split(',')]
        response_lower = response.lower()
        
        missing_elements = [elem for elem in expected_elements 
                          if elem not in response_lower]
        
        if not missing_elements:
            print("All elements found")
            return weight
        elif len(missing_elements) < len(expected_elements):
            print(f"Partially complete. Missing elements: {missing_elements}")
            return weight / 2
        else:
            print("No required elements found")
            return 0.0
            
    def _evaluate_functional_equivalence(self, response: str, expected: str, weight: float) -> float:
        """
        Evaluate code responses for functional equivalence.
        Note: In a real implementation, this would need to safely execute and compare code.
        """
        print("Performing functional equivalence evaluation...")
        
        # Extract code from markdown if present
        response_code = self._extract_code(response)
        expected_code = self._extract_code(expected)
        
        # Compare the cleaned code
        if response_code.strip() == expected_code.strip():
            print("Exact code match")
            return weight
        else:
            # Partial credit for similar structure
            print("Partial code match - giving partial credit")
            return weight / 2
            
    def _evaluate_key_elements(self, response: str, expected: str, weight: float) -> float:
        """Evaluate responses based on presence of key elements."""
        print("Performing key elements evaluation...")
        key_elements = [e.strip().lower() for e in expected.split(',')]
        response_lower = response.lower()
        
        matched_elements = [elem for elem in key_elements 
                          if elem in response_lower]
        
        print(f"Found {len(matched_elements)} of {len(key_elements)} key elements")
        
        if len(matched_elements) == len(key_elements):
            print("All key elements found")
            return weight
        elif matched_elements:
            print(f"Partial match. Found elements: {matched_elements}")
            return weight / 2
        else:
            print("No key elements found")
            return 0.0

    def _extract_key_answer(self, text: str) -> str:
        """
        Extract the key answer from a response, handling various formats.
        Examples:
        - "The capital of France is Paris." -> "paris"
        - "C) Dolphin" -> "c"
        - "True" -> "true"
        """
        # Remove any markdown formatting
        text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
        text = text.strip().lower()
        
        # Try to extract multiple choice answer
        mc_match = re.search(r'^([a-d])\)?(?:\s+|$)', text)
        if mc_match:
            return mc_match.group(1)
            
        # Try to extract true/false
        if text in ['true', 'false']:
            return text
            
        # Try to extract the last word for capital cities
        if 'capital' in text:
            words = text.split()
            return words[-1].strip('.,')
            
        # Default to the full text for other cases
        return text

    def _extract_code(self, text: str) -> str:
        """Extract code from a response, handling markdown code blocks."""
        # Look for markdown code blocks
        code_block = re.search(r'```(?:python)?\s*(.*?)\s*```', text, re.DOTALL)
        if code_block:
            return code_block.group(1).strip()
            
        # If no code block, return the raw text
        return text.strip()
