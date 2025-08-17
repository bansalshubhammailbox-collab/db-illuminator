import { useState } from "react";
import { useEvaluation } from "@/contexts/EvaluationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TestTube, ArrowRight, CheckCircle, AlertCircle, Loader2, Database, Brain, Target, BarChart3 } from "lucide-react";
import { runSpiderEvaluation } from "@/lib/evaluationService";

interface SQLQueryResult {
  query: string;
  expected_result: string;
  schemaResults: {
    raw: { result: string; is_correct: boolean; error_message?: string };
    hypothesis: { result: string; is_correct: boolean; error_message?: string };
    annotated: { result: string; is_correct: boolean; error_message?: string };
  };
  difficulty_level: string;
  bestPerformingSchema: 'raw' | 'hypothesis' | 'annotated';
}

interface SchemaEvaluationResult {
  schemaType: 'raw' | 'hypothesis' | 'annotated';
  accuracy: number;
  correctQueries: number;
  description: string;
}

interface EvaluationResults {
  schemaResults: SchemaEvaluationResult[];
  totalQueries: number;
  executionTime: number;
  difficulty: string;
  database: string;
  baselineCalculation: {
    description: string;
    method: string;
    schemaTypes: {
      raw: { description: string; factors: string[] };
      hypothesis: { description: string; factors: string[] };
      annotated: { description: string; factors: string[] };
    };
  };
  sqlQueries: SQLQueryResult[];
}

