import { useState, useEffect } from "react";
import { useEvaluation } from "@/contexts/EvaluationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Brain, Database, Edit3, ArrowRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { generateDatabaseAnnotations } from "@/lib/annotationService";

interface TableAnnotation {
  tableName: string;
  description: string;
  columns: {
    name: string;
    type: string;
    description: string;
    businessContext?: string;
  }[];
}

export function AnnotationGenerator() {
  const { state, setAnnotations, setCurrentStep } = useEvaluation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedAnnotations, setGeneratedAnnotations] = useState<TableAnnotation[]>([]);
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAnnotations = async () => {
    if (!state.selectedDatabase || !state.customPrompt) return;
    
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const annotations = await generateDatabaseAnnotations(
        state.selectedDatabase,
        state.customPrompt
      );
      
      clearInterval(progressInterval);
      setProgress(100);
      setGeneratedAnnotations(annotations);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate annotations");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditAnnotation = (tableName: string, field: string, value: string) => {
    setGeneratedAnnotations(prev => 
      prev.map(table => {
        if (table.tableName === tableName) {
          if (field === 'description') {
            return { ...table, description: value };
          } else if (field.startsWith('column_')) {
            const columnIndex = parseInt(field.split('_')[1]);
            const updatedColumns = [...table.columns];
            updatedColumns[columnIndex] = {
              ...updatedColumns[columnIndex],
              description: value
            };
            return { ...table, columns: updatedColumns };
          }
        }
        return table;
      })
    );
  };

  const handleContinue = () => {
    const annotationsObj = generatedAnnotations.reduce((acc, table) => {
      acc[table.tableName] = table;
      return acc;
    }, {} as Record<string, TableAnnotation>);
    
    setAnnotations(annotationsObj);
    setCurrentStep(4);
  };

  const hasValidAnnotations = generatedAnnotations.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Generate Database Annotations</h3>
        <p className="text-muted-foreground">
          Use your LLM to create contextual annotations for the selected database schema
        </p>
      </div>

      {/* Database & Prompt Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <Alert className="border-primary/20 bg-primary/5">
          <Database className="h-4 w-4" />
          <AlertDescription>
            <strong>Database:</strong> {state.selectedDatabase?.name}<br/>
            <span className="text-sm text-muted-foreground">
              {state.selectedDatabase?.tables} tables, {state.selectedDatabase?.difficulty} difficulty
            </span>
          </AlertDescription>
        </Alert>
        
        <Alert className="border-accent/20 bg-accent/5">
          <Brain className="h-4 w-4" />
          <AlertDescription>
            <strong>Prompt Length:</strong> {state.customPrompt.length} characters<br/>
            <span className="text-sm text-muted-foreground">
              Ready for annotation generation
            </span>
          </AlertDescription>
        </Alert>
      </div>

      {/* Generation Status */}
      {!hasValidAnnotations && !isGenerating && (
        <div className="text-center py-8">
          <Button 
            size="lg" 
            onClick={handleGenerateAnnotations}
            className="px-8"
            disabled={!state.selectedDatabase || !state.customPrompt}
          >
            <Brain className="mr-2 h-5 w-5" />
            Generate Annotations with LLM
          </Button>
        </div>
      )}

      {/* Progress Bar */}
      {isGenerating && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-medium">Generating annotations...</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">
            Analyzing schema and generating contextual descriptions
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Generation Failed:</strong> {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4" 
              onClick={handleGenerateAnnotations}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Generated Annotations */}
      {hasValidAnnotations && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Generated Annotations ({generatedAnnotations.length} tables)
            </h4>
            <Badge variant="default">Ready for Review</Badge>
          </div>

          {/* Annotations List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {generatedAnnotations.map((table) => (
              <Card key={table.tableName} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{table.tableName}</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTable(
                        editingTable === table.tableName ? null : table.tableName
                      )}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      {editingTable === table.tableName ? 'Close' : 'Edit'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {editingTable === table.tableName ? (
                    <Textarea
                      value={table.description}
                      onChange={(e) => handleEditAnnotation(table.tableName, 'description', e.target.value)}
                      className="min-h-[100px]"
                    />
                  ) : (
                    <CardDescription>{table.description}</CardDescription>
                  )}
                  
                  <div className="space-y-2">
                    <h5 className="font-medium">Columns ({table.columns.length})</h5>
                    {table.columns.slice(0, 3).map((column, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="font-mono text-primary">{column.name}</span>
                        <span className="text-muted-foreground ml-2">({column.type})</span>
                        <span className="ml-2">{column.description}</span>
                      </div>
                    ))}
                    {table.columns.length > 3 && (
                      <div className="text-sm text-muted-foreground">
                        ... and {table.columns.length - 3} more columns
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Continue Button */}
          <div className="flex justify-center">
            <Button size="lg" onClick={handleContinue} className="px-8">
              Continue to Spider Evaluation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}