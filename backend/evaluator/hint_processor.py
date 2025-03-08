import re
from typing import Dict, List, Union, Optional
from datetime import datetime, UTC

class HintProcessor:
    """
    Processes evaluation hints for LLM responses.
    Supports different types of hints like word matching, regex patterns, etc.
    """
    
    @staticmethod
    def process_hint(response: str, hint: Dict[str, any]) -> Dict[str, any]:
        """
        Process a hint against a response.
        
        Args:
            response (str): The LLM's response
            hint (dict): The hint configuration
            
        Returns:
            dict: Result of hint processing with passed status and details
        """
        hint_type = hint.get('type')
        print(f"\nProcessing hint of type: {hint_type}")
        
        if hint_type == 'contains_word':
            return HintProcessor._process_contains_word(response, hint)
        elif hint_type == 'contains_all_words':
            return HintProcessor._process_contains_all_words(response, hint)
        elif hint_type == 'regex_match':
            return HintProcessor._process_regex_match(response, hint)
        elif hint_type == 'code_output':
            return HintProcessor._process_code_output(response, hint)
        else:
            print(f"Warning: Unknown hint type: {hint_type}")
            return {
                'passed': False,
                'details': f'Unknown hint type: {hint_type}',
                'timestamp': datetime.now(UTC).isoformat()
            }

    @staticmethod
    def _process_contains_word(response: str, hint: Dict[str, any]) -> Dict[str, any]:
        """Process a contains_word hint."""
        print("Processing contains_word hint")
        word = hint.get('value', '')
        case_sensitive = hint.get('case_sensitive', False)
        
        print(f"Looking for word: '{word}'")
        print(f"Case sensitive: {case_sensitive}")
        
        # Clean response text
        response = HintProcessor._clean_text(response)
        
        if not case_sensitive:
            response = response.lower()
            word = word.lower()
            
        passed = word in response
        
        result = {
            'passed': passed,
            'details': f"Response {'contains' if passed else 'does not contain'} required word '{word}'",
            'timestamp': datetime.now(UTC).isoformat()
        }
        print(f"Result: {result['details']}")
        return result

    @staticmethod
    def _process_contains_all_words(response: str, hint: Dict[str, any]) -> Dict[str, any]:
        """Process a contains_all_words hint."""
        print("Processing contains_all_words hint")
        words = hint.get('values', [])
        case_sensitive = hint.get('case_sensitive', False)
        
        print(f"Looking for words: {words}")
        print(f"Case sensitive: {case_sensitive}")
        
        # Clean response text
        response = HintProcessor._clean_text(response)
        
        if not case_sensitive:
            response = response.lower()
            words = [word.lower() for word in words]
            
        missing_words = [word for word in words if word not in response]
        passed = len(missing_words) == 0
        
        result = {
            'passed': passed,
            'details': f"All required words found" if passed else f"Missing words: {', '.join(missing_words)}",
            'missing_words': missing_words,
            'timestamp': datetime.now(UTC).isoformat()
        }
        print(f"Result: {result['details']}")
        return result

    @staticmethod
    def _process_regex_match(response: str, hint: Dict[str, any]) -> Dict[str, any]:
        """Process a regex_match hint."""
        print("Processing regex_match hint")
        pattern = hint.get('pattern', '')
        description = hint.get('description', 'Match regex pattern')
        
        print(f"Pattern: {pattern}")
        print(f"Description: {description}")
        
        # Clean response text
        response = HintProcessor._clean_text(response)
        
        try:
            # Special handling for email validation
            if description.lower().find('email') >= 0:
                pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            
            matches = re.findall(pattern, response)
            passed = len(matches) > 0
            
            result = {
                'passed': passed,
                'details': f"Found matches: {matches}" if passed else "No regex matches found",
                'matches': matches,
                'timestamp': datetime.now(UTC).isoformat()
            }
            print(f"Result: {result['details']}")
            return result
            
        except re.error as e:
            error_msg = f"Invalid regex pattern: {str(e)}"
            print(f"Error: {error_msg}")
            return {
                'passed': False,
                'details': error_msg,
                'timestamp': datetime.now(UTC).isoformat()
            }

    @staticmethod
    def _process_code_output(response: str, hint: Dict[str, any]) -> Dict[str, any]:
        """Process a code_output hint."""
        print("Processing code_output hint")
        test_cases = hint.get('test_cases', [])
        print(f"Number of test cases: {len(test_cases)}")
        
        # Extract code from response
        code_match = re.search(r'```(?:python)?\s*(.*?)\s*```', response, re.DOTALL)
        if code_match:
            code = code_match.group(1).strip()
        else:
            code = response.strip()
        
        # For now, we'll just check if the code contains basic Python syntax
        # In a real implementation, this would safely execute the code
        basic_syntax = [
            'def', 'return', 'if', 'else', 'for', 'while',
            '(', ')', ':', '=', '==', '+', '-', '*', '/'
        ]
        
        found_syntax = [syn for syn in basic_syntax if syn in code]
        passed = len(found_syntax) > 0
        
        result = {
            'passed': passed,
            'details': f"Code contains basic Python syntax: {found_syntax}" if passed else "No basic Python syntax found",
            'timestamp': datetime.now(UTC).isoformat()
        }
        print(f"Result: {result['details']}")
        return result

    @staticmethod
    def _clean_text(text: str) -> str:
        """Clean text by removing markdown and extra whitespace."""
        # Remove markdown code blocks
        text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
        # Remove markdown inline code
        text = re.sub(r'`.*?`', '', text)
        # Normalize whitespace
        text = ' '.join(text.split())
        return text.strip()

    @staticmethod
    def validate_hint(hint: Dict[str, any]) -> Optional[str]:
        """
        Validate a hint configuration.
        
        Args:
            hint (dict): The hint configuration to validate
            
        Returns:
            Optional[str]: Error message if invalid, None if valid
        """
        print("\nValidating hint configuration...")
        
        if not isinstance(hint, dict):
            return "Hint must be a dictionary"
            
        if 'type' not in hint:
            return "Hint must specify a 'type'"
            
        hint_type = hint['type']
        print(f"Hint type: {hint_type}")
        
        if hint_type == 'contains_word':
            if 'value' not in hint:
                return "contains_word hint must specify a 'value'"
                
        elif hint_type == 'contains_all_words':
            if 'values' not in hint or not isinstance(hint['values'], list):
                return "contains_all_words hint must specify a 'values' list"
                
        elif hint_type == 'regex_match':
            if 'pattern' not in hint:
                return "regex_match hint must specify a 'pattern'"
                
        elif hint_type == 'code_output':
            if 'test_cases' not in hint or not isinstance(hint['test_cases'], list):
                return "code_output hint must specify a 'test_cases' list"
                
        print("Hint validation successful")
        return None  # Hint is valid
