import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { EvaluationResult } from '../types/evaluation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartsProps {
  evaluations: EvaluationResult[];
}

const Charts: React.FC<ChartsProps> = ({ evaluations }) => {
  // Model Performance Comparison
  const modelPerformanceData = () => {
    const modelStats = evaluations.reduce((acc, evaluation) => {
      if (!acc[evaluation.model]) {
        acc[evaluation.model] = { totalScore: 0, maxScore: 0, count: 0 };
      }
      acc[evaluation.model].totalScore += evaluation.summary.total_score;
      acc[evaluation.model].maxScore += evaluation.summary.max_possible_score;
      acc[evaluation.model].count += 1;
      return acc;
    }, {} as Record<string, { totalScore: number; maxScore: number; count: number }>);

    const labels = Object.keys(modelStats);
    const data = labels.map(model => {
      const stats = modelStats[model];
      return ((stats.totalScore / stats.maxScore) * 100).toFixed(1);
    });

    return {
      labels,
      datasets: [
        {
          label: 'Average Score (%)',
          data,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)',
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  // Performance Trend Over Time
  const performanceTrendData = () => {
    const sortedEvaluations = [...evaluations].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const labels = sortedEvaluations.map(evaluation => 
      new Date(evaluation.timestamp).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    );

    const datasets = Object.entries(
      sortedEvaluations.reduce((acc, evaluation) => {
        if (!acc[evaluation.model]) acc[evaluation.model] = [];
        acc[evaluation.model].push((evaluation.summary.total_score / evaluation.summary.max_possible_score) * 100);
        return acc;
      }, {} as Record<string, number[]>)
    ).map(([model, scores], index) => ({
      label: model,
      data: scores,
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(245, 158, 11)',
        'rgb(239, 68, 68)',
      ][index % 4],
      backgroundColor: [
        'rgba(59, 130, 246, 0.1)',
        'rgba(16, 185, 129, 0.1)',
        'rgba(245, 158, 11, 0.1)',
        'rgba(239, 68, 68, 0.1)',
      ][index % 4],
      tension: 0.4,
    }));

    return { labels, datasets };
  };

  // Category Performance Breakdown
  const categoryPerformanceData = () => {
    const categoryStats = evaluations.reduce((acc, evaluation) => {
      evaluation.results.forEach(result => {
        if (!acc[result.category]) {
          acc[result.category] = { correct: 0, total: 0 };
        }
        acc[result.category].total += 1;
        if (result.evaluation.score > 0) {
          acc[result.category].correct += 1;
        }
      });
      return acc;
    }, {} as Record<string, { correct: number; total: number }>);

    const labels = Object.keys(categoryStats);
    const data = labels.map(category => {
      const stats = categoryStats[category];
      return ((stats.correct / stats.total) * 100).toFixed(1);
    });

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            '#3B82F6',
            '#10B981',
            '#F59E0B',
            '#EF4444',
            '#8B5CF6',
            '#EC4899',
          ],
          borderWidth: 0,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Performance Metrics',
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Category Performance',
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Model Performance Comparison */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Performance</h3>
        <Bar data={modelPerformanceData()} options={chartOptions} />
      </div>

      {/* Performance Trend */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
        <Line data={performanceTrendData()} options={chartOptions} />
      </div>

      {/* Category Performance */}
      <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
        <div className="max-w-md mx-auto">
          <Doughnut data={categoryPerformanceData()} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
};

export default Charts;