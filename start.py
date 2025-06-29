#!/usr/bin/env python3
"""
Simple starter script for running evaluation batches.
This provides a raw, straightforward way to run different types of evaluations
without complex command-line arguments.
"""

import os
import subprocess
import sys
from datetime import datetime

def print_header():
    """Print the application header."""
    print("=" * 60)
    print("AI Cookbook Evals - Batch Evaluation Starter")
    print("=" * 60)
    print()

def print_menu():
    """Print the main menu options."""
    print("Choose an evaluation type:")
    print()
    print("RULE-BASED EVALUATIONS:")
    print("  1. Quick rule-based eval (all models)")
    print("  2. Rule-based eval with specific model")
    print("  3. Rule-based eval with custom test suite")
    print()
    print("LLM-BASED EVALUATIONS (Recommended):")
    print("  4. Quick LLM eval (all models)")
    print("  5. LLM eval with specific model")
    print("  6. LLM eval with custom test suite")
    print()
    print("UTILITIES:")
    print("  7. List available models and test suites")
    print("  8. Run diagnostic tools")
    print("  9. Compare two models (LLM-based)")
    print()
    print("  0. Exit")
    print()

def run_command(cmd):
    """Run a command and handle errors."""
    print(f"Running: {' '.join(cmd)}")
    print("-" * 40)
    try:
        result = subprocess.run(cmd, check=True, text=True)
        print("-" * 40)
        print("✅ Command completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print("-" * 40)
        print(f"❌ Command failed with exit code {e.returncode}")
        return False
    except FileNotFoundError:
        print("❌ Command not found. Make sure you're in the correct directory.")
        return False

def get_user_input(prompt, options=None):
    """Get user input with validation."""
    while True:
        try:
            value = input(prompt).strip()
            if not value:
                continue
            if options and value not in options:
                print(f"Please choose from: {', '.join(options)}")
                continue
            return value
        except KeyboardInterrupt:
            print("\n\nExiting...")
            sys.exit(0)

def rule_based_evaluations():
    """Handle rule-based evaluation options."""
    print("\n--- Rule-Based Evaluations ---")
    
    choice = get_user_input(
        "Choose:\n"
        "  a. All models with default test suite\n"
        "  b. Specific model\n"
        "  c. Custom test suite\n"
        "Choice (a/b/c): ",
        ['a', 'b', 'c']
    )
    
    if choice == 'a':
        cmd = ["python", "eval_runner.py", "--all-models"]
    elif choice == 'b':
        provider = get_user_input("Provider (openai/anthropic): ", ['openai', 'anthropic'])
        model = get_user_input("Model name (e.g., gpt-3.5-turbo): ")
        cmd = ["python", "eval_runner.py", "--provider", provider, "--model", model]
    else:  # choice == 'c'
        test_suite = get_user_input("Test suite filename (e.g., sample_test_suite.json): ")
        cmd = ["python", "eval_runner.py", "--test-suite", test_suite]
        
        # Optional: add specific model
        add_model = get_user_input("Use specific model? (y/n): ", ['y', 'n', 'yes', 'no'])
        if add_model.lower() in ['y', 'yes']:
            provider = get_user_input("Provider (openai/anthropic): ", ['openai', 'anthropic'])
            model = get_user_input("Model name: ")
            cmd.extend(["--provider", provider, "--model", model])
    
    return run_command(cmd)

def llm_based_evaluations():
    """Handle LLM-based evaluation options."""
    print("\n--- LLM-Based Evaluations ---")
    
    choice = get_user_input(
        "Choose:\n"
        "  a. All models with default test suite\n"
        "  b. Specific model\n"
        "  c. Custom test suite\n"
        "Choice (a/b/c): ",
        ['a', 'b', 'c']
    )
    
    if choice == 'a':
        cmd = ["python", "llm_eval_runner.py", "--all-models"]
    elif choice == 'b':
        provider = get_user_input("Provider (openai/anthropic): ", ['openai', 'anthropic'])
        model = get_user_input("Model name (e.g., gpt-3.5-turbo): ")
        cmd = ["python", "llm_eval_runner.py", "--provider", provider, "--model", model]
    else:  # choice == 'c'
        test_suite = get_user_input("Test suite filename (e.g., sample_test_suite.json): ")
        cmd = ["python", "llm_eval_runner.py", "--test-suite", test_suite]
        
        # Optional: add specific model
        add_model = get_user_input("Use specific model? (y/n): ", ['y', 'n', 'yes', 'no'])
        if add_model.lower() in ['y', 'yes']:
            provider = get_user_input("Provider (openai/anthropic): ", ['openai', 'anthropic'])
            model = get_user_input("Model name: ")
            cmd.extend(["--provider", provider, "--model", model])
    
    # Optional: quiet mode
    quiet = get_user_input("Use quiet mode? (y/n): ", ['y', 'n', 'yes', 'no'])
    if quiet.lower() in ['y', 'yes']:
        cmd.append("--quiet")
    
    return run_command(cmd)

def compare_models():
    """Compare two models using LLM-based evaluation."""
    print("\n--- Model Comparison ---")
    
    print("First model:")
    provider1 = get_user_input("Provider (openai/anthropic): ", ['openai', 'anthropic'])
    model1 = get_user_input("Model name: ")
    
    print("\nSecond model:")
    provider2 = get_user_input("Provider (openai/anthropic): ", ['openai', 'anthropic'])
    model2 = get_user_input("Model name: ")
    
    test_suite = get_user_input("Test suite (or press Enter for default): ")
    
    print(f"\nRunning comparison between {model1} and {model2}...")
    
    # Run first model
    cmd1 = ["python", "llm_eval_runner.py", "--provider", provider1, "--model", model1]
    if test_suite:
        cmd1.extend(["--test-suite", test_suite])
    
    print(f"\n--- Evaluating {model1} ---")
    success1 = run_command(cmd1)
    
    if success1:
        # Run second model
        cmd2 = ["python", "llm_eval_runner.py", "--provider", provider2, "--model", model2]
        if test_suite:
            cmd2.extend(["--test-suite", test_suite])
        
        print(f"\n--- Evaluating {model2} ---")
        success2 = run_command(cmd2)
        
        if success2:
            print(f"\n✅ Comparison complete! Check results/evaluations/ for detailed results.")
            return True
    
    return False

def main():
    """Main application loop."""
    print_header()
    
    # Check if we're in the right directory
    if not os.path.exists('config.json'):
        print("❌ Error: config.json not found!")
        print("Make sure you're running this script from the project root directory.")
        print("Also ensure you've copied docs/config.json.template to config.json")
        sys.exit(1)
    
    while True:
        print_menu()
        
        choice = get_user_input("Enter your choice (0-9): ")
        
        print()
        
        if choice == '0':
            print("Goodbye! 👋")
            break
            
        elif choice == '1':
            print("🚀 Starting quick rule-based evaluation...")
            run_command(["python", "eval_runner.py", "--all-models"])
            
        elif choice == '2':
            rule_based_evaluations()
            
        elif choice == '3':
            rule_based_evaluations()
            
        elif choice == '4':
            print("🚀 Starting quick LLM-based evaluation...")
            run_command(["python", "llm_eval_runner.py", "--all-models"])
            
        elif choice == '5':
            llm_based_evaluations()
            
        elif choice == '6':
            llm_based_evaluations()
            
        elif choice == '7':
            print("📋 Listing available options...")
            print("\n--- Rule-based evaluation options ---")
            run_command(["python", "eval_runner.py", "--list"])
            print("\n--- LLM-based evaluation options ---")
            run_command(["python", "llm_eval_runner.py", "--list"])
            
        elif choice == '8':
            print("🔧 Running diagnostic tools...")
            if os.path.exists('diagnose_llm_evaluator.sh'):
                run_command(["./diagnose_llm_evaluator.sh"])
            else:
                print("Running individual diagnostic tools...")
                run_command(["python", "check_openai_api.py"])
                
        elif choice == '9':
            compare_models()
            
        else:
            print("❌ Invalid choice. Please try again.")
        
        print("\n" + "=" * 60)
        input("Press Enter to continue...")
        print()

if __name__ == "__main__":
    main()