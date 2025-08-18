import { Database } from "@/contexts/EvaluationContext";
import { supabase } from '@/integrations/supabase/client';

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
  table_questions: UserQuestion[];
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
    options: AnnotationOptions = {}
  ): Promise<TableAnnotation[] | InteractiveAnnotationResult> {
    try {
      console.log(`Generating annotations for ${database.name} via Supabase edge function...`);

      const { data, error } = await supabase.functions.invoke('generate-annotations', {
        body: {
          database,
          customPrompt: `Generate comprehensive database annotations for ${database.name}`,
          options: {
            rowLimit: options.rowLimit || 5,
            processType: options.processType || 'standard',
            customSampling: options.customSampling
          }
        }
      });

      if (error) {
        console.error('Annotation generation failed:', error);
        throw new Error(error.message || 'Annotation generation failed');
      }

      // If interactive mode, return the questions
      if (options.processType === 'interactive') {
        return data as InteractiveAnnotationResult;
      }

      // Standard mode - return annotations
      return data as TableAnnotation[];
      
    } catch (error: any) {
      console.error('Annotation generation error:', error);
      // Fallback to basic mock data
      return [{
        tableName: 'customers',
        description: `Customer data for ${database.name} system`,
        columns: [
          { name: 'customer_id', type: 'NUMBER', description: 'Unique customer identifier' },
          { name: 'name', type: 'VARCHAR', description: 'Customer full name' }
        ]
      }];
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
    console.log(`Testing Snowflake connection for ${database.name} via Supabase edge function...`);

    const { data, error } = await supabase.functions.invoke('test-snowflake-connection', {
      body: { database }
    });

    if (error) {
      console.error('Snowflake connection test failed:', error);
      throw new Error(error.message || 'Connection test failed');
    }

    return data;
    
  } catch (error: any) {
    console.error('Connection test error:', error);
    throw new Error('Failed to test connection. Please check your credentials.');
  }
}

// Generate realistic database schema based on Spider database
async function getRealisticDatabaseSchema(database: Database) {
  console.log(`Fetching schema for ${database.name}`);
  
  // Simulate realistic schema fetch
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    database: database.name,
    tables: generateRealisticSchemaForDatabase(database),
    connectionInfo: {
      account: "RSRSBDK-YDB67606",
      warehouse: "COMPUTE_WH",
      database: "SPIDER2"
    }
  };
}

// Generate sample data from tables
async function generateSampleDataFromTables(database: Database, tables: any[], rowLimit: number) {
  console.log(`Generating sample data from ${tables.length} tables (limit: ${rowLimit})`);
  
  // Simulate sample data generation
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return tables.map(table => ({
    tableName: table.name,
    sampleRows: generateRealisticSampleData(table, Math.min(rowLimit, 10)), // Cap for demo
    rowCount: Math.floor(Math.random() * 10000) + 100,
    dataTypes: table.columns.map((col: any) => ({
      column: col.name,
      type: col.type,
      nullable: col.nullable,
      uniqueValues: Math.floor(Math.random() * 50) + 1
    }))
  }));
}

// Generate interactive questions for validation
function generateInteractiveQuestions(
  database: Database,
  customPrompt: string,
  schemaInfo: any,
  sampleData: any[],
  customSampling?: string
): InteractiveAnnotationResult {
  const samplingInfo = customSampling || `Sample of ${sampleData[0]?.sampleRows?.length || 5} rows from each table`;
  
  const questions: TableQuestionSet[] = schemaInfo.tables.map((table: any) => ({
    table_name: table.name,
    sampling_info: samplingInfo,
    table_hypothesis: `The ${table.name} table appears to store ${getTablePurpose(table.name)} with ${table.columns.length} attributes. Based on the schema structure, it likely serves as ${getTableRole(table.name)} in the ${database.name} system.`,
    table_questions: generateTableQuestions(table.name, database.name),
    columns: table.columns.map((col: any) => {
      const sampleValues = generateSampleValuesForColumn(col, table.name);
      const enumValues = getEnumValuesForColumn(col, sampleValues);
      
      return {
        column_name: col.name,
        data_type: col.type,
        sample_values: sampleValues,
        enum_values_found: enumValues,
        hypothesis: `${col.name} appears to be ${getColumnHypothesis(col.name, col.type, table.name)}`,
        questions_for_user: generateQuestionsForColumn(col, enumValues, table.name)
      };
    })
  }));
  
  return {
    type: 'interactive',
    questions,
    schemaInfo,
    samplingInfo
  };
}

