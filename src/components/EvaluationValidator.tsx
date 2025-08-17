import { useEvaluation } from "@/contexts/EvaluationContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Database } from "lucide-react";

export function EvaluationValidator() {
  const { state, canProceedToStep } = useEvaluation();

  if (!state.selectedDatabase) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Selected Database Info */}
      <Alert className="border-primary/20 bg-primary/5">
        <Database className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            <strong>Selected Database:</strong> {state.selectedDatabase.name}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{state.selectedDatabase.tables} tables</Badge>
            <Badge variant={state.selectedDatabase.difficulty === 'Easy' ? 'default' : 
                          state.selectedDatabase.difficulty === 'Medium' ? 'secondary' : 'destructive'}>
              {state.selectedDatabase.difficulty}
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      {/* Validation Status */}
      <div className="text-sm text-muted-foreground">
        <h4 className="font-semibold mb-2">Evaluation Prerequisites:</h4>
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map(step => {
            const canProceed = canProceedToStep(step);
            const stepNames = {
              1: "Database selected",
              2: "Custom prompt created", 
              3: "Annotations generated",
              4: "Spider evaluation completed",
              5: "Results saved"
            };
            
            return (
              <div key={step} className="flex items-center gap-2">
                {canProceed ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-yellow-600" />
                )}
                <span className={canProceed ? "text-green-600" : "text-muted-foreground"}>
                  {stepNames[step as keyof typeof stepNames]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Critical Validation Warning */}
      {state.currentStep > 1 && !state.selectedDatabase && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> No database selected. The evaluation will fail without a selected Spider dataset.
            Please go back to Step 1 and select a database before proceeding.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}