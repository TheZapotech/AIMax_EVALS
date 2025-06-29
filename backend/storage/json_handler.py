import json
import os
from typing import Dict, List, Any, Optional
from datetime import datetime, UTC

class JsonHandler:
    """
    Handles reading and writing JSON files for test cases and evaluation results.
    """
    
    def __init__(self, base_path: str):
        """
        Initialize the JSON handler with base path for storage.
        
        Args:
            base_path (str): Base path for storing JSON files
        """
        self.base_path = base_path
        self.test_cases_dir = os.path.join(base_path, 'test_cases')
        # Save results to frontend/public for easy access by the dashboard
        self.results_dir = os.path.join(base_path, 'frontend', 'public', 'results', 'evaluations')
        
        # Ensure directories exist
        os.makedirs(self.test_cases_dir, exist_ok=True)
        os.makedirs(self.results_dir, exist_ok=True)
        print(f"Storage initialized at: {base_path}")
    
    def load_test_suite(self, filename: str) -> Dict[str, Any]:
        """
        Load a test suite from a JSON file.
        
        Args:
            filename (str): Name of the test suite file
            
        Returns:
            dict: Test suite data
        """
        filepath = os.path.join(self.test_cases_dir, filename)
        print(f"Loading test suite from: {filepath}")
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                print(f"Successfully loaded test suite: {data.get('test_suite_id', 'unknown')}")
                return data
        except FileNotFoundError:
            error_msg = f"Test suite file not found: {filepath}"
            print(f"Error: {error_msg}")
            raise FileNotFoundError(error_msg)
        except json.JSONDecodeError as e:
            error_msg = f"Invalid JSON in test suite file: {filepath}\nError: {str(e)}"
            print(f"Error: {error_msg}")
            raise ValueError(error_msg)
    
    def save_evaluation_results(self, results: Dict[str, Any], model_name: str) -> str:
        """
        Save evaluation results to a JSON file.
        
        Args:
            results (dict): Evaluation results to save
            model_name (str): Name of the model being evaluated
            
        Returns:
            str: Path to the saved results file
        """
        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        filename = f"evaluation_report_{model_name}_{timestamp}.json"
        filepath = os.path.join(self.results_dir, filename)
        
        print(f"Saving evaluation results to: {filepath}")
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            print("Results saved successfully")
            return filepath
        except Exception as e:
            error_msg = f"Error saving results to {filepath}: {str(e)}"
            print(f"Error: {error_msg}")
            raise
    
    def load_evaluation_results(self, filename: str) -> Dict[str, Any]:
        """
        Load evaluation results from a JSON file.
        
        Args:
            filename (str): Name of the results file
            
        Returns:
            dict: Evaluation results data
        """
        filepath = os.path.join(self.results_dir, filename)
        print(f"Loading evaluation results from: {filepath}")
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                print("Results loaded successfully")
                return data
        except FileNotFoundError:
            error_msg = f"Results file not found: {filepath}"
            print(f"Error: {error_msg}")
            raise FileNotFoundError(error_msg)
        except json.JSONDecodeError as e:
            error_msg = f"Invalid JSON in results file: {filepath}\nError: {str(e)}"
            print(f"Error: {error_msg}")
            raise ValueError(error_msg)
    
    def update_evaluation_results(self, filename: str, updates: Dict[str, Any]) -> None:
        """
        Update existing evaluation results with new data.
        
        Args:
            filename (str): Name of the results file
            updates (dict): Updates to apply to the results
        """
        filepath = os.path.join(self.results_dir, filename)
        print(f"Updating evaluation results in: {filepath}")
        
        try:
            # Load existing results
            with open(filepath, 'r', encoding='utf-8') as f:
                results = json.load(f)
            
            # Apply updates
            results.update(updates)
            results['last_modified'] = datetime.now(UTC).isoformat()
            
            # Save updated results
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            print("Results updated successfully")
                
        except FileNotFoundError:
            error_msg = f"Results file not found: {filepath}"
            print(f"Error: {error_msg}")
            raise FileNotFoundError(error_msg)
        except Exception as e:
            error_msg = f"Error updating results: {str(e)}"
            print(f"Error: {error_msg}")
            raise
    
    def list_test_suites(self) -> List[str]:
        """
        List all available test suite files.
        
        Returns:
            list: Names of available test suite files
        """
        files = [f for f in os.listdir(self.test_cases_dir) 
                if f.endswith('.json')]
        print(f"Found {len(files)} test suite(s)")
        return files
    
    def list_evaluation_results(self) -> List[str]:
        """
        List all available evaluation result files.
        
        Returns:
            list: Names of available result files
        """
        files = [f for f in os.listdir(self.results_dir) 
                if f.endswith('.json')]
        print(f"Found {len(files)} evaluation result(s)")
        return files
    
    def validate_test_suite(self, test_suite: Dict[str, Any]) -> Optional[str]:
        """
        Validate a test suite structure.
        
        Args:
            test_suite (dict): Test suite to validate
            
        Returns:
            Optional[str]: Error message if invalid, None if valid
        """
        print("Validating test suite structure...")
        
        if not isinstance(test_suite, dict):
            return "Test suite must be a dictionary"
            
        if 'test_suite_id' not in test_suite:
            return "Test suite must have a test_suite_id"
            
        if 'test_cases' not in test_suite or not isinstance(test_suite['test_cases'], list):
            return "Test suite must have a test_cases list"
            
        for i, test_case in enumerate(test_suite['test_cases'], 1):
            if not isinstance(test_case, dict):
                return f"Test case {i} must be a dictionary"
                
            required_fields = ['test_id', 'prompt', 'expected', 'evaluation_type']
            missing_fields = [f for f in required_fields if f not in test_case]
            
            if missing_fields:
                return f"Test case {i} missing required fields: {', '.join(missing_fields)}"
        
        print("Test suite validation successful")
        return None  # Test suite is valid