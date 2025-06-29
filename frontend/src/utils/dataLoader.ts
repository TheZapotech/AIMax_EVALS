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

  async loadEvaluations(forceReload: boolean = false): Promise<EvaluationResult[]> {
    if (this.isLoaded && !forceReload) {
      return this.evaluations;
    }

    // Reset cache when force reloading
    if (forceReload) {
      this.isLoaded = false;
      this.evaluations = [];
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
    const results: EvaluationResult[] = [];
    
    // Try to get file list from the API endpoint first
    let filesToLoad: string[] = [];
    
    try {
      const listResponse = await fetch('/api/evaluations/list.json');
      if (listResponse.ok) {
        const listData = await listResponse.json();
        filesToLoad = listData.files || [];
        console.log(`Loaded ${filesToLoad.length} files from API list`);
      }
    } catch (error) {
      console.warn('Failed to load file list from API, using fallback:', error);
    }
    
    // Fallback to hardcoded list if API failed
    if (filesToLoad.length === 0) {
      console.log('Using fallback hardcoded file list');
      filesToLoad = [
        'evaluation_report_llm_eval_gpt-4o-mini_20250629_184329.json',
        'evaluation_report_llm_eval_gpt-4o-mini_20250629_175924.json',
        'evaluation_report_llm_eval_gpt-4.1_20250629_192051.json',
        'evaluation_report_llm_eval_gpt-4.1_20250629_184621.json',
        'evaluation_report_llm_eval_gpt-3.5-turbo_20250629_175853.json',
        'evaluation_report_gpt-4o-mini_20250629_181519.json',
        'evaluation_report_gpt-3.5-turbo_20250629_181501.json'
      ];
    }
    
    // Load each file
    for (const filename of filesToLoad) {
      try {
        const response = await fetch(`/results/evaluations/${filename}`);
        if (response.ok) {
          const evaluation = await response.json();
          results.push(evaluation);
        } else {
          console.warn(`Failed to fetch ${filename}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.warn(`Failed to load ${filename}:`, error);
      }
    }

    this.evaluations = results;
    this.isLoaded = true;
    return results;
  }

  private async discoverEvaluationFiles(): Promise<string[]> {
    // Try to use a file listing API or index file
    try {
      const response = await fetch('/api/evaluations/list');
      if (response.ok) {
        const fileList = await response.json();
        return fileList.files || [];
      }
    } catch (error) {
      // API not available, try alternative methods
    }

    // Fallback: try to fetch a directory index (works in some dev servers)
    try {
      const response = await fetch('/results/evaluations/');
      if (response.ok) {
        const html = await response.text();
        const files = this.parseDirectoryListing(html);
        return files.filter(f => f.endsWith('.json') && f.startsWith('evaluation_report_'));
      }
    } catch (error) {
      // Directory listing not available
    }

    // If all else fails, return empty array to trigger fallback
    throw new Error('Cannot discover files dynamically');
  }

  private parseDirectoryListing(html: string): string[] {
    const files: string[] = [];
    const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>/gi;
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      const filename = match[1];
      if (filename && !filename.includes('/') && filename !== '.' && filename !== '..') {
        files.push(filename);
      }
    }
    
    return files;
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