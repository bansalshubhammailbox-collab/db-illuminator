import { useState } from "react";
import { useEvaluation } from "@/contexts/EvaluationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, ArrowRight, Lightbulb, Database, Brain } from "lucide-react";

const promptTemplates = [
  {
    name: "Basic Schema Description",
    description: "Generate simple, clear descriptions for tables and columns",
    prompt: `Analyze this database schema and provide clear, concise descriptions for each table and column. Focus on:

1. Table Purpose: What business entity or process does this table represent?
2. Column Meaning: What specific information does each column store?
3. Relationships: How do tables connect to each other?
4. Business Context: What real-world scenarios would use this data?

For each table, provide:
- A brief description of its purpose
- The meaning of each column in business terms
- Any important constraints or data patterns

Database: {database_name}
Schema: {schema_info}`
  },
  {
    name: "Advanced Contextual Annotations",
    description: "Generate rich contextual information including business rules and data patterns",
    prompt: `Create comprehensive database annotations that will help an LLM generate accurate SQL queries. Include:

1. Business Logic: What business rules govern this data?
2. Data Patterns: What are typical value ranges, formats, or constraints?
3. Query Patterns: What are common ways this data is queried?
4. Relationships: Detailed foreign key relationships and join patterns
5. Temporal Aspects: How does time affect this data (if applicable)?

For database: {database_name}
Difficulty Level: {difficulty}
Table Count: {table_count}

Provide annotations that would help an LLM understand not just what the data is, but how it's typically used in business queries.`
  },
  {
    name: "Spider Benchmark Optimized",
    description: "Tailored specifically for Spider benchmark evaluation success",
    prompt: `Generate database annotations optimized for Spider benchmark SQL generation. Focus on:

1. Query Complexity: This is a {difficulty} level Spider database
2. Join Patterns: Identify the most likely table combinations for complex queries
3. Aggregation Contexts: Where would GROUP BY, COUNT, SUM, AVG be most relevant?
4. Filter Conditions: What are the most meaningful WHERE clause patterns?
5. Sorting Logic: What columns are most likely to be used in ORDER BY?

Database: {database_name} ({table_count} tables)

Create annotations that specifically help with:
- Multi-table JOIN queries
- Aggregation and grouping operations  
- Subqueries and nested SELECT statements
- Proper handling of NULL values and edge cases
- Business-meaningful filtering and sorting`
  }
];

export function AnnotationPromptCreator() {
  const { state, setCustomPrompt, setCurrentStep } = useEvaluation();
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [customPromptText, setCustomPromptText] = useState(state.customPrompt);
  const [isCustom, setIsCustom] = useState(false);

  const handleTemplateSelect = (templateIndex: number) => {
    setSelectedTemplate(templateIndex);
    setIsCustom(false);
    
    // Replace placeholders with actual database info
    let prompt = promptTemplates[templateIndex].prompt;
    if (state.selectedDatabase) {
      prompt = prompt
        .replace('{database_name}', state.selectedDatabase.name)
        .replace('{difficulty}', state.selectedDatabase.difficulty)
        .replace('{table_count}', state.selectedDatabase.tables.toString())
        .replace('{schema_info}', `${state.selectedDatabase.tables} tables with ${state.selectedDatabase.difficulty} complexity`);
    }
    
    setCustomPromptText(prompt);
  };

  const handleCustomPrompt = () => {
    setIsCustom(true);
    setSelectedTemplate(null);
    setCustomPromptText(customPromptText || "");
  };

  const handleContinue = () => {
    if (customPromptText.trim()) {
      setCustomPrompt(customPromptText.trim());
      setCurrentStep(3);
    }
  };

  const isValidPrompt = customPromptText.trim().length >= 50; // Minimum length validation

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Create Annotation Prompt</h3>
        <p className="text-muted-foreground">
          Design the prompt that will guide your LLM in generating database annotations
        </p>
      </div>

      {/* Selected Database Info */}
      {state.selectedDatabase && (
        <Alert className="border-primary/20 bg-primary/5">
          <Database className="h-4 w-4" />
          <AlertDescription>
            <strong>Target Database:</strong> {state.selectedDatabase.name} 
            <span className="ml-2 text-sm">
              ({state.selectedDatabase.tables} tables, {state.selectedDatabase.difficulty} difficulty)
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Template Selection */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Choose a Prompt Template
        </h4>
        
        <div className="grid gap-4">
          {promptTemplates.map((template, index) => (
            <Card 
              key={index}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedTemplate === index ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => handleTemplateSelect(index)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  {selectedTemplate === index && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
          
          {/* Custom Prompt Option */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              isCustom ? 'ring-2 ring-primary bg-primary/5' : ''
            }`}
            onClick={handleCustomPrompt}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Write Custom Prompt
                </CardTitle>
                {isCustom && <Badge variant="default">Selected</Badge>}
              </div>
              <CardDescription>
                Create your own custom annotation prompt from scratch
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Prompt Editor */}
      {(selectedTemplate !== null || isCustom) && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Review & Edit Prompt
          </h4>
          
          <Textarea
            value={customPromptText}
            onChange={(e) => setCustomPromptText(e.target.value)}
            placeholder="Enter your custom annotation prompt..."
            className="min-h-[300px] font-mono text-sm"
          />
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{customPromptText.length} characters</span>
            {!isValidPrompt && customPromptText.length > 0 && (
              <span className="text-destructive">Prompt should be at least 50 characters</span>
            )}
          </div>
        </div>
      )}

      {/* Continue Button */}
      {(selectedTemplate !== null || isCustom) && (
        <div className="flex justify-center">
          <Button 
            size="lg" 
            onClick={handleContinue}
            disabled={!isValidPrompt}
            className="px-8"
          >
            Continue to Generate Annotations
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}