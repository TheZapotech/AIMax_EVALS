// Simple data proxy to serve evaluation JSON files
// This file simulates an API endpoint for development

async function loadEvaluationFiles() {
  // Get list of all evaluation files from the directory
  const evaluations = [];
  const baseUrl = '../results/evaluations/';
  
  // List of known evaluation files (you can expand this dynamically if needed)
  const knownFiles = [
    'evaluation_report_gpt-3.5-turbo_20250629_181501.json',
    'evaluation_report_gpt-4o-mini_20250629_181519.json',
    'evaluation_report_llm_eval_gpt-3.5-turbo_20250629_175853.json',
    'evaluation_report_llm_eval_gpt-4.1_20250629_184621.json',
    'evaluation_report_llm_eval_gpt-4o-mini_20250629_175924.json',
    'evaluation_report_llm_eval_gpt-4o-mini_20250629_184329.json'
  ];
  
  for (const filename of knownFiles) {
    try {
      const response = await fetch(baseUrl + filename);
      if (response.ok) {
        const data = await response.json();
        evaluations.push(data);
      }
    } catch (error) {
      console.warn(`Failed to load ${filename}:`, error);
    }
  }
  
  return evaluations;
}

// Export the data for the frontend to consume
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { loadEvaluationFiles };
} else {
  window.evaluationAPI = { loadEvaluationFiles };
}