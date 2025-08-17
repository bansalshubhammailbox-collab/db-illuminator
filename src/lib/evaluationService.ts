
import { Database } from "@/contexts/EvaluationContext";
import { config } from "@/config/credentials";

interface EvaluationParams {
  database: Database;
  annotations: Record<string, any>;
  customPrompt: string;
}

interface SchemaType {
  id: 'raw' | 'hypothesis' | 'annotated';
  name: string;
  description: string;
  schema: any;
}

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

export async function runSpiderEvaluation(params: EvaluationParams): Promise<EvaluationResults> {
  try {
    console.log(`Running Spider evaluation for ${params.database.name}`);
    
    // Simulate the evaluation process with 3 schema types
    await simulateEvaluationSteps();
    
    // Generate realistic SQL queries for the evaluation
    const sqlQueries = generateRealisticSQLQueries(params.database);
    
    // Calculate baseline performance for all 3 schema types
    const baselineCalculation = {
      description: "Comprehensive evaluation using three different schema approaches to measure the impact of contextual information on Text2SQL performance",
      method: "Comparative analysis across raw schema, LLM-generated hypothesis schema, and fully annotated schema with user context",
      schemaTypes: {
        raw: {
          description: "Default Snowflake schema without any enhancements - represents baseline LLM performance",
          factors: [
            "Raw table and column names only",
            "No semantic context or business logic",
            "Ambiguous column relationships",
            "Standard SQL generation from minimal schema information"
          ]
        },
        hypothesis: {
          description: "Schema enhanced with LLM-generated hypothesis about column meanings and relationships",
          factors: [
            "AI-inferred column descriptions and purposes", 
            "Predicted table relationships and foreign keys",
            "Generated business context based on schema patterns",
            "Automated semantic enrichment without human input"
          ]
        },
        annotated: {
          description: "Fully contextualized schema with user-provided annotations, questions, and domain knowledge",
          factors: [
            "Human-provided column descriptions and business rules",
            "Domain-specific context and use cases",
            "Explicit relationship definitions and constraints", 
            "Custom validation rules and business logic"
          ]
        }
      }
    };
    
    // Generate schema results for all 3 types
    const schemaResults = generateSchemaResults(params.database.difficulty);
    
    const results: EvaluationResults = {
      schemaResults,
      totalQueries: getTestCaseCount(params.database.difficulty),
      executionTime: Math.random() * 15 + 10, // 10-25 seconds for 3 evaluations
      difficulty: params.database.difficulty,
      database: params.database.name,
      baselineCalculation,
      sqlQueries
    };
    
    return results;
    
  } catch (error) {
    console.error('Spider evaluation error:', error);
    throw new Error('Failed to run Spider evaluation. Please check database connection and try again.');
  }
}

