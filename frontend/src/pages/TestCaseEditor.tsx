import React, { useState, useCallback } from 'react';
import { Upload, Download, Plus, Trash2, Save, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { TestSuite, TestCase } from '../types/testCase';

interface TestCaseEditorProps {
  onNavigateToHome: () => void;
}

const TestCaseEditor: React.FC<TestCaseEditorProps> = ({ onNavigateToHome }) => {
  const [testSuite, setTestSuite] = useState<TestSuite | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => file.name.endsWith('.json'));

    if (!jsonFile) {
      alert('Please drop a JSON file');
      return;
    }

    try {
      const text = await jsonFile.text();
      const parsed = JSON.parse(text);
      setTestSuite(parsed);
    } catch (error) {
      alert('Error parsing JSON file: ' + error);
    }
  }, []);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setTestSuite(parsed);
    } catch (error) {
      alert('Error parsing JSON file: ' + error);
    }
  }, []);

  const downloadTestSuite = useCallback(() => {
    if (!testSuite) return;

    // Recalculate metadata
    const updatedSuite = {
      ...testSuite,
      metadata: {
        ...testSuite.metadata,
        total_weight: testSuite.test_cases.reduce((sum, tc) => sum + tc.weight, 0),
        difficulty_distribution: {
          easy: testSuite.test_cases.filter(tc => tc.difficulty === 'easy').length,
          medium: testSuite.test_cases.filter(tc => tc.difficulty === 'medium').length,
          hard: testSuite.test_cases.filter(tc => tc.difficulty === 'hard').length,
        }
      }
    };

    const blob = new Blob([JSON.stringify(updatedSuite, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${testSuite.test_suite_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [testSuite]);

  const addTestCase = useCallback(() => {
    if (!testSuite) return;

    const newTestCase: TestCase = {
      test_id: `test_${Date.now()}`,
      prompt: '',
      expected: '',
      evaluation_type: 'exact_match',
      category: 'general',
      difficulty: 'easy',
      weight: 1.0,
      evaluation_hint: {
        type: 'contains_word',
        value: '',
        case_sensitive: false
      }
    };

    setTestSuite({
      ...testSuite,
      test_cases: [...testSuite.test_cases, newTestCase]
    });
  }, [testSuite]);

  const removeTestCase = useCallback((index: number) => {
    if (!testSuite) return;

    setTestSuite({
      ...testSuite,
      test_cases: testSuite.test_cases.filter((_, i) => i !== index)
    });
  }, [testSuite]);

  const updateTestCase = useCallback((index: number, updatedTestCase: TestCase) => {
    if (!testSuite) return;

    const updatedTestCases = [...testSuite.test_cases];
    updatedTestCases[index] = updatedTestCase;

    setTestSuite({
      ...testSuite,
      test_cases: updatedTestCases
    });
  }, [testSuite]);

  const updateTestSuiteInfo = useCallback((field: keyof TestSuite, value: string) => {
    if (!testSuite) return;

    setTestSuite({
      ...testSuite,
      [field]: value
    });
  }, [testSuite]);

  if (!testSuite) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Case Editor</h1>
          
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop your test case JSON file here
            </h3>
            <p className="text-gray-600 mb-4">
              or click to browse and select a file
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleFileInput}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="bg-blue-500 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
            >
              Browse Files
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📝 Test Case Editor
              </h1>
              <p className="text-gray-600 mt-1">
                Editing: {testSuite.test_suite_id}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onNavigateToHome}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={() => setTestSuite(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                Load New File
              </button>
              <button
                onClick={downloadTestSuite}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Test Suite Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Suite Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suite ID
              </label>
              <input
                type="text"
                value={testSuite.test_suite_id}
                onChange={(e) => updateTestSuiteInfo('test_suite_id', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                value={testSuite.language}
                onChange={(e) => updateTestSuiteInfo('language', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="en">English</option>
                <option value="it">Italian</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Weight
              </label>
              <input
                type="text"
                value={testSuite.test_cases.reduce((sum, tc) => sum + tc.weight, 0)}
                disabled
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={testSuite.description}
              onChange={(e) => updateTestSuiteInfo('description', e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden mb-6">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Field Documentation & Help</span>
            </div>
            {showHelp ? (
              <ChevronUp className="w-5 h-5 text-blue-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-blue-600" />
            )}
          </button>
          
          {showHelp && (
            <div className="px-6 pb-6 border-t border-blue-200 bg-white">
              <div className="space-y-6 mt-4">
                
                {/* Test Suite Fields */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Test Suite Fields</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Suite ID:</span>
                      <p className="text-gray-600 ml-2">Unique identifier for the test suite (e.g., "sample_basic_knowledge", "math_advanced_v2")</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Description:</span>
                      <p className="text-gray-600 ml-2">Brief description of what this test suite evaluates</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Language:</span>
                      <p className="text-gray-600 ml-2">
                        <strong>en</strong> = English only, <strong>it</strong> = Italian only, <strong>mixed</strong> = Multiple languages
                      </p>
                    </div>
                  </div>
                </div>

                {/* Test Case Fields */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Test Case Fields</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Test ID:</span>
                      <p className="text-gray-600 ml-2">Unique identifier for this specific test (e.g., "math_001", "code_python_001")</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Prompt:</span>
                      <p className="text-gray-600 ml-2">The question or instruction sent to the LLM. Be specific and clear.</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Expected Answer:</span>
                      <p className="text-gray-600 ml-2">The ideal response or key elements you expect. Used by evaluation hints.</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Category:</span>
                      <p className="text-gray-600 ml-2">Subject area (e.g., "mathematics", "programming", "science", "general")</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Weight:</span>
                      <p className="text-gray-600 ml-2">Point value for this test. Higher weight = more important (typically 1.0-5.0)</p>
                    </div>
                  </div>
                </div>

                {/* Evaluation Types */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Evaluation Types</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-blue-600">exact_match:</span>
                      <p className="text-gray-600 ml-2">Response must match expected answer exactly (case-insensitive)</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-600">contains_all:</span>
                      <p className="text-gray-600 ml-2">Response must contain all specified elements. Partial credit given.</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-600">functional_equivalence:</span>
                      <p className="text-gray-600 ml-2">For code: checks if code produces correct output (use with code_output hints)</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-600">key_elements:</span>
                      <p className="text-gray-600 ml-2">Checks for presence of key concepts/words in the response</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-600">contains_word:</span>
                      <p className="text-gray-600 ml-2">Simple check if response contains a specific word or phrase</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-600">llm_judge:</span>
                      <p className="text-gray-600 ml-2">🆕 LLM uses natural understanding to evaluate semantic correctness (translations, explanations, creative tasks)</p>
                    </div>
                  </div>
                </div>

                {/* Evaluation Hints */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Evaluation Hint Types</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-purple-600">contains_word:</span>
                      <p className="text-gray-600 ml-2">Check if response contains a specific word/phrase. Use "value" field.</p>
                    </div>
                    <div>
                      <span className="font-medium text-purple-600">contains_all_words:</span>
                      <p className="text-gray-600 ml-2">Check for multiple required words. Use "values" field with comma-separated list.</p>
                    </div>
                    <div>
                      <span className="font-medium text-purple-600">regex_match:</span>
                      <p className="text-gray-600 ml-2">Advanced pattern matching. Use "pattern" field for regex and "description" for explanation.</p>
                    </div>
                    <div>
                      <span className="font-medium text-purple-600">code_output:</span>
                      <p className="text-gray-600 ml-2">For programming questions. Tests code with specific inputs/outputs.</p>
                    </div>
                  </div>
                </div>

                {/* Examples */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Examples</h3>
                  <div className="space-y-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="font-medium text-gray-700 mb-1">Simple Question:</div>
                      <div className="text-gray-600">
                        <strong>Prompt:</strong> "What is the capital of France?"<br/>
                        <strong>Expected:</strong> "Paris"<br/>
                        <strong>Type:</strong> exact_match<br/>
                        <strong>Hint:</strong> contains_word → "Paris"
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="font-medium text-gray-700 mb-1">Multi-Element Question:</div>
                      <div className="text-gray-600">
                        <strong>Prompt:</strong> "List the three primary colors"<br/>
                        <strong>Expected:</strong> "red, blue, yellow"<br/>
                        <strong>Type:</strong> contains_all<br/>
                        <strong>Hint:</strong> contains_all_words → "red, blue, yellow"
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="font-medium text-gray-700 mb-1">Programming Question:</div>
                      <div className="text-gray-600">
                        <strong>Prompt:</strong> "Write a Python function to check if number is even"<br/>
                        <strong>Expected:</strong> "def is_even(n): return n % 2 == 0"<br/>
                        <strong>Type:</strong> functional_equivalence<br/>
                        <strong>Hint:</strong> code_output with test cases
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">💡 Pro Tips</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• Make prompts specific and unambiguous</p>
                    <p>• Use appropriate weights: easy=1.0, medium=2.0-3.0, hard=3.0-5.0</p>
                    <p>• Test your evaluation hints with expected answers</p>
                    <p>• Use contains_all for questions requiring multiple elements</p>
                    <p>• Set case_sensitive=false for most text-based questions</p>
                    <p>• For code questions, always include test cases in hints</p>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Test Cases */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Test Cases ({testSuite.test_cases.length})
            </h2>
            <button
              onClick={addTestCase}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Test Case</span>
            </button>
          </div>

          <div className="space-y-6">
            {testSuite.test_cases.map((testCase, index) => (
              <TestCaseCard
                key={testCase.test_id}
                testCase={testCase}
                index={index}
                onUpdate={updateTestCase}
                onRemove={removeTestCase}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Test Case Card Component
interface TestCaseCardProps {
  testCase: TestCase;
  index: number;
  onUpdate: (index: number, testCase: TestCase) => void;
  onRemove: (index: number) => void;
}

const TestCaseCard: React.FC<TestCaseCardProps> = ({ testCase, index, onUpdate, onRemove }) => {
  const updateField = (field: keyof TestCase, value: any) => {
    onUpdate(index, { ...testCase, [field]: value });
  };

  const updateHint = (field: keyof TestCase['evaluation_hint'], value: any) => {
    onUpdate(index, {
      ...testCase,
      evaluation_hint: { ...testCase.evaluation_hint, [field]: value }
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Test Case #{index + 1}</h3>
        <button
          onClick={() => onRemove(index)}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Test ID</label>
          <input
            type="text"
            value={testCase.test_id}
            onChange={(e) => updateField('test_id', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <input
            type="text"
            value={testCase.category}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
        <textarea
          value={testCase.prompt}
          onChange={(e) => updateField('prompt', e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Expected Answer</label>
        <textarea
          value={testCase.expected}
          onChange={(e) => updateField('expected', e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Evaluation Type</label>
          <select
            value={testCase.evaluation_type}
            onChange={(e) => updateField('evaluation_type', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="exact_match">Exact Match</option>
            <option value="contains_all">Contains All</option>
            <option value="functional_equivalence">Functional Equivalence</option>
            <option value="key_elements">Key Elements</option>
            <option value="contains_word">Contains Word</option>
            <option value="llm_judge">LLM Judge (Free Evaluation)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
          <select
            value={testCase.difficulty}
            onChange={(e) => updateField('difficulty', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
          <input
            type="number"
            step="0.5"
            value={testCase.weight}
            onChange={(e) => updateField('weight', parseFloat(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Evaluation Hint */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Evaluation Hint</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hint Type</label>
            <select
              value={testCase.evaluation_hint.type}
              onChange={(e) => updateHint('type', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="contains_word">Contains Word</option>
              <option value="contains_all_words">Contains All Words</option>
              <option value="regex_match">Regex Match</option>
              <option value="code_output">Code Output</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Case Sensitive</label>
            <select
              value={testCase.evaluation_hint.case_sensitive ? 'true' : 'false'}
              onChange={(e) => updateHint('case_sensitive', e.target.value === 'true')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
        </div>

        {/* Dynamic hint fields based on type */}
        {testCase.evaluation_hint.type === 'contains_word' && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Word/Phrase</label>
            <input
              type="text"
              value={testCase.evaluation_hint.value || ''}
              onChange={(e) => updateHint('value', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {testCase.evaluation_hint.type === 'contains_all_words' && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Words (comma-separated)</label>
            <input
              type="text"
              value={testCase.evaluation_hint.values?.join(', ') || ''}
              onChange={(e) => updateHint('values', e.target.value.split(',').map(s => s.trim()))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="word1, word2, word3"
            />
          </div>
        )}

        {testCase.evaluation_hint.type === 'regex_match' && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Regex Pattern</label>
              <input
                type="text"
                value={testCase.evaluation_hint.pattern || ''}
                onChange={(e) => updateHint('pattern', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={testCase.evaluation_hint.description || ''}
                onChange={(e) => updateHint('description', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestCaseEditor;