// Simple localStorage-based service for saving evaluation runs
export interface SavedEvaluationRun {
  id?: string;
  run_id: string;
  timestamp: string;
  database_name: string;
  total_queries: number;
  evaluation_results: any;
  annotations: any;
  custom_prompt: string;
  created_at?: string;
}

const STORAGE_KEY = 'db_illuminator_evaluation_runs';

export async function saveEvaluationRun(data: {
  database: any;
  evaluationResults: any;
  annotations: any;
  customPrompt: string;
}): Promise<string> {
  const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const savedRun: SavedEvaluationRun = {
    run_id: runId,
    timestamp: new Date().toISOString(),
    database_name: data.database.name,
    total_queries: data.evaluationResults.totalQueries,
    evaluation_results: data.evaluationResults,
    annotations: data.annotations,
    custom_prompt: data.customPrompt,
    created_at: new Date().toISOString(),
  };

  try {
    const existingRuns = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existingRuns.push(savedRun);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingRuns));
    return runId;
  } catch (error) {
    console.error('Error saving evaluation run:', error);
    throw new Error('Failed to save evaluation run');
  }
}

export async function getSavedRuns(): Promise<SavedEvaluationRun[]> {
  try {
    const runs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return runs.sort((a: SavedEvaluationRun, b: SavedEvaluationRun) => 
      new Date(b.created_at || b.timestamp).getTime() - new Date(a.created_at || a.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error fetching saved runs:', error);
    return [];
  }
}

export async function deleteEvaluationRun(runId: string): Promise<void> {
  try {
    const existingRuns = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const filteredRuns = existingRuns.filter((run: SavedEvaluationRun) => run.run_id !== runId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRuns));
  } catch (error) {
    console.error('Error deleting evaluation run:', error);
    throw new Error('Failed to delete evaluation run');
  }
}