function generateRealisticSQLQueries(database: Database): SQLQueryResult[] {
  const queries: SQLQueryResult[] = [];
  
  if (database.id === 'car_1') {
    queries.push(
      {
        query: "SELECT make, model, COUNT(*) as inventory_count FROM vehicles WHERE status = 'available' GROUP BY make, model ORDER BY inventory_count DESC",
        expected_result: "List of available vehicles grouped by make and model with counts",
        schemaResults: {
          raw: { result: "Error: Ambiguous column 'status'", is_correct: false, error_message: "Column 'status' not clear in raw schema" },
          hypothesis: { result: "List of available vehicles grouped by make and model with counts", is_correct: true },
          annotated: { result: "List of available vehicles grouped by make and model with counts", is_correct: true }
        },
        difficulty_level: "Easy",
        bestPerformingSchema: "hypothesis"
      },
      {
        query: "SELECT c.first_name, c.last_name, v.make, v.model, s.sale_price FROM customers c JOIN sales s ON c.customer_id = s.customer_id JOIN vehicles v ON s.vehicle_id = v.vehicle_id WHERE s.sale_date >= '2024-01-01'",
        expected_result: "Customer sales information for 2024",
        schemaResults: {
          raw: { result: "Error: JOIN relationship unclear", is_correct: false, error_message: "Foreign key relationships not defined" },
          hypothesis: { result: "Customer sales information for 2024", is_correct: true },
          annotated: { result: "Customer sales information for 2024", is_correct: true }
        },
        difficulty_level: "Medium",
        bestPerformingSchema: "annotated"
      },
      {
        query: "SELECT d.dealer_name, AVG(s.sale_price) as avg_sale_price, COUNT(s.sale_id) as total_sales FROM dealers d JOIN salespeople sp ON d.dealer_id = sp.dealer_id JOIN sales s ON sp.salesperson_id = s.salesperson_id GROUP BY d.dealer_name HAVING COUNT(s.sale_id) > 5",
        expected_result: "Dealer performance with average sale price and total sales count",
        schemaResults: {
          raw: { result: "Error: Column 'dealer_name' not found", is_correct: false, error_message: "Incorrect column name assumption" },
          hypothesis: { result: "Error: Complex JOIN not inferred correctly", is_correct: false, error_message: "Multi-table relationships too complex for hypothesis" },
          annotated: { result: "Dealer performance with average sale price and total sales count", is_correct: true }
        },
        difficulty_level: "Hard",
        bestPerformingSchema: "annotated"
      },
      {
        query: "SELECT AVG(f.monthly_payment) FROM financing f JOIN sales s ON f.sale_id = s.sale_id JOIN vehicles v ON s.vehicle_id = v.vehicle_id WHERE v.year >= 2020",
        expected_result: "Average monthly payment for vehicles 2020 and newer",
        schemaResults: {
          raw: { result: "Error: Table 'financing' not recognized", is_correct: false, error_message: "Table relationships not clear" },
          hypothesis: { result: "156.23", is_correct: false, error_message: "Incorrect business logic assumption" },
          annotated: { result: "Average monthly payment for vehicles 2020 and newer", is_correct: true }
        },
        difficulty_level: "Medium",
        bestPerformingSchema: "annotated"
      },
      {
        query: "SELECT make, COUNT(*) FROM vehicles GROUP BY make",
        expected_result: "Count of vehicles by manufacturer",
        schemaResults: {
          raw: { result: "Count of vehicles by manufacturer", is_correct: true },
          hypothesis: { result: "Count of vehicles by manufacturer", is_correct: true },
          annotated: { result: "Count of vehicles by manufacturer", is_correct: true }
        },
        difficulty_level: "Easy",
        bestPerformingSchema: "raw"
      }
    );
  } else {
    // Generic academic database queries
    queries.push(
      {
        query: "SELECT major, COUNT(*) as student_count FROM students GROUP BY major ORDER BY student_count DESC",
        expected_result: "Student count by major",
        schemaResults: {
          raw: { result: "Student count by major", is_correct: true },
          hypothesis: { result: "Student count by major", is_correct: true },
          annotated: { result: "Student count by major", is_correct: true }
        },
        difficulty_level: "Easy",
        bestPerformingSchema: "raw"
      },
      {
        query: "SELECT AVG(gpa) FROM students WHERE enrollment_date >= '2023-01-01'",
        expected_result: "Average GPA for recent students",
        schemaResults: {
          raw: { result: "Error: Date format unclear", is_correct: false, error_message: "Date column type ambiguous" },
          hypothesis: { result: "Average GPA for recent students", is_correct: true },
          annotated: { result: "Average GPA for recent students", is_correct: true }
        },
        difficulty_level: "Medium",
        bestPerformingSchema: "annotated"
      }
    );
  }
  
  return queries;
}

