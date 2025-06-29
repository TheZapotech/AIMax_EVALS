#!/usr/bin/env python3
"""
Enhanced evaluation runner that uses an LLM to evaluate responses.
This script extends the functionality of eval_runner.py by using an LLM
to evaluate responses instead of rule-based evaluation.
"""

import os
import json
import asyncio
import argparse
import glob
from datetime import datetime, UTC
from typing import Dict, Any, List
from backend.evaluator import LLMEvaluator
from backend.storage import JsonHandler
from backend.llm import LLMFactory

class LLMEvaluationRunner:
    """
    Main class for running LLM evaluations with LLM-based evaluation.
    """
    
    def __init__(self, base_path: str):
        """
        Initialize the evaluation runner.
        
        Args:
            base_path (str): Base path for the evaluation system
        """
        self.base_path = base_path
        self.evaluator = LLMEvaluator(os.path.join(base_path, 'config.json'))
        self.storage = JsonHandler(base_path)
        
        # Load configuration
        config_path = os.path.join(base_path, 'config.json')
        with open(config_path, 'r') as f:
            self.config = json.load(f)
    
    def list_available_models(self) -> Dict[str, List[str]]:
        """
        List all available models from the configuration.
        
        Returns:
            Dict[str, List[str]]: Dictionary of providers and their models
        """
        available_models = {}
        for provider, config in self.config.items():
            if provider != "analyzer" and 'models' in config and config.get('api_key'):
                available_models[provider] = config['models']
        return available_models
    
    def list_test_suites(self) -> List[str]:
        """
        List all available test suites.
        
        Returns:
            List[str]: List of test suite filenames
        """
        return self.storage.list_test_suites()
        
    async def run_evaluation(
        self,
        test_suite_file: str,
        provider: str,
        model_name: str,
        verbose: bool = True
    ) -> str:
        """
        Run an evaluation using a test suite.
        
        Args:
            test_suite_file (str): Name of the test suite file
            provider (str): LLM provider name (e.g., "openai", "anthropic")
            model_name (str): Name of the model to use
            verbose (bool): Whether to print detailed progress
            
        Returns:
            str: Path to the results file
        """
        if verbose:
            print(f"\nStarting evaluation with test suite: {test_suite_file}")
            print(f"Provider: {provider}")
            print(f"Model: {model_name}")
            print(f"Using LLM-based evaluation with {self.config['analyzer']['provider']} {self.config['analyzer']['model']}\n")
        
        # Get API key from config
        api_key = self.config[provider]['api_key']
        if not api_key:
            raise ValueError(f"No API key found for provider: {provider}")
        
        # Initialize LLM connector
        llm = LLMFactory.create_connector(
            provider=provider,
            api_key=api_key,
            model=model_name
        )
        
        # Load test suite
        test_suite = self.storage.load_test_suite(test_suite_file)
        if verbose:
            print(f"Loaded test suite: {test_suite['test_suite_id']}")
            print(f"Number of test cases: {len(test_suite['test_cases'])}\n")
        
        # Initialize results
        results = {
            "evaluation_id": f"llm_eval_{datetime.now(UTC).strftime('%Y%m%d_%H%M%S')}",
            "timestamp": datetime.now(UTC).isoformat(),
            "provider": provider,
            "model": model_name,
            "analyzer": {
                "provider": self.config['analyzer']['provider'],
                "model": self.config['analyzer']['model']
            },
            "test_suite_id": test_suite["test_suite_id"],
            "results": [],
            "summary": {
                "total_tests": len(test_suite["test_cases"]),
                "total_score": 0.0,
                "max_possible_score": 0.0,
                "accuracy": 0.0,
                "total_tokens": 0,
                "total_response_time": 0.0,
                "analyzer_tokens": 0,
                "analyzer_response_time": 0.0
            }
        }
        
        # Process each test case
        for i, test_case in enumerate(test_suite["test_cases"], 1):
            if verbose:
                print(f"\nProcessing test case {i}/{len(test_suite['test_cases'])}")
                print(f"ID: {test_case['test_id']}")
                print(f"Type: {test_case['evaluation_type']}")
            else:
                print(f"Processing {i}/{len(test_suite['test_cases'])}: {test_case['test_id']}", end="\r")
            
            # Get model's response
            if verbose:
                print("Getting model response...")
            try:
                llm_response = await llm.get_response(test_case["prompt"])
                response = llm_response["content"]
                if verbose:
                    print(f"Response received in {llm_response['response_time']:.2f} seconds")
                    print(f"Tokens used: {llm_response.get('tokens', {}).get('total', 0)}")
            except Exception as e:
                print(f"Error getting model response: {str(e)}")
                response = "ERROR: Failed to get model response"
            
            # Evaluate response using LLM evaluator
            if verbose:
                print("Evaluating response with LLM...")
            evaluation = await self.evaluator.evaluate_response(response, test_case)
            
            # Add to results
            test_result = {
                "test_id": test_case["test_id"],
                "prompt": test_case["prompt"],
                "response": response,
                "expected": test_case["expected"],
                "evaluation": evaluation,
                "category": test_case.get("category", "general"),
                "difficulty": test_case.get("difficulty", "medium"),
                "llm_metrics": llm_response
            }
            
            results["results"].append(test_result)
            results["summary"]["total_score"] += evaluation["score"]
            results["summary"]["max_possible_score"] += evaluation["max_score"]
            results["summary"]["total_tokens"] += llm_response.get("tokens", {}).get("total", 0)
            results["summary"]["total_response_time"] += llm_response.get("response_time", 0)
            
            # Add analyzer metrics
            if "llm_evaluation" in evaluation:
                analyzer_tokens = evaluation["llm_evaluation"].get("tokens", {}).get("total", 0)
                analyzer_time = evaluation["llm_evaluation"].get("response_time", 0)
                results["summary"]["analyzer_tokens"] += analyzer_tokens
                results["summary"]["analyzer_response_time"] += analyzer_time
            
            # Print progress
            if verbose:
                print(f"Score: {evaluation['score']}/{evaluation['max_score']}")
                if "llm_evaluation" in evaluation:
                    print(f"LLM Evaluation: {evaluation['llm_evaluation'].get('explanation', '')}")
        
        # Calculate final accuracy
        if results["summary"]["max_possible_score"] > 0:
            results["summary"]["accuracy"] = (
                results["summary"]["total_score"] / 
                results["summary"]["max_possible_score"] * 100
            )
        
        # Add average metrics
        results["summary"]["average_response_time"] = (
            results["summary"]["total_response_time"] / 
            len(test_suite["test_cases"])
        )
        
        results["summary"]["average_analyzer_response_time"] = (
            results["summary"]["analyzer_response_time"] / 
            len(test_suite["test_cases"])
        )
        
        # Save results
        results_file = self.storage.save_evaluation_results(results, f"llm_eval_{model_name}")
        print(f"\nResults saved to: {results_file}")
        
        return results_file

