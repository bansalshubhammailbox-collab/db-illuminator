import { useState } from "react";
import { useEvaluation } from "@/contexts/EvaluationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Archive, CheckCircle, Download, BarChart3, Database, Brain, Target, Calendar } from "lucide-react";
import { saveEvaluationRun } from "@/lib/evaluationService";

export function ResultsSaver() {
  const { state, resetEvaluation } = useEvaluation();
  const [runName, setRunName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedRunId, setSavedRunId] = useState<string | null>(null);

  const handleSaveRun = async () => {
    if (!state.evaluationResults || !runName.trim()) return;

    setIsSaving(true);
    try {
      const result = await saveEvaluationRun(state.evaluationResults, {
        runName: runName.trim(),
        database: state.selectedDatabase,
        promptLength: state.customPrompt.length,
        annotationCount: Object.keys(state.annotations || {}).length,
        notes: notes.trim(),
        timestamp: new Date().toISOString()
      });

      setSaved(true);
      setSavedRunId(result.runId);
    } catch (error) {
      console.error('Failed to save run:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartNewRun = () => {
    resetEvaluation();
  };

  const formatAccuracy = (accuracy: number) => {
    const color = accuracy >= 80 ? "text-green-600" : accuracy >= 60 ? "text-yellow-600" : "text-red-600";
    return <span className={`font-bold ${color}`}>{accuracy.toFixed(1)}%</span>;
  };

  if (!state.evaluationResults) {
    return (
      <div className="text-center py-12">
        <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Results to Save</h3>
        <p className="text-muted-foreground">Complete an evaluation run first to save results.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Save & Compare Results</h3>
        <p className="text-muted-foreground">
          Save your evaluation run for comparison and future analysis
        </p>
      </div>

      {/* Results Summary */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Evaluation Summary</span>
            {formatAccuracy(state.evaluationResults.accuracy)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>{state.selectedDatabase?.name}</strong>
                <br />
                <span className="text-muted-foreground">{state.selectedDatabase?.difficulty} difficulty</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>{Object.keys(state.annotations || {}).length} tables</strong>
                <br />
                <span className="text-muted-foreground">Annotated</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>{state.evaluationResults.correctQueries}/{state.evaluationResults.totalQueries}</strong>
                <br />
                <span className="text-muted-foreground">Correct queries</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>+{state.evaluationResults.annotationImpact?.improvement.toFixed(1)}%</strong>
                <br />
                <span className="text-muted-foreground">With annotations</span>
              </span>
            </div>
          </div>

          {/* Annotation Impact Details */}
          {state.evaluationResults.annotationImpact && (
            <Alert className="border-accent/20 bg-accent/5">
              <BarChart3 className="h-4 w-4" />
              <AlertDescription>
                <strong>Annotation Impact:</strong> Your custom annotations improved accuracy by{' '}
                <span className="font-bold text-green-600">
                  +{state.evaluationResults.annotationImpact.improvement.toFixed(1)}%
                </span>{' '}
                ({state.evaluationResults.annotationImpact.withAnnotations.toFixed(1)}% vs{' '}
                {state.evaluationResults.annotationImpact.withoutAnnotations.toFixed(1)}% baseline)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Save Form */}
      {!saved && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Save This Run
            </CardTitle>
            <CardDescription>
              Give your run a memorable name and add notes for future comparison
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Run Name *</label>
              <Input
                placeholder="e.g., Academic DB - Basic Annotations - v1"
                value={runName}
                onChange={(e) => setRunName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                placeholder="Add notes about your prompt strategy, observations, or hypotheses..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <Button 
              onClick={handleSaveRun}
              disabled={!runName.trim() || isSaving}
              className="w-full"
              size="lg"
            >
              {isSaving ? "Saving..." : "Save Run"}
              <Archive className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {saved && (
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Run Saved Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Run ID:</strong> {savedRunId}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Saved on {new Date().toLocaleString()}
              </div>
            </div>

            <Alert>
              <Download className="h-4 w-4" />
              <AlertDescription>
                Your evaluation run has been saved and can be used for comparison with future runs.
                Track your progress as you experiment with different prompting strategies.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button onClick={handleStartNewRun} className="flex-1">
                Start New Evaluation
              </Button>
              <Button variant="outline" className="flex-1">
                View All Runs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}