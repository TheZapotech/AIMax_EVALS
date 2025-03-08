import os
import json
import re  # Added missing import for regex
from typing import Dict, Any, Optional
from datetime import datetime, UTC
import asyncio
import traceback  # Added for better error reporting

from .evaluator import Evaluator
from backend.llm import LLMFactory

class LLMEvaluator(Evaluator):
    """
    Enhanced evaluator that uses an LLM to check answers.
    This evaluator extends the base Evaluator class and overrides the evaluation
    methods to use an LLM for answer checking.
    """
    
    def __init__(self, config_path: str = None):
        """
        Initialize the LLM evaluator.
        
        Args:
            config_path (str, optional): Path to the config file
        """
        super().__init__()
        print("LLM Evaluator initialized")
        
        # Load configuration
        if config_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            config_path = os.path.join(base_dir, 'config.json')
            
        with open(config_path, 'r') as f:
            self.config = json.load(f)
            
        # Validate analyzer configuration
        if 'analyzer' not in self.config:
            raise ValueError("Analyzer configuration not found in config.json")
            
        analyzer_config = self.config['analyzer']
        if 'provider' not in analyzer_config or 'model' not in analyzer_config:
            raise ValueError("Analyzer configuration must include provider and model")
            
        # Initialize analyzer LLM connector
        self.analyzer_provider = analyzer_config['provider']
        self.analyzer_model = analyzer_config['model']
        self.system_prompt = analyzer_config.get('system_prompt', 
            "You are an expert evaluator tasked with determining if a response correctly answers a given question. "
            "Evaluate the response objectively and provide a clear yes/no judgment with a brief explanation."
        )
        
        # Get API key from config
        self.api_key = self.config[self.analyzer_provider]['api_key']
        if not self.api_key:
            raise ValueError(f"No API key found for provider: {self.analyzer_provider}")
            
        print(f"Using {self.analyzer_provider} {self.analyzer_model} as analyzer")
        
    async def evaluate_response(self, response: str, test_case: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate an LLM response against a test case using an LLM analyzer.
        
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
        
        # Prepare hint for LLM evaluation
        hint = test_case.get('evaluation_hint', None)
        hint_text = f"HINT: {hint}\n" if hint else ""
        
        # Use LLM to evaluate the response
        print("Using LLM to evaluate response...")
        llm_evaluation = await self._evaluate_with_llm(
            prompt=test_case['prompt'],
            expected=test_case.get('expected', ''),
            response=response,
            evaluation_type=evaluation_type,
            hint=hint_text  # Pass the hint to the LLM evaluation
        )
        
        # Calculate score based on LLM evaluation
        score = weight if llm_evaluation['correct'] else 0.0
        if llm_evaluation.get('partial', False):
            score = weight / 2
            
        print(f"LLM evaluation result: {'Correct' if llm_evaluation['correct'] else 'Incorrect'}")
        print(f"Score: {score}/{weight}")
        print("----------------------------------------------")
        
        return {
            'score': score,
            'max_score': weight,
            'evaluation_type': evaluation_type,
            'llm_evaluation': llm_evaluation,
            'timestamp': datetime.now(UTC).isoformat()
        }
    
    async def _evaluate_with_llm(
        self, 
        prompt: str, 
        expected: str, 
        response: str, 
        evaluation_type: str,
        hint: str = "" 
    ) -> Dict[str, Any]:
        """
        Use an LLM to evaluate if a response is correct.
        
        Args:
            prompt (str): The original prompt/question
            expected (str): The expected answer
            response (str): The actual response to evaluate
            evaluation_type (str): Type of evaluation
            hint (str): Additional hint for evaluation
        Returns:
            dict: Evaluation results from the LLM
        """
        # Create LLM connector
        try:
            llm = LLMFactory.create_connector(
                provider=self.analyzer_provider,
                api_key=self.api_key,
                model=self.analyzer_model
            )
            
            # Construct evaluation prompt based on evaluation type
            evaluation_prompt = self._construct_evaluation_prompt(
                prompt=prompt,
                expected=expected,
                response=response,
                evaluation_type=evaluation_type
            )
            # Include the hint in the evaluation prompt
            if hint:
                evaluation_prompt = f"{hint}\n{evaluation_prompt}"
            # Get LLM evaluation
            try:
                start_time = datetime.now(UTC)
                
                # For OpenAI, include system prompt
                if self.analyzer_provider == "openai":
                    messages = [
                        {"role": "system", "content": self.system_prompt},
                        {"role": "user", "content": evaluation_prompt}
                    ]
                    print(f"Sending evaluation to OpenAI {self.analyzer_model}...")
                    llm_response = await self._get_openai_response(llm, messages)
                else:
                    # For other providers
                    print(f"Sending evaluation to {self.analyzer_provider} {self.analyzer_model}...")
                    llm_response = await llm.get_response(evaluation_prompt)
                    
                end_time = datetime.now(UTC)
                response_time = (end_time - start_time).total_seconds()
                
                # Parse LLM response to determine correctness
                print(f"Received response from analyzer. Parsing result...")
                evaluation_result = self._parse_evaluation_response(llm_response["content"])
                
                return {
                    "correct": evaluation_result["correct"],
                    "partial": evaluation_result.get("partial", False),
                    "explanation": evaluation_result["explanation"],
                    "raw_response": llm_response["content"],
                    "response_time": response_time,
                    "tokens": llm_response.get("tokens", {})
                }
                
            except Exception as e:
                print(f"Error during LLM evaluation: {str(e)}")
                print(f"Error details: {traceback.format_exc()}")
                # Fallback to traditional evaluation
                print("Falling back to traditional evaluation...")
                base_score = self._calculate_base_score(
                    response=response,
                    expected=expected,
                    eval_type=evaluation_type,
                    weight=1.0  # We'll normalize later
                )
                
                return {
                    "correct": base_score > 0,
                    "partial": 0 < base_score < 1,
                    "explanation": f"Fallback to traditional evaluation due to LLM error: {str(e)}",
                    "raw_response": traceback.format_exc(),
                    "response_time": 0,
                    "tokens": {}
                }
        except Exception as e:
            print(f"Error creating LLM connector: {str(e)}")
            print(f"Error details: {traceback.format_exc()}")
            # Fallback to traditional evaluation
            print("Falling back to traditional evaluation...")
            base_score = self._calculate_base_score(
                response=response,
                expected=expected,
                eval_type=evaluation_type,
                weight=1.0  # We'll normalize later
            )
            
            return {
                "correct": base_score > 0,
                "partial": 0 < base_score < 1,
                "explanation": f"Fallback to traditional evaluation due to connector error: {str(e)}",
                "raw_response": traceback.format_exc(),
                "response_time": 0,
                "tokens": {}
            }
    
    async def _get_openai_response(self, llm, messages):
        """Get response from OpenAI with messages format."""
        try:
            start_time = datetime.now(UTC)
            
            response = llm.client.chat.completions.create(
                model=llm.model,
                messages=messages,
                temperature=0.3
            )
            
            end_time = datetime.now(UTC)
            response_time = (end_time - start_time).total_seconds()
            
            return {
                "content": response.choices[0].message.content,
                "model": llm.model,
                "tokens": {
                    "prompt": response.usage.prompt_tokens,
                    "completion": response.usage.completion_tokens,
                    "total": response.usage.total_tokens
                },
                "response_time": response_time,
                "timestamp": end_time.isoformat()
            }
            
        except Exception as e:
            print(f"Error getting OpenAI response: {str(e)}")
            print(f"Error details: {traceback.format_exc()}")
            raise
    
    def _construct_evaluation_prompt(
        self, 
        prompt: str, 
        expected: str, 
        response: str, 
        evaluation_type: str
    ) -> str:
        """
        Construct a prompt for the LLM to evaluate a response.
        
        Args:
            prompt (str): The original prompt/question
            expected (str): The expected answer
            response (str): The actual response to evaluate
            evaluation_type (str): Type of evaluation
            
        Returns:
            str: Evaluation prompt for the LLM
        """
        # Base evaluation prompt
        evaluation_prompt = f"""
I need you to evaluate if the following response correctly answers the question.

QUESTION:
{prompt}

EXPECTED ANSWER:
{expected}

ACTUAL RESPONSE:
{response}

EVALUATION TYPE: {evaluation_type}

Based on the evaluation type "{evaluation_type}", determine if the response is:
1. Correct (full credit)
2. Partially correct (half credit)
3. Incorrect (no credit)

Provide your evaluation in the following format:
CORRECT: [Yes/No/Partial]
EXPLANATION: [Brief explanation of your evaluation]
"""

        # Add specific instructions based on evaluation type
        if evaluation_type == "exact_match":
            evaluation_prompt += """
For exact_match evaluation:
- The response should match the expected answer exactly (ignoring case and minor formatting)
- For multiple choice, only the letter (A, B, C, D) or the full correct option is acceptable
- For true/false questions, only "true" or "false" (or clear variations) are acceptable
"""
        elif evaluation_type == "contains_all":
            evaluation_prompt += """
For contains_all evaluation:
- The response should contain all the elements listed in the expected answer
- Give partial credit if some but not all elements are present
- The order of elements doesn't matter
"""
        elif evaluation_type == "functional_equivalence":
            evaluation_prompt += """
For functional_equivalence evaluation:
- Determine if the code in the response is functionally equivalent to the expected code
- The code should produce the same outputs for the same inputs
- Give partial credit if the code is close but has minor issues
"""
        elif evaluation_type == "key_elements":
            evaluation_prompt += """
For key_elements evaluation:
- Check if the response includes the key concepts/elements from the expected answer
- Give partial credit if some but not all key elements are present
- The response doesn't need to match exactly, but should demonstrate understanding of the key concepts
"""

        return evaluation_prompt
    
    def _parse_evaluation_response(self, response: str) -> Dict[str, Any]:
        """
        Parse the LLM's evaluation response to determine correctness.
        
        Args:
            response (str): The LLM's evaluation response
            
        Returns:
            dict: Parsed evaluation result
        """
        # Default values
        result = {
            "correct": False,
            "partial": False,
            "explanation": "Unable to determine correctness from LLM response"
        }
        
        try:
            # Look for correctness indicator
            correct_match = re.search(r"CORRECT:\s*(\w+)", response, re.IGNORECASE)
            if correct_match:
                correctness = correct_match.group(1).lower()
                if correctness in ["yes", "true", "correct"]:
                    result["correct"] = True
                    result["partial"] = False
                elif correctness in ["partial", "partially"]:
                    result["correct"] = False
                    result["partial"] = True
            
            # Look for explanation
            explanation_match = re.search(r"EXPLANATION:\s*(.*?)(?:\n\n|$)", response, re.IGNORECASE | re.DOTALL)
            if explanation_match:
                result["explanation"] = explanation_match.group(1).strip()
            
            return result
        except Exception as e:
            print(f"Error parsing evaluation response: {str(e)}")
            print(f"Response content: {response}")
            print(f"Error details: {traceback.format_exc()}")
            return result