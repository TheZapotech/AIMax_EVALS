import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { EvaluationResult, TestResult } from '../types/evaluation';

interface EvaluationDetailProps {
  evaluation: EvaluationResult;
  onBack: () => void;
}

const EvaluationDetail: React.FC<EvaluationDetailProps> = ({ evaluation, onBack }) => {
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

  const toggleTestExpansion = (testId: string) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testId)) {
      newExpanded.delete(testId);
    } else {
      newExpanded.add(testId);
    }
    setExpandedTests(newExpanded);
  };

  const getStatusColor = (score: number, maxScore: number) => {
    if (score === maxScore) return 'bg-green-100 text-green-800';
    if (score > 0) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusText = (score: number, maxScore: number) => {
    if (score === maxScore) return 'Correct';
    if (score > 0) return 'Partial';
    return 'Incorrect';
  };

  const TestRow: React.FC<{ test: TestResult }> = ({ test }) => {
    const isExpanded = expandedTests.has(test.test_id);
    
    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <div
          className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleTestExpansion(test.test_id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-gray-900">{test.test_id}</div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getStatusColor(test.evaluation.score, test.evaluation.max_score)
                  }`}>
                    {getStatusText(test.evaluation.score, test.evaluation.max_score)}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {test.category}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    test.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    test.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {test.difficulty}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-500 truncate">
                  {test.prompt}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div>
                {test.evaluation.score.toFixed(1)}/{test.evaluation.max_score.toFixed(1)}
              </div>
              <div className="text-xs">
                {test.evaluation.evaluation_type}
              </div>
            </div>
          </div>
        </div>
        
        {isExpanded && (
          <div className="px-6 pb-4 bg-gray-50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Prompt and Response */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Prompt</h4>
                  <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                    {test.prompt}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Response</h4>
                  <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                    {test.response}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Expected</h4>
                  <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                    {test.expected}
                  </div>
                </div>
              </div>
              
              {/* Evaluation Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Evaluation</h4>
                  <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                    <div className="mb-2">
                      <span className="font-medium">Type:</span> {test.evaluation.evaluation_type}
                    </div>
                    <div className="mb-2">
                      <span className="font-medium">Score:</span> {test.evaluation.score}/{test.evaluation.max_score}
                    </div>
                    <div className="mb-2">
                      <span className="font-medium">Correct:</span> {test.evaluation.llm_evaluation.correct ? 'Yes' : 'No'}
                    </div>
                    {test.evaluation.llm_evaluation.partial && (
                      <div className="mb-2">
                        <span className="font-medium">Partial:</span> Yes
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">LLM Explanation</h4>
                  <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                    {test.evaluation.llm_evaluation.explanation}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Metrics</h4>
                  <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                    <div className="grid grid-cols-2 gap-2">
                      <div>Response Time: {test.llm_metrics.response_time.toFixed(2)}s</div>
                      <div>Eval Time: {test.evaluation.llm_evaluation.response_time.toFixed(2)}s</div>
                      <div>LLM Tokens: {test.llm_metrics.tokens.total}</div>
                      <div>Eval Tokens: {test.evaluation.llm_evaluation.tokens.total}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Dashboard
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {evaluation.model} Evaluation Details
            </h1>
            <p className="text-gray-600 mt-1">
              {format(new Date(evaluation.timestamp), 'MMMM dd, yyyy at HH:mm')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {evaluation.summary.total_score.toFixed(1)}/{evaluation.summary.max_possible_score.toFixed(1)}
            </div>
            <div className="text-sm text-gray-500">
              {evaluation.summary.accuracy.toFixed(1)}% accuracy
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-600">Total Tests</div>
          <div className="text-2xl font-bold text-gray-900">{evaluation.summary.total_tests}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-600">Accuracy</div>
          <div className="text-2xl font-bold text-gray-900">{evaluation.summary.accuracy.toFixed(1)}%</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-600">Avg Response Time</div>
          <div className="text-2xl font-bold text-gray-900">{evaluation.summary.average_response_time.toFixed(2)}s</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm font-medium text-gray-600">Total Tokens</div>
          <div className="text-2xl font-bold text-gray-900">{evaluation.summary.total_tokens.toLocaleString()}</div>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
          <p className="text-sm text-gray-600 mt-1">
            Click on any test to see detailed evaluation information
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {evaluation.results.map((test) => (
            <TestRow key={test.test_id} test={test} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default EvaluationDetail;