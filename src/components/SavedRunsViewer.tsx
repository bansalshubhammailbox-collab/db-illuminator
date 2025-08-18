
import { useState, useEffect } from "react";
import { getSavedRuns, SavedEvaluationRun } from "@/lib/savedRunsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Calendar, Database, TrendingUp, AlertCircle, CheckCircle, X } from "lucide-react";

interface SavedRun {
  runId: string;
  timestamp: string;
  database: string;
  accuracy: number;
  totalQueries: number;
  correctQueries: number;
  difficulty: string;
  annotationImpact: {
    withoutAnnotations: number;
    withAnnotations: number;
    improvement: number;
  };
  sqlQueries?: any[];
  baselineCalculation?: any;
}

export function SavedRunsViewer() {
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<SavedRun | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSavedRuns = async () => {
      setIsLoading(true);
      try {
        const runs = await getSavedRuns();
        
        // Transform the data to match our component interface
        const transformedRuns: SavedRun[] = (runs || []).map((run: SavedEvaluationRun) => {
          const results = run.evaluation_results;
          const bestSchema = results?.schemaResults?.reduce((best: any, current: any) => 
            (current.accuracy || 0) > (best.accuracy || 0) ? current : best
          );
          
          return {
            runId: run.run_id,
            timestamp: run.timestamp,
            database: run.database_name,
            accuracy: bestSchema?.accuracy || 0,
            totalQueries: run.total_queries || 0,
            correctQueries: bestSchema?.correctQueries || 0,
            difficulty: results?.difficulty || 'Unknown',
            annotationImpact: {
              withoutAnnotations: results?.schemaResults?.[0]?.accuracy || 0,
              withAnnotations: bestSchema?.accuracy || 0,
              improvement: (bestSchema?.accuracy || 0) - (results?.schemaResults?.[0]?.accuracy || 0)
            },
            sqlQueries: results?.sqlQueries || [],
            baselineCalculation: results?.baselineCalculation
          };
        });
        
        setSavedRuns(transformedRuns);
      } catch (error) {
        console.error('Failed to load saved runs:', error);
        setSavedRuns([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSavedRuns();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading saved evaluation runs...</p>
      </div>
    );
  }

  if (savedRuns.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No saved evaluation runs found. Complete an evaluation to see results here.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {(savedRuns || []).map((run) => (
          <Card key={run.runId} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  {run.database}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={run.difficulty === 'Easy' ? 'default' : run.difficulty === 'Medium' ? 'secondary' : 'destructive'}>
                    {run.difficulty}
                  </Badge>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedRun(run)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Evaluation Run Details</DialogTitle>
                        <DialogDescription>
                          Results for {run.database} evaluation run
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedRun && (
                        <Tabs defaultValue="overview" className="w-full">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="baseline">Baseline Calculation</TabsTrigger>
                            <TabsTrigger value="queries">SQL Queries</TabsTrigger>
                            <TabsTrigger value="improvement">Improvement</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="overview" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm">Overall Accuracy</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">{selectedRun.accuracy.toFixed(1)}%</div>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedRun.correctQueries} of {selectedRun.totalQueries} queries correct
                                  </p>
                                </CardContent>
                              </Card>
                              
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm">Annotation Impact</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold text-green-600">
                                    +{selectedRun.annotationImpact.improvement.toFixed(1)}%
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Improvement from annotations
                                  </p>
                                </CardContent>
                              </Card>
                            </div>
                            
                            <Alert>
                              <Calendar className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Run Date:</strong> {new Date(selectedRun.timestamp).toLocaleString()}<br/>
                                <strong>Run ID:</strong> {selectedRun.runId}
                              </AlertDescription>
                            </Alert>
                          </TabsContent>
                          
                          <TabsContent value="baseline" className="space-y-4">
                            {selectedRun.baselineCalculation ? (
                              <div className="space-y-4">
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-base">Baseline Calculation Method</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <p><strong>Description:</strong> {selectedRun.baselineCalculation.description}</p>
                                    <p><strong>Method:</strong> {selectedRun.baselineCalculation.method}</p>
                                    <div>
                                       <strong>Factors Considered:</strong>
                                       <ul className="list-disc list-inside mt-2 space-y-1">
                                         {(selectedRun.baselineCalculation?.factors || []).map((factor: string, index: number) => (
                                           <li key={index} className="text-sm">{factor}</li>
                                         ))}
                                       </ul>
                                    </div>
                                  </CardContent>
                                </Card>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm">Without Annotations</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-xl font-bold text-red-600">
                                        {selectedRun.annotationImpact.withoutAnnotations.toFixed(1)}%
                                      </div>
                                    </CardContent>
                                  </Card>
                                  
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm">With Annotations</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-xl font-bold text-green-600">
                                        {selectedRun.annotationImpact.withAnnotations.toFixed(1)}%
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              </div>
                            ) : (
                              <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  Baseline calculation details not available for this run.
                                </AlertDescription>
                              </Alert>
                            )}
                          </TabsContent>
                          
                          <TabsContent value="queries" className="space-y-4">
                            {selectedRun.sqlQueries && selectedRun.sqlQueries.length > 0 ? (
                              <ScrollArea className="h-[400px]">
                                 <div className="space-y-4">
                                   {(selectedRun.sqlQueries || []).map((query, index) => (
                                    <Card key={index} className={query.is_correct ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"}>
                                      <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                          <CardTitle className="text-sm">Query {index + 1}</CardTitle>
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline">{query.difficulty_level}</Badge>
                                            {query.is_correct ? (
                                              <CheckCircle className="h-4 w-4 text-green-600" />
                                            ) : (
                                              <X className="h-4 w-4 text-red-600" />
                                            )}
                                          </div>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="space-y-3">
                                        <div>
                                          <strong>SQL Query:</strong>
                                          <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-x-auto">
                                            {query.query}
                                          </pre>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <strong>Expected:</strong>
                                            <p className="text-muted-foreground">{query.expected_result}</p>
                                          </div>
                                          <div>
                                            <strong>Actual:</strong>
                                            <p className={query.is_correct ? "text-green-600" : "text-red-600"}>
                                              {query.actual_result}
                                            </p>
                                          </div>
                                        </div>
                                        {query.error_message && (
                                          <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>{query.error_message}</AlertDescription>
                                          </Alert>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </ScrollArea>
                            ) : (
                              <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  SQL query details not available for this run.
                                </AlertDescription>
                              </Alert>
                            )}
                          </TabsContent>
                          
                          <TabsContent value="improvement" className="space-y-4">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                  <TrendingUp className="h-5 w-5" />
                                  Improvement Analysis
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Without Annotations:</span>
                                    <span className="font-mono">{selectedRun.annotationImpact.withoutAnnotations.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>With Annotations:</span>
                                    <span className="font-mono">{selectedRun.annotationImpact.withAnnotations.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between font-bold text-green-600">
                                    <span>Improvement:</span>
                                    <span className="font-mono">+{selectedRun.annotationImpact.improvement.toFixed(1)}%</span>
                                  </div>
                                </div>
                                
                                <div className="pt-4">
                                  <h5 className="font-medium mb-2">Key Benefits of Annotations:</h5>
                                  <ul className="text-sm space-y-1 text-muted-foreground">
                                    <li>• Reduced schema ambiguity for LLM understanding</li>
                                    <li>• Better column meaning interpretation</li>
                                    <li>• Improved relationship identification</li>
                                    <li>• Enhanced business context awareness</li>
                                  </ul>
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>
                        </Tabs>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Accuracy:</span>
                  <div className="font-bold">{run.accuracy.toFixed(1)}%</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Queries:</span>
                  <div className="font-bold">{run.correctQueries}/{run.totalQueries}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Improvement:</span>
                  <div className="font-bold text-green-600">+{run.annotationImpact.improvement.toFixed(1)}%</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {new Date(run.timestamp).toLocaleDateString()} at {new Date(run.timestamp).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