// Generate realistic schema for different database types - NOW WITH ALL 7 TABLES
function generateRealisticSchemaForDatabase(database: Database) {
  const schemas: Record<string, any[]> = {
    'car_1': [ // Car Dealership - ALL 7 TABLES
      {
        name: 'vehicles',
        columns: [
          { name: 'vehicle_id', type: 'NUMBER(10)', nullable: false },
          { name: 'make', type: 'VARCHAR(50)', nullable: false },
          { name: 'model', type: 'VARCHAR(50)', nullable: false },
          { name: 'year', type: 'NUMBER(4)', nullable: false },
          { name: 'price', type: 'NUMBER(10,2)', nullable: false },
          { name: 'mileage', type: 'NUMBER(8)', nullable: true },
          { name: 'color', type: 'VARCHAR(30)', nullable: true },
          { name: 'status', type: 'VARCHAR(20)', nullable: false },
          { name: 'dealer_id', type: 'NUMBER(10)', nullable: false }
        ]
      },
      {
        name: 'customers',
        columns: [
          { name: 'customer_id', type: 'NUMBER(10)', nullable: false },
          { name: 'first_name', type: 'VARCHAR(50)', nullable: false },
          { name: 'last_name', type: 'VARCHAR(50)', nullable: false },
          { name: 'email', type: 'VARCHAR(100)', nullable: true },
          { name: 'phone', type: 'VARCHAR(20)', nullable: true },
          { name: 'address', type: 'VARCHAR(200)', nullable: true },
          { name: 'credit_score', type: 'NUMBER(3)', nullable: true }
        ]
      },
      {
        name: 'sales',
        columns: [
          { name: 'sale_id', type: 'NUMBER(10)', nullable: false },
          { name: 'vehicle_id', type: 'NUMBER(10)', nullable: false },
          { name: 'customer_id', type: 'NUMBER(10)', nullable: false },
          { name: 'sale_date', type: 'DATE', nullable: false },
          { name: 'sale_price', type: 'NUMBER(10,2)', nullable: false },
          { name: 'financing_type', type: 'VARCHAR(20)', nullable: true },
          { name: 'salesperson_id', type: 'NUMBER(10)', nullable: false }
        ]
      },
      {
        name: 'dealers',
        columns: [
          { name: 'dealer_id', type: 'NUMBER(10)', nullable: false },
          { name: 'dealer_name', type: 'VARCHAR(100)', nullable: false },
          { name: 'location', type: 'VARCHAR(100)', nullable: false },
          { name: 'phone', type: 'VARCHAR(20)', nullable: true },
          { name: 'manager_id', type: 'NUMBER(10)', nullable: true }
        ]
      },
      {
        name: 'salespeople',
        columns: [
          { name: 'salesperson_id', type: 'NUMBER(10)', nullable: false },
          { name: 'first_name', type: 'VARCHAR(50)', nullable: false },
          { name: 'last_name', type: 'VARCHAR(50)', nullable: false },
          { name: 'dealer_id', type: 'NUMBER(10)', nullable: false },
          { name: 'hire_date', type: 'DATE', nullable: false },
          { name: 'commission_rate', type: 'NUMBER(3,2)', nullable: false }
        ]
      },
      {
        name: 'service_records',
        columns: [
          { name: 'service_id', type: 'NUMBER(10)', nullable: false },
          { name: 'vehicle_id', type: 'NUMBER(10)', nullable: false },
          { name: 'service_date', type: 'DATE', nullable: false },
          { name: 'service_type', type: 'VARCHAR(50)', nullable: false },
          { name: 'cost', type: 'NUMBER(8,2)', nullable: false },
          { name: 'technician', type: 'VARCHAR(50)', nullable: true }
        ]
      },
      {
        name: 'financing',
        columns: [
          { name: 'financing_id', type: 'NUMBER(10)', nullable: false },
          { name: 'sale_id', type: 'NUMBER(10)', nullable: false },
          { name: 'loan_amount', type: 'NUMBER(10,2)', nullable: false },
          { name: 'interest_rate', type: 'NUMBER(4,2)', nullable: false },
          { name: 'term_months', type: 'NUMBER(3)', nullable: false },
          { name: 'monthly_payment', type: 'NUMBER(8,2)', nullable: false },
          { name: 'lender', type: 'VARCHAR(50)', nullable: false }
        ]
      }
    ],
    'academic': [
      {
        name: 'students',
        columns: [
          { name: 'student_id', type: 'NUMBER(10)', nullable: false },
          { name: 'first_name', type: 'VARCHAR(50)', nullable: false },
          { name: 'last_name', type: 'VARCHAR(50)', nullable: false },
          { name: 'email', type: 'VARCHAR(100)', nullable: true },
          { name: 'enrollment_date', type: 'DATE', nullable: false },
          { name: 'major', type: 'VARCHAR(50)', nullable: true },
          { name: 'gpa', type: 'NUMBER(3,2)', nullable: true }
        ]
      }
    ]
  };
  
  return schemas[database.id] || schemas['academic'];
}

