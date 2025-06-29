#!/usr/bin/env python3
"""
Script to update the file list for the frontend to discover evaluation results dynamically.
Run this after generating new evaluation reports.
"""

import os
import json
import glob

def update_file_list():
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
        "last_updated": "auto-generated"
    }
    
    with open(api_file, 'w') as f:
        json.dump(file_list, f, indent=2)
    
    print(f"Updated file list with {len(filenames)} evaluation files:")
    for filename in filenames:
        print(f"  - {filename}")

if __name__ == "__main__":
    update_file_list()