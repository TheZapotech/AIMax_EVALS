import React, { useState, useEffect } from 'react';
import { Activity, Brain, Clock, TrendingUp } from 'lucide-react';
import { EvaluationResult, DashboardStats } from '../types/evaluation';
import { DataLoader } from '../utils/dataLoader';
import StatCard from '../components/StatCard';
import EvaluationTable from '../components/EvaluationTable';
import Charts from '../components/Charts';
import EvaluationDetail from '../components/EvaluationDetail';

const Dashboard: React.FC = () => {
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationResult | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalRuns: 0,
    averageScore: 0,
    bestModel: '',
    latestRun: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const dataLoader = DataLoader.getInstance();
      const data = await dataLoader.loadEvaluations();
      setEvaluations(data);
      calculateDashboardStats(data);
      setError(null);
    } catch (err) {
      setError('Failed to load evaluation data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDashboardStats = (data: EvaluationResult[]) => {
    if (data.length === 0) {
      setDashboardStats({
        totalRuns: 0,
        averageScore: 0,
        bestModel: '',
        latestRun: '',
      });
      return;
    }

    // Calculate average score across all evaluations
    const totalScore = data.reduce((sum, evaluation) => sum + evaluation.summary.total_score, 0);
    const totalMaxScore = data.reduce((sum, evaluation) => sum + evaluation.summary.max_possible_score, 0);
    const averageScore = (totalScore / totalMaxScore) * 100;

    // Find best performing model
    const modelPerformance = data.reduce((acc, evaluation) => {
      const key = evaluation.model;
      if (!acc[key]) {
        acc[key] = { totalScore: 0, maxScore: 0, count: 0 };
      }
      acc[key].totalScore += evaluation.summary.total_score;
      acc[key].maxScore += evaluation.summary.max_possible_score;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { totalScore: number; maxScore: number; count: number }>);

    const bestModel = Object.entries(modelPerformance)
      .map(([model, stats]) => ({
        model,
        score: (stats.totalScore / stats.maxScore) * 100,
      }))
      .sort((a, b) => b.score - a.score)[0]?.model || '';

    // Get latest run date
    const latestRun = data
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
      ?.timestamp || '';

    setDashboardStats({
      totalRuns: data.length,
      averageScore,
      bestModel,
      latestRun,
    });
  };

  const handleRowClick = (evaluation: EvaluationResult) => {
    setSelectedEvaluation(evaluation);
  };

  const handleBackToDashboard = () => {
    setSelectedEvaluation(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading evaluation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (selectedEvaluation) {
    return (
      <EvaluationDetail
        evaluation={selectedEvaluation}
        onBack={handleBackToDashboard}
      />
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
                🤖 AIMax Evaluations Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor and analyze LLM evaluation results
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadData}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Runs"
            value={dashboardStats.totalRuns}
            icon={<Activity className="w-6 h-6" />}
            subtitle="Evaluation runs"
          />
          <StatCard
            title="Average Score"
            value={`${dashboardStats.averageScore.toFixed(1)}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            subtitle="Across all models"
          />
          <StatCard
            title="Best Model"
            value={dashboardStats.bestModel || 'N/A'}
            icon={<Brain className="w-6 h-6" />}
            subtitle="Highest performing"
          />
          <StatCard
            title="Latest Run"
            value={dashboardStats.latestRun ? 
              new Date(dashboardStats.latestRun).toLocaleDateString() : 'N/A'
            }
            icon={<Clock className="w-6 h-6" />}
            subtitle="Most recent evaluation"
          />
        </div>

        {/* Evaluation Runs Table */}
        <div className="mb-8">
          <EvaluationTable
            evaluations={evaluations}
            onRowClick={handleRowClick}
          />
        </div>

        {/* Charts */}
        {evaluations.length > 0 && (
          <Charts evaluations={evaluations} />
        )}

        {evaluations.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No evaluation data found</div>
            <p className="text-gray-400 mb-6">
              Run some evaluations first to see results here
            </p>
            <button
              onClick={loadData}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Check for New Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;