import { EvaluationResult } from '../types/evaluation';

export class DataLoader {
  private static instance: DataLoader;
  private evaluations: EvaluationResult[] = [];
  private isLoaded = false;

  static getInstance(): DataLoader {
    if (!DataLoader.instance) {
      DataLoader.instance = new DataLoader();
    }
    return DataLoader.instance;
  }

  async loadEvaluations(): Promise<EvaluationResult[]> {
    if (this.isLoaded) {
      return this.evaluations;
    }

    try {
      // Load files directly from the public folder
      return await this.loadIndividualFiles();
    } catch (error) {
      console.error('Failed to load evaluations:', error);
      this.evaluations = [];
      this.isLoaded = true;
      return this.evaluations;
    }
  }

  private async loadIndividualFiles(): Promise<EvaluationResult[]> {
    // Files are now in the public folder, accessible via direct fetch
    const knownFiles = [
      'evaluation_report_llm_eval_gpt-3.5-turbo_20250629_175853.json',
      'evaluation_report_llm_eval_gpt-4o-mini_20250629_175924.json',
      'evaluation_report_gpt-3.5-turbo_20250629_181501.json',
      'evaluation_report_gpt-4o-mini_20250629_181519.json'
    ];

    const results: EvaluationResult[] = [];
    
    for (const filename of knownFiles) {
      try {
        const response = await fetch(`/results/evaluations/${filename}`);
        if (response.ok) {
          const evaluation = await response.json();
          results.push(evaluation);
        }
      } catch (error) {
        console.warn(`Failed to load ${filename}:`, error);
      }
    }

    this.evaluations = results;
    this.isLoaded = true;
    return results;
  }

  getEvaluationById(id: string): EvaluationResult | undefined {
    return this.evaluations.find(evaluation => evaluation.evaluation_id === id);
  }

  getUniqueModels(): string[] {
    return [...new Set(this.evaluations.map(evaluation => evaluation.model))];
  }

  getUniqueCategories(): string[] {
    const categories = new Set<string>();
    this.evaluations.forEach(evaluation => {
      evaluation.results.forEach(result => {
        categories.add(result.category);
      });
    });
    return [...categories];
  }

  getEvaluationsByModel(model: string): EvaluationResult[] {
    return this.evaluations.filter(evaluation => evaluation.model === model);
  }

  getEvaluationsByDateRange(startDate: Date, endDate: Date): EvaluationResult[] {
    return this.evaluations.filter(evaluation => {
      const evalDate = new Date(evaluation.timestamp);
      return evalDate >= startDate && evalDate <= endDate;
    });
  }
}