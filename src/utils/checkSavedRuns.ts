// Utility to check if there are saved runs in localStorage
export function checkForSavedRuns() {
  try {
    const runs = JSON.parse(localStorage.getItem('db_illuminator_evaluation_runs') || '[]');
    console.log('Found saved runs:', runs.length);
    console.log('Latest run:', runs[0]);
    return runs;
  } catch (error) {
    console.error('Error checking saved runs:', error);
    return [];
  }
}

// Call this to check for your last run
if (typeof window !== 'undefined') {
  console.log('🔍 Checking for your saved evaluation runs...');
  const savedRuns = checkForSavedRuns();
  
  if (savedRuns.length > 0) {
    const lastRun = savedRuns[savedRuns.length - 1];
    console.log('✅ Your last run WAS saved!');
    console.log('Last run details:', {
      runId: lastRun.run_id,
      database: lastRun.database_name,
      timestamp: new Date(lastRun.timestamp).toLocaleString(),
      totalQueries: lastRun.total_queries
    });
  } else {
    console.log('❌ No saved runs found - your last run may not have been saved properly');
  }
}