export function SpiderEvaluationRunner() {
  const { state, setEvaluationResults, setCurrentStep } = useEvaluation();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<string>("");
  const [results, setResults] = useState<EvaluationResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const phases = [
    "Connecting to Snowflake database...",
    "Loading Spider test cases...",
    "Running evaluation on raw schema (no annotations)...",
    "Running evaluation on LLM-enhanced schema...",
    "Running evaluation on fully annotated schema...",
    "Calculating comparative results..."
  ];

  const handleRunEvaluation = async () => {
    if (!state.selectedDatabase || !state.annotations || !Object.keys(state.annotations).length) {
      setError("Missing database selection or annotations");
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setError(null);
    setCurrentPhase(phases[0]);

    try {
      // Simulate evaluation phases with progress updates
      for (let i = 0; i < phases.length; i++) {
        setCurrentPhase(phases[i]);
        setProgress((i / phases.length) * 100);
        
        // Simulate processing time for each phase
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Run the actual evaluation
      const evaluationResults = await runSpiderEvaluation({
        database: state.selectedDatabase,
        annotations: state.annotations,
        customPrompt: state.customPrompt
      });

      setProgress(100);
      setResults(evaluationResults);
      setEvaluationResults(evaluationResults);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setIsRunning(false);
    }
  };

  const handleContinue = () => {
    if (results) {
      setCurrentStep(5);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "text-green-600";
    if (accuracy >= 60) return "text-yellow-600"; 
    return "text-red-600";
  };

  const hasValidInputs = state.selectedDatabase && 
                        state.annotations && 
                        Object.keys(state.annotations).length > 0 &&
                        state.customPrompt;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Run Spider Evaluation</h3>
        <p className="text-muted-foreground">
          Execute the Spider benchmark with your annotated database schema
        </p>
      </div>

      {/* Input Validation */}
      <div className="grid md:grid-cols-3 gap-4">
        <Alert className={`border-l-4 ${state.selectedDatabase ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
          <Database className="h-4 w-4" />
          <AlertDescription>
            <strong>Database:</strong> {state.selectedDatabase?.name || 'Not selected'}
            <br/>
            <span className="text-sm">
              {state.selectedDatabase ? `${state.selectedDatabase.tables} tables ready` : 'No database selected'}
            </span>
          </AlertDescription>
        </Alert>

        <Alert className={`border-l-4 ${Object.keys(state.annotations || {}).length > 0 ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
          <Brain className="h-4 w-4" />
          <AlertDescription>
            <strong>Annotations:</strong> {Object.keys(state.annotations || {}).length} tables
            <br/>
            <span className="text-sm">
              {Object.keys(state.annotations || {}).length > 0 ? 'Ready for evaluation' : 'No annotations generated'}
            </span>
          </AlertDescription>
        </Alert>

        <Alert className={`border-l-4 ${state.customPrompt ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
          <Target className="h-4 w-4" />
          <AlertDescription>
            <strong>Prompt:</strong> {state.customPrompt ? `${state.customPrompt.length} chars` : 'Not created'}
            <br/>
            <span className="text-sm">
              {state.customPrompt ? 'Annotation strategy ready' : 'No prompt configured'}
            </span>
          </AlertDescription>
        </Alert>
      </div>

      {/* Start Evaluation */}
      {!results && !isRunning && (
        <div className="text-center py-8">
          <Button 
            size="lg" 
            onClick={handleRunEvaluation}
            disabled={!hasValidInputs}
            className="px-8"
          >
            <TestTube className="mr-2 h-5 w-5" />
            Run Spider Benchmark
          </Button>
          {!hasValidInputs && (
            <p className="text-sm text-destructive mt-2">
              Complete previous steps before running evaluation
            </p>
          )}
        </div>
      )}

      {/* Evaluation Progress */}
      {isRunning && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-medium">Running Spider Evaluation...</span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-muted-foreground text-center">
            {currentPhase}
          </p>
          <div className="text-center text-xs text-muted-foreground">
            This may take a few minutes depending on database complexity
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Evaluation Failed:</strong> {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4" 
              onClick={handleRunEvaluation}
              disabled={!hasValidInputs}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Evaluation Results */}
      {results && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Evaluation Complete
            </h4>
            <Badge variant="default">Results Ready</Badge>
          </div>

          {/* Main Results Card */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle>Spider Benchmark Comparative Results</CardTitle>
              <CardDescription>
                Performance comparison across different schema enhancement approaches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Stats */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary-foreground">{results.totalQueries}</div>
                  <div className="text-sm text-muted-foreground">Total Queries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{results.executionTime.toFixed(1)}s</div>
                  <div className="text-sm text-muted-foreground">Execution Time</div>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="text-sm">
                    {results.difficulty} Database
                  </Badge>
                </div>
              </div>

              {/* Schema Results Comparison */}
              <div className="space-y-4">
                <h5 className="font-semibold text-center">Performance by Schema Type</h5>
                <div className="grid md:grid-cols-3 gap-4">
                  {results.schemaResults.map((schema) => (
                    <Card key={schema.schemaType} className="border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span className="capitalize">{schema.schemaType}</span>
                          <div className={`text-xl font-bold ${getAccuracyColor(schema.accuracy)}`}>
                            {schema.accuracy.toFixed(1)}%
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Correct:</span>
                            <span className="font-medium">{schema.correctQueries}/{results.totalQueries}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{schema.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Performance Improvement Analysis */}
              {results.schemaResults.length >= 2 && (
                <Alert className="border-accent/20 bg-accent/5">
                  <BarChart3 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Enhancement Impact:</strong>
                    <div className="mt-2 space-y-1">
                      {results.schemaResults[1] && (
                        <div>
                          <strong>Hypothesis Schema:</strong> 
                          <span className={`ml-2 font-bold ${(results.schemaResults[1].accuracy - results.schemaResults[0].accuracy) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(results.schemaResults[1].accuracy - results.schemaResults[0].accuracy) > 0 ? '+' : ''}
                            {(results.schemaResults[1].accuracy - results.schemaResults[0].accuracy).toFixed(1)}%
                          </span>
                          {' '}improvement over raw schema
                        </div>
                      )}
                      {results.schemaResults[2] && (
                        <div>
                          <strong>Annotated Schema:</strong> 
                          <span className={`ml-2 font-bold ${(results.schemaResults[2].accuracy - results.schemaResults[0].accuracy) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(results.schemaResults[2].accuracy - results.schemaResults[0].accuracy) > 0 ? '+' : ''}
                            {(results.schemaResults[2].accuracy - results.schemaResults[0].accuracy).toFixed(1)}%
                          </span>
                          {' '}improvement over raw schema
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* SQL Query Details */}
          {results.sqlQueries && results.sqlQueries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>SQL Query Performance Details</CardTitle>
                <CardDescription>
                  Detailed breakdown showing how each schema type performed on individual queries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.sqlQueries.map((query, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <h6 className="font-medium">Query {index + 1}</h6>
                        <Badge variant={query.difficulty_level === 'Easy' ? 'default' : 
                                       query.difficulty_level === 'Medium' ? 'secondary' : 'destructive'}>
                          {query.difficulty_level}
                        </Badge>
                      </div>
                      
                      <div className="bg-muted/30 p-3 rounded text-sm font-mono">
                        {query.query}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <strong>Expected:</strong> {query.expected_result}
                      </div>

                      <div className="grid md:grid-cols-3 gap-3">
                        {Object.entries(query.schemaResults).map(([schemaType, result]) => (
                          <div key={schemaType} className={`p-3 rounded border ${
                            result.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium capitalize">{schemaType}</span>
                              {result.is_correct ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <div className="text-sm">
                              <div className="mb-1">{result.result}</div>
                              {result.error_message && (
                                <div className="text-red-600 text-xs">{result.error_message}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="text-sm text-center text-muted-foreground">
                        Best performing schema: <strong className="capitalize">{query.bestPerformingSchema}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Continue Button */}
          <div className="flex justify-center">
            <Button size="lg" onClick={handleContinue} className="px-8">
              Save & Compare Results
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}