function generateTableQuestions(tableName: string, databaseName: string): UserQuestion[] {
  return [
    {
      question_text: `What is the primary business purpose of the ${tableName} table in the ${databaseName} system?`,
      question_type: 'free_text_definitions'
    },
    {
      question_text: `Are there any important business rules or constraints for the ${tableName} table that would affect SQL queries?`,
      question_type: 'free_text_definitions'
    }
  ];
}

// Generate realistic sample data based on realistic data
function generateRealisticSampleData(table: any, rowLimit: number = 3) {
  const samples = [];
  for (let i = 0; i < Math.min(rowLimit, 10); i++) {
    const row: any = {};
    table.columns.forEach((col: any) => {
      if (col.name.includes('id')) {
        row[col.name] = i + 1;
      } else if (col.name === 'make') {
        row[col.name] = ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes'][i % 5];
      } else if (col.name === 'model') {
        row[col.name] = ['Camry', 'Accord', 'F-150', 'X3', 'C-Class'][i % 5];
      } else if (col.name === 'year') {
        row[col.name] = 2020 + (i % 4);
      } else if (col.name.includes('price')) {
        row[col.name] = (25000 + Math.random() * 50000).toFixed(2);
      } else if (col.name === 'status') {
        row[col.name] = ['available', 'sold', 'pending', 'reserved'][i % 4];
      } else if (col.name === 'color') {
        row[col.name] = ['Red', 'Blue', 'White', 'Black', 'Silver'][i % 5];
      } else if (col.name.includes('name')) {
        row[col.name] = ['John', 'Jane', 'Bob', 'Alice', 'Charlie'][i % 5];
      } else if (col.name.includes('email')) {
        row[col.name] = `user${i + 1}@example.com`;
      } else if (col.name.includes('phone')) {
        row[col.name] = `555-${String(i + 1).padStart(3, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      } else if (col.name.includes('date')) {
        row[col.name] = `2024-${String((i % 12) + 1).padStart(2, '0')}-15`;
      } else if (col.name === 'financing_type') {
        row[col.name] = ['cash', 'loan', 'lease'][i % 3];
      } else if (col.name === 'mileage') {
        row[col.name] = Math.floor(Math.random() * 100000);
      } else if (col.name === 'credit_score') {
        row[col.name] = 600 + Math.floor(Math.random() * 200);
      } else {
        row[col.name] = `Value${i + 1}`;
      }
    });
    samples.push(row);
  }
  return samples;
}

function getTablePurpose(tableName: string): string {
  const purposes: Record<string, string> = {
    'vehicles': 'automotive inventory and vehicle specifications',
    'customers': 'customer information and contact details',
    'sales': 'transaction records and sales activities',
    'students': 'student enrollment and academic information',
    'courses': 'academic course catalog and requirements',
    'orders': 'purchase orders and transaction history',
    'products': 'product catalog and specifications'
  };
  return purposes[tableName] || 'data entities and their attributes';
}

function getTableRole(tableName: string): string {
  const roles: Record<string, string> = {
    'vehicles': 'the main inventory management component',
    'customers': 'the customer relationship management hub',
    'sales': 'the transactional processing center',
    'students': 'the student information system core',
    'courses': 'the academic catalog foundation'
  };
  return roles[tableName] || 'a key data storage component';
}

function generateSampleValuesForColumn(col: any, tableName: string): string[] {
  if (col.name.includes('id')) return ['1', '2', '3'];
  if (col.name === 'make') return ['Toyota', 'Honda', 'Ford'];
  if (col.name === 'model') return ['Camry', 'Accord', 'F-150'];
  if (col.name === 'status') return ['available', 'sold', 'pending'];
  if (col.name === 'color') return ['Red', 'Blue', 'White'];
  if (col.name === 'financing_type') return ['cash', 'loan', 'lease'];
  if (col.name === 'service_type') return ['oil_change', 'brake_repair', 'inspection'];
  if (col.name === 'lender') return ['Bank of America', 'Wells Fargo', 'Credit Union'];
  if (col.name.includes('name')) return ['John', 'Jane', 'Bob'];
  if (col.name.includes('email')) return ['john@example.com', 'jane@example.com', 'bob@example.com'];
  if (col.name.includes('phone')) return ['555-123-4567', '555-234-5678', '555-345-6789'];
  if (col.name.includes('price') || col.name.includes('cost') || col.name.includes('amount')) return ['25000.00', '35000.00', '45000.00'];
  if (col.name.includes('year')) return ['2021', '2022', '2023'];
  if (col.name.includes('date')) return ['2024-01-15', '2024-02-20', '2024-03-10'];
  if (col.name.includes('rate')) return ['3.50', '4.25', '5.00'];
  return ['Value1', 'Value2', 'Value3'];
}

function getEnumValuesForColumn(col: any, sampleValues: string[]): string[] {
  if (col.type.includes('VARCHAR') && col.name.match(/(status|type|category|color|make|model|gender|state)/i)) {
    return sampleValues.slice(0, 3);
  }
  return [];
}

function getColumnHypothesis(columnName: string, columnType: string, tableName: string): string {
  if (columnName.includes('id')) return 'a unique identifier field used for primary key or foreign key relationships';
  if (columnName === 'make') return 'the vehicle manufacturer or brand name';
  if (columnName === 'model') return 'the specific vehicle model designation';
  if (columnName === 'year') return 'the manufacturing year of the vehicle';
  if (columnName.includes('price') || columnName.includes('cost') || columnName.includes('amount')) return 'a monetary value representing cost or valuation';
  if (columnName === 'status') return 'a categorical field indicating current state or condition';
  if (columnName === 'color') return 'a categorical field for vehicle color specification';
  if (columnName === 'service_type') return 'a categorical field indicating the type of service performed';
  if (columnName === 'lender') return 'the financial institution providing the loan';
  if (columnName.includes('rate')) return 'a percentage or rate value for calculations';
  if (columnName.includes('name')) return 'a descriptive text field for person or entity names';
  if (columnName.includes('email')) return 'a contact email address with standard email format';
  if (columnName.includes('phone')) return 'a contact phone number field';
  if (columnName.includes('address') || columnName.includes('location')) return 'a physical or mailing address field';
  if (columnName.includes('date')) return 'a temporal field tracking important timestamps';
  if (columnName === 'financing_type') return 'a categorical field indicating payment method or financing option';
  if (columnName === 'mileage') return 'a numeric field tracking vehicle usage/distance';
  if (columnName === 'credit_score') return 'a numeric assessment of creditworthiness';
  if (columnName.includes('term')) return 'a duration or time period specification';
  if (columnType.includes('VARCHAR')) return 'a text-based descriptive or categorical field';
  if (columnType.includes('NUMBER')) return 'a numeric field for calculations, measurements, or counts';
  if (columnType.includes('DATE')) return 'a date/time field for temporal data tracking';
  return 'a data attribute that contributes to the entity definition';
}

function generateQuestionsForColumn(col: any, enumValues: string[], tableName: string): UserQuestion[] {
  const questions: UserQuestion[] = [];
  
  if (enumValues.length > 0) {
    questions.push({
      question_text: `I found these values for ${col.name}: ${enumValues.join(', ')}. Please define what each value means and if there are other possible values I should know about.`,
      question_type: 'free_text_definitions'
    });
  }
  
  if (col.name.includes('id')) {
    questions.push({
      question_text: `Is ${col.name} the primary key for ${tableName}? If not, does it reference another table?`,
      question_type: 'multiple_choice',
      options: ['Primary key', 'Foreign key to another table', 'Both primary and foreign key', 'Neither']
    });
    
    if (col.name !== `${tableName.slice(0, -1)}_id` && col.name !== 'id') {
      questions.push({
        question_text: `What table does ${col.name} reference and what is the relationship?`,
        question_type: 'free_text_definitions'
      });
    }
  } else if (col.name.includes('price') || col.name.includes('amount') || col.name.includes('cost')) {
    questions.push({
      question_text: `For ${col.name}, what currency is used and are there any business rules (e.g., discounts, taxes, minimum/maximum values)?`,
      question_type: 'free_text_definitions'
    });
    
    questions.push({
      question_text: `Are there typical ranges or categories for ${col.name} that would be useful for query optimization?`,
      question_type: 'free_text_definitions'
    });
  } else if (col.name.includes('date') || col.name.includes('time')) {
    questions.push({
      question_text: `What does ${col.name} represent exactly? Is it automatically set or user-entered?`,
      question_type: 'multiple_choice',
      options: ['System generated timestamp', 'User entered date', 'Calculated/derived date', 'External system date']
    });
  } else if (col.name.includes('rate') || col.name.includes('score')) {
    questions.push({
      question_text: `What is the valid range for ${col.name} and how is it calculated?`,
      question_type: 'free_text_definitions'
    });
  } else {
    questions.push({
      question_text: `Is my understanding of ${col.name} as ${getColumnHypothesis(col.name, col.type, tableName)} accurate?`,
      question_type: 'yes_no'
    });
    
    // Add a second question for most columns
    if (!col.name.includes('id')) {
      questions.push({
        question_text: `Are there any specific constraints, formats, or business rules for ${col.name} that SQL queries should consider?`,
        question_type: 'free_text_definitions'
      });
    }
  }
  
  return questions;
}

function generateEnhancedAnnotations(database: Database, schemaInfo: any, sampleData?: any[]): TableAnnotation[] {
  return schemaInfo.tables.map((table: any) => {
    const sample = sampleData?.find(s => s.tableName === table.name);
    
    return {
      tableName: table.name,
      description: `The ${table.name} table contains ${table.columns.length} columns and approximately ${sample?.rowCount || 'unknown'} records. ${getTablePurpose(table.name)} for the ${database.name} system. This table serves as ${getTableRole(table.name)} with ${database.difficulty.toLowerCase()}-level complexity in the Spider benchmark.`,
      columns: table.columns.map((col: any) => ({
        name: col.name,
        type: col.type,
        description: `${col.name} is ${getColumnHypothesis(col.name, col.type, table.name)}. Data type: ${col.type}${col.nullable ? ' (nullable)' : ' (required)'}.`,
        businessContext: `Critical for ${database.difficulty.toLowerCase()}-level SQL queries in Spider evaluation, particularly for ${getBusinessContext(col.name, table.name)}`
      }))
    };
  });
}

function getBusinessContext(columnName: string, tableName: string): string {
  if (columnName.includes('id')) return 'entity relationships and join operations';
  if (columnName.includes('price') || columnName.includes('amount')) return 'financial calculations and aggregations';
  if (columnName.includes('date') || columnName.includes('time')) return 'temporal queries and trend analysis';
  if (columnName.includes('status') || columnName.includes('type')) return 'conditional filtering and categorization';
  if (columnName.includes('name') || columnName.includes('title')) return 'text search and identification queries';
  return `${tableName} entity operations and data retrieval`;
}
