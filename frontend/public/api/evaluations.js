// Simple data proxy to serve evaluation JSON files
// This file simulates an API endpoint for development

async function loadEvaluationFiles() {
  const evaluationFiles = [
    '../results/evaluations/evaluation_report_llm_eval_gpt-3.5-turbo_20250629_175853.json',
    '../results/evaluations/evaluation_report_llm_eval_gpt-4o-mini_20250629_175924.json',
    '../results/evaluations/evaluation_report_gpt-3.5-turbo_20250629_181501.json',
    '../results/evaluations/evaluation_report_gpt-4o-mini_20250629_181519.json'
  ];

  const evaluations = [];
  
  for (const file of evaluationFiles) {
    try {
      const response = await fetch(file);
      if (response.ok) {
        const data = await response.json();
        evaluations.push(data);
      }
    } catch (error) {
      console.warn(`Failed to load ${file}:`, error);
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