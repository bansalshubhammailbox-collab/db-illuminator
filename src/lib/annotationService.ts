import { Database } from "@/contexts/EvaluationContext";

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

interface InteractiveAnnotationResult {
  type: 'interactive';
  questions: TableQuestionSet[];
  schemaInfo: any;
  samplingInfo: string;
}

interface TableQuestionSet {
  table_name: string;
  sampling_info: string;
  table_hypothesis: string;
  columns: ColumnQuestion[];
}

interface ColumnQuestion {
  column_name: string;
  data_type: string;
  sample_values: string[];
  enum_values_found: string[];
  hypothesis: string;
  questions_for_user: UserQuestion[];
}

interface UserQuestion {
  question_text: string;
  question_type: 'yes_no' | 'multiple_choice' | 'free_text_definitions';
  options?: string[];
}

interface AnnotationOptions {
  rowLimit?: number;
  processType?: 'standard' | 'interactive';
  customSampling?: string;
}

export async function generateDatabaseAnnotations(
  database: Database,
  customPrompt: string,
  options?: AnnotationOptions
): Promise<TableAnnotation[] | InteractiveAnnotationResult> {
  try {
    const response = await fetch('/functions/v1/generate-annotations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        database,
        customPrompt,
        options
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error calling generate-annotations function:', error);
    throw new Error(`Failed to generate annotations: ${error.message}`);
  }
}

export async function processUserAnswersAndGenerateAnnotations(
  interactiveResult: InteractiveAnnotationResult,
  userAnswers: Record<string, any>
): Promise<TableAnnotation[]> {
  try {
    console.log('Processing user answers to generate final annotations');
    
    // Create final annotations incorporating user feedback
    const finalAnnotations: TableAnnotation[] = interactiveResult.questions.map(tableQuestion => {
      const tableAnswers = userAnswers[tableQuestion.table_name] || {};
      
      return {
        tableName: tableQuestion.table_name,
        description: `${tableQuestion.table_hypothesis} ${tableAnswers.table_description || ''}`.trim(),
        columns: tableQuestion.columns.map(col => ({
          name: col.column_name,
          type: col.data_type,
          description: `${col.hypothesis} ${tableAnswers[col.column_name]?.description || ''}`.trim(),
          businessContext: tableAnswers[col.column_name]?.businessContext || `Part of ${tableQuestion.table_name} entity definition`
        }))
      };
    });
    
    return finalAnnotations;
    
  } catch (error) {
    console.error('Error processing user answers:', error);
    throw new Error('Failed to process user answers and generate final annotations');
  }
}

export async function connectToSnowflake(database: Database) {
  try {
    console.log(`Testing Snowflake connection for ${database.name}`);
    
    const response = await fetch('/functions/v1/test-snowflake-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ database })
    });

    if (!response.ok) {
      throw new Error(`Connection test failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Snowflake connection error:', error);
    throw new Error('Failed to connect to Snowflake. Please check your credentials.');
  }
}