async def main():
    """Main function for running evaluations with command-line arguments."""
    # Setup paths
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    # Initialize runner
    runner = LLMEvaluationRunner(base_path)
    
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Run LLM evaluations with LLM-based evaluation.')
    
    # Command to list available models and test suites
    parser.add_argument('--list', action='store_true', help='List available models and test suites')
    
    # Evaluation parameters
    parser.add_argument('--provider', type=str, help='LLM provider (e.g., openai, anthropic)')
    parser.add_argument('--model', type=str, help='Model name (e.g., gpt-3.5-turbo, claude-2)')
    parser.add_argument('--test-suite', type=str, help='Test suite file (e.g., sample_test_suite.json)')
    parser.add_argument('--all-models', action='store_true', help='Run evaluation with all available models')
    parser.add_argument('--quiet', action='store_true', help='Reduce output verbosity')
    
    args = parser.parse_args()
    
    # Print header
    print("\n=== LLM Evaluation System with LLM-based Evaluation ===")
    
    # List available models and test suites
    if args.list:
        print("\nAvailable Models:")
        available_models = runner.list_available_models()
        for provider, models in available_models.items():
            print(f"  {provider.capitalize()}:")
            for model in models:
                print(f"    - {model}")
        
        print("\nAvailable Test Suites:")
        test_suites = runner.list_test_suites()
        for test_suite in test_suites:
            print(f"  - {test_suite}")
            
        print("\nAnalyzer Configuration:")
        print(f"  Provider: {runner.config['analyzer']['provider']}")
        print(f"  Model: {runner.config['analyzer']['model']}")
        return
    
    # Run evaluations
    results_files = []
    
    # Run with specific provider and model
    if args.provider and args.model and args.test_suite:
        try:
            results_file = await runner.run_evaluation(
                test_suite_file=args.test_suite,
                provider=args.provider,
                model_name=args.model,
                verbose=not args.quiet
            )
            results_files.append(results_file)
        except Exception as e:
            print(f"Error evaluating {args.provider} {args.model}: {str(e)}")
    
    # Run with all models
    elif args.all_models and args.test_suite:
        available_models = runner.list_available_models()
        for provider, models in available_models.items():
            for model in models:
                try:
                    results_file = await runner.run_evaluation(
                        test_suite_file=args.test_suite,
                        provider=provider,
                        model_name=model,
                        verbose=not args.quiet
                    )
                    results_files.append(results_file)
                except Exception as e:
                    print(f"Error evaluating {provider} {model}: {str(e)}")
    
    # Run with default configuration
    elif not args.list:
        # Run OpenAI evaluations
        if runner.config.get('openai', {}).get('api_key'):
            for model in runner.config['openai']['models']:
                try:
                    results_file = await runner.run_evaluation(
                        test_suite_file="sample_test_suite.json",
                        provider="openai",
                        model_name=model,
                        verbose=not args.quiet
                    )
                    results_files.append(results_file)
                except Exception as e:
                    print(f"Error evaluating OpenAI {model}: {str(e)}")
        
        # Run Anthropic evaluations
        if runner.config.get('anthropic', {}).get('api_key'):
            for model in runner.config['anthropic']['models']:
                try:
                    results_file = await runner.run_evaluation(
                        test_suite_file="sample_test_suite.json",
                        provider="anthropic",
                        model_name=model,
                        verbose=not args.quiet
                    )
                    results_files.append(results_file)
                except Exception as e:
                    print(f"Error evaluating Anthropic {model}: {str(e)}")
    
    if not results_files:
        if not args.list:
            print("\nNo evaluations completed. Please check your arguments or configuration.")
            print("\nUsage examples:")
            print("  python llm_eval_runner.py --list")
            print("  python llm_eval_runner.py --provider openai --model gpt-3.5-turbo --test-suite sample_test_suite.json")
            print("  python llm_eval_runner.py --all-models --test-suite sample_test_suite.json")
        return
    
    # Print comparison of results
    print("\n=== Evaluation Results Comparison ===")
    for results_file in results_files:
        with open(results_file, 'r', encoding='utf-8') as f:
            results = json.load(f)
            print(f"\nProvider: {results['provider']}")
            print(f"Model: {results['model']}")
            print(f"Analyzer: {results['analyzer']['provider']} {results['analyzer']['model']}")
            print(f"Accuracy: {results['summary']['accuracy']:.2f}%")
            print(f"Total Tokens: {results['summary']['total_tokens']}")
            print(f"Analyzer Tokens: {results['summary']['analyzer_tokens']}")
            print(f"Average Response Time: {results['summary']['average_response_time']:.2f}s")
            print(f"Average Analyzer Time: {results['summary']['average_analyzer_response_time']:.2f}s")
    
    print("\nEvaluation complete!")
    
    # Update frontend file list automatically
    update_frontend_file_list()

def update_frontend_file_list():
    """Update the frontend file list after evaluation completion."""
    try:
        # Path to the evaluations directory
        evaluations_dir = "frontend/public/results/evaluations"
        api_file = "frontend/public/api/evaluations/list.json"
        
        # Create directories if they don't exist
        os.makedirs("frontend/public/api/evaluations", exist_ok=True)
        
        # Find all JSON evaluation files
        if os.path.exists(evaluations_dir):
            pattern = os.path.join(evaluations_dir, "evaluation_report_*.json")
            files = glob.glob(pattern)
            # Extract just the filenames
            filenames = [os.path.basename(f) for f in files]
            filenames.sort(reverse=True)  # Most recent first
        else:
            filenames = []
        
        # Update the list file
        file_list = {
            "files": filenames,
            "count": len(filenames),
            "last_updated": datetime.now(UTC).isoformat()
        }
        
        with open(api_file, 'w') as f:
            json.dump(file_list, f, indent=2)
        
        print(f"✓ Updated frontend file list with {len(filenames)} evaluation files")
        
    except Exception as e:
        print(f"Warning: Failed to update frontend file list: {e}")

if __name__ == "__main__":
    asyncio.run(main())