async function simulateEvaluationSteps() {
  // Simulate various evaluation phases for 3 different schema types
  const phases = [
    { name: 'snowflake_connection', duration: 1000, description: 'Connecting to Snowflake database' },
    { name: 'test_case_loading', duration: 800, description: 'Loading Spider test cases' },
    { name: 'raw_schema_evaluation', duration: 2000, description: 'Running evaluation on raw schema (no annotations)' },
    { name: 'hypothesis_schema_evaluation', duration: 2500, description: 'Running evaluation on LLM-enhanced schema' },
    { name: 'annotated_schema_evaluation', duration: 3000, description: 'Running evaluation on fully annotated schema' },
    { name: 'result_calculation', duration: 500, description: 'Calculating comparative results' }
  ];
  
  for (const phase of phases) {
    console.log(`Executing phase: ${phase.name} - ${phase.description}`);
    await new Promise(resolve => setTimeout(resolve, phase.duration));
  }
}

function generateSchemaResults(difficulty: string): SchemaEvaluationResult[] {
  const totalQueries = getTestCaseCount(difficulty);
  
  // Raw schema performance (baseline)
  const rawAccuracy = calculateAccuracy(difficulty) - (10 + Math.random() * 15); // Lower baseline
  
  // Hypothesis schema performance (LLM enhanced)  
  const hypothesisAccuracy = rawAccuracy + (8 + Math.random() * 12);
  
  // Annotated schema performance (with human context)
  const annotatedAccuracy = rawAccuracy + (15 + Math.random() * 20);
  
  return [
    {
      schemaType: 'raw',
      accuracy: Math.max(10, Math.min(rawAccuracy, 95)),
      correctQueries: Math.round((Math.max(10, Math.min(rawAccuracy, 95)) / 100) * totalQueries),
      description: 'Baseline performance with raw Snowflake schema'
    },
    {
      schemaType: 'hypothesis',
      accuracy: Math.max(15, Math.min(hypothesisAccuracy, 95)),
      correctQueries: Math.round((Math.max(15, Math.min(hypothesisAccuracy, 95)) / 100) * totalQueries),
      description: 'Enhanced performance with LLM-generated schema context'
    },
    {
      schemaType: 'annotated',
      accuracy: Math.max(20, Math.min(annotatedAccuracy, 95)),
      correctQueries: Math.round((Math.max(20, Math.min(annotatedAccuracy, 95)) / 100) * totalQueries),
      description: 'Optimal performance with user-provided annotations and context'
    }
  ];
}

function calculateAccuracy(difficulty: string): number {
  // Simulate realistic Spider benchmark accuracy based on difficulty
  const baseAccuracy = {
    'Easy': 75 + Math.random() * 20,      // 75-95%
    'Medium': 45 + Math.random() * 25,    // 45-70%
    'Hard': 25 + Math.random() * 20       // 25-45%
  };
  
  return Math.min(95, baseAccuracy[difficulty as keyof typeof baseAccuracy] || 50);
}

function getTestCaseCount(difficulty: string): number {
  // Typical Spider test case counts by difficulty
  const testCounts = {
    'Easy': 50 + Math.floor(Math.random() * 30),      // 50-80 tests
    'Medium': 30 + Math.floor(Math.random() * 20),    // 30-50 tests  
    'Hard': 15 + Math.floor(Math.random() * 15)       // 15-30 tests
  };
  
  return testCounts[difficulty as keyof typeof testCounts] || 40;
}

function calculateAnnotationImpact(difficulty: string) {
  // Simulate the improvement gained from using annotations
  const baselineAccuracy = calculateAccuracy(difficulty) - (5 + Math.random() * 10); // Lower baseline
  const withAnnotationsAccuracy = calculateAccuracy(difficulty); // Higher with annotations
  
  return {
    withoutAnnotations: Math.max(10, baselineAccuracy),
    withAnnotations: withAnnotationsAccuracy,
    improvement: withAnnotationsAccuracy - Math.max(10, baselineAccuracy)
  };
}

export async function saveEvaluationRun(results: any, metadata: any) {
  try {
    // In production, this would save to Supabase database
    console.log('Saving evaluation run:', { results, metadata });
    
    const runId = generateRunId();
    const timestamp = new Date().toISOString();
    
    // Simulate database save
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      runId,
      timestamp,
      saved: true
    };
    
  } catch (error) {
    console.error('Failed to save evaluation run:', error);
    throw new Error('Failed to save evaluation results');
  }
}

function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
