
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, HelpCircle, ArrowRight, MessageSquare, Database } from "lucide-react";

interface UserQuestion {
  question_text: string;
  question_type: 'yes_no' | 'multiple_choice' | 'free_text_definitions';
  options?: string[];
}

interface ColumnQuestion {
  column_name: string;
  data_type: string;
  sample_values: string[];
  enum_values_found: string[];
  hypothesis: string;
  questions_for_user: UserQuestion[];
}

interface TableQuestionSet {
  table_name: string;
  sampling_info: string;
  table_hypothesis: string;
  table_questions: UserQuestion[];
  columns: ColumnQuestion[];
}

interface InteractiveAnnotationResult {
  type: 'interactive';
  questions: TableQuestionSet[];
  schemaInfo: any;
  samplingInfo: string;
}

interface InteractiveAnnotationHandlerProps {
  interactiveResult: InteractiveAnnotationResult;
  onAnswersComplete: (answers: Record<string, any>) => void;
}

export function InteractiveAnnotationHandler({ 
  interactiveResult, 
  onAnswersComplete 
}: InteractiveAnnotationHandlerProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentTableIndex, setCurrentTableIndex] = useState(0);

  const currentTable = interactiveResult.questions[currentTableIndex];
  const totalTables = interactiveResult.questions.length;
  const isLastTable = currentTableIndex === totalTables - 1;

  const handleAnswer = (tableName: string, columnName: string, questionIndex: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [tableName]: {
        ...prev[tableName],
        [columnName]: {
          ...prev[tableName]?.[columnName],
          [`question_${questionIndex}`]: answer
        }
      }
    }));
  };

  const handleTableQuestionAnswer = (tableName: string, questionIndex: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [tableName]: {
        ...prev[tableName],
        table_questions: {
          ...prev[tableName]?.table_questions,
          [`question_${questionIndex}`]: answer
        }
      }
    }));
  };

  const handleNext = () => {
    if (isLastTable) {
      onAnswersComplete(answers);
    } else {
      setCurrentTableIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentTableIndex > 0) {
      setCurrentTableIndex(prev => prev - 1);
    }
  };

  const getAnsweredQuestionsCount = () => {
    const tableAnswers = answers[currentTable.table_name] || {};
    
    // Count table questions
    const tableQuestionCount = currentTable.table_questions?.length || 0;
    const answeredTableQuestions = Object.keys(tableAnswers.table_questions || {}).length;
    
    // Count column questions
    const totalColumnQuestions = currentTable.columns.reduce((sum, col) => sum + col.questions_for_user.length, 0);
    const answeredColumnQuestions = currentTable.columns.reduce((sum, col) => {
      const colAnswers = tableAnswers[col.column_name] || {};
      return sum + Object.keys(colAnswers).length;
    }, 0);
    
    const totalQuestions = tableQuestionCount + totalColumnQuestions;
    const answeredQuestions = answeredTableQuestions + answeredColumnQuestions;
    
    return { answered: answeredQuestions, total: totalQuestions };
  };

  const { answered, total } = getAnsweredQuestionsCount();

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Validate Database Annotations</h3>
        <p className="text-muted-foreground">
          Please review and validate the AI's understanding of your database schema
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline">
            Table {currentTableIndex + 1} of {totalTables}
          </Badge>
          <Badge variant="default">
            {answered}/{total} questions answered
          </Badge>
        </div>
      </div>

      {/* Sampling Info */}
      <Alert className="border-accent/20 bg-accent/5">
        <MessageSquare className="h-4 w-4" />
        <AlertDescription>
          <strong>Data Analysis:</strong> {interactiveResult.samplingInfo}<br/>
          <span className="text-sm text-muted-foreground">
            The AI analyzed your actual database schema and sample data
          </span>
        </AlertDescription>
      </Alert>

      {/* Current Table Questions */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            {currentTable.table_name}
          </CardTitle>
          <CardDescription className="text-base">
            {currentTable.table_hypothesis}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Table Context Questions */}
          {currentTable.table_questions && currentTable.table_questions.length > 0 && (
            <div className="space-y-4">
              <h5 className="font-medium text-lg flex items-center gap-2">
                <Database className="h-4 w-4" />
                Table Context Questions
              </h5>
              {currentTable.table_questions.map((question, questionIndex) => (
                <Card key={questionIndex} className="bg-blue-50/50 border-blue-200">
                  <CardContent className="pt-4 space-y-3">
                    <Label className="text-sm font-medium">
                      {question.question_text}
                    </Label>
                    
                    {question.question_type === 'yes_no' && (
                      <RadioGroup
                        value={answers[currentTable.table_name]?.table_questions?.[`question_${questionIndex}`] || ''}
                        onValueChange={(value) => handleTableQuestionAnswer(currentTable.table_name, questionIndex, value)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id={`table-${questionIndex}-yes`} />
                          <Label htmlFor={`table-${questionIndex}-yes`}>Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id={`table-${questionIndex}-no`} />
                          <Label htmlFor={`table-${questionIndex}-no`}>No</Label>
                        </div>
                      </RadioGroup>
                    )}
                    
                    {question.question_type === 'multiple_choice' && question.options && (
                      <RadioGroup
                        value={answers[currentTable.table_name]?.table_questions?.[`question_${questionIndex}`] || ''}
                        onValueChange={(value) => handleTableQuestionAnswer(currentTable.table_name, questionIndex, value)}
                      >
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`table-${questionIndex}-${optIndex}`} />
                            <Label htmlFor={`table-${questionIndex}-${optIndex}`}>{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                    
                    {question.question_type === 'free_text_definitions' && (
                      <Textarea
                        placeholder="Please provide detailed explanation..."
                        value={answers[currentTable.table_name]?.table_questions?.[`question_${questionIndex}`] || ''}
                        onChange={(e) => handleTableQuestionAnswer(currentTable.table_name, questionIndex, e.target.value)}
                        className="min-h-[80px]"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Column Questions */}
          <div className="space-y-6">
            <h5 className="font-medium text-lg">Column Validations</h5>
            {currentTable.columns.map((column, colIndex) => (
              <Card key={colIndex} className="bg-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="font-mono text-primary">{column.column_name}</span>
                    <Badge variant="secondary">{column.data_type}</Badge>
                  </CardTitle>
                  <CardDescription>
                    <strong>AI Hypothesis:</strong> {column.hypothesis}
                    {column.enum_values_found.length > 0 && (
                      <div className="mt-2">
                        <strong>Found Values:</strong> {column.enum_values_found.join(', ')}
                      </div>
                    )}
                    <div className="mt-2">
                      <strong>Sample Data:</strong> {column.sample_values.join(', ')}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {column.questions_for_user.map((question, questionIndex) => (
                    <Card key={questionIndex} className="bg-white/50">
                      <CardContent className="pt-4 space-y-3">
                        <Label className="text-sm font-medium">
                          <span className="text-blue-600">Q{questionIndex + 1}:</span> {question.question_text}
                        </Label>
                        
                        {question.question_type === 'yes_no' && (
                          <RadioGroup
                            value={answers[currentTable.table_name]?.[column.column_name]?.[`question_${questionIndex}`] || ''}
                            onValueChange={(value) => handleAnswer(currentTable.table_name, column.column_name, questionIndex, value)}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id={`${colIndex}-${questionIndex}-yes`} />
                              <Label htmlFor={`${colIndex}-${questionIndex}-yes`}>Yes, correct</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id={`${colIndex}-${questionIndex}-no`} />
                              <Label htmlFor={`${colIndex}-${questionIndex}-no`}>No, needs correction</Label>
                            </div>
                          </RadioGroup>
                        )}
                        
                        {question.question_type === 'multiple_choice' && question.options && (
                          <RadioGroup
                            value={answers[currentTable.table_name]?.[column.column_name]?.[`question_${questionIndex}`] || ''}
                            onValueChange={(value) => handleAnswer(currentTable.table_name, column.column_name, questionIndex, value)}
                          >
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`${colIndex}-${questionIndex}-${optIndex}`} />
                                <Label htmlFor={`${colIndex}-${questionIndex}-${optIndex}`}>{option}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}
                        
                        {question.question_type === 'free_text_definitions' && (
                          <Textarea
                            placeholder="Please provide definitions or corrections..."
                            value={answers[currentTable.table_name]?.[column.column_name]?.[`question_${questionIndex}`] || ''}
                            onChange={(e) => handleAnswer(currentTable.table_name, column.column_name, questionIndex, e.target.value)}
                            className="min-h-[60px]"
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentTableIndex === 0}
            >
              Previous Table
            </Button>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                Progress: {answered}/{total} questions answered
              </div>
            </div>
            
            <Button
              onClick={handleNext}
              disabled={answered < total}
              className="px-8"
            >
              {isLastTable ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Generate Final Annotations
                </>
              ) : (
                <>
                  Next Table
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
