import { Database } from "@/contexts/EvaluationContext";
import { config } from "@/config/credentials";

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

// Mock database schemas for demo purposes
const mockSchemas: Record<string, any> = {
  academic: {
    tables: [
      {
        name: "student",
        columns: [
          { name: "student_id", type: "INT", description: "Unique identifier for each student" },
          { name: "name", type: "VARCHAR", description: "Full name of the student" },
          { name: "email", type: "VARCHAR", description: "Student's email address" },
          { name: "major", type: "VARCHAR", description: "Academic major or field of study" }
        ]
      },
      {
        name: "course",
        columns: [
          { name: "course_id", type: "INT", description: "Unique identifier for each course" },
          { name: "title", type: "VARCHAR", description: "Course title or name" },
          { name: "credits", type: "INT", description: "Number of credit hours" },
          { name: "department", type: "VARCHAR", description: "Academic department offering the course" }
        ]
      }
    ]
  },
  // Add more mock schemas as needed
};

export async function generateDatabaseAnnotations(
  database: Database,
  customPrompt: string
): Promise<TableAnnotation[]> {
  try {
    // For demo purposes, we'll simulate the API call with mock data
    // In production, this would make actual API calls to Gemini/LLM
    
    console.log(`Generating annotations for ${database.name} with prompt length: ${customPrompt.length}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if credentials are available
    if (!config.gemini.apiKey || config.gemini.apiKey === 'your_gemini_api_key_here') {
      // Use mock data for demo
      return generateMockAnnotations(database);
    }
    
    // In production, this would be the actual Gemini API call:
    /*
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.gemini.apiKey}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${customPrompt}\n\nDatabase: ${database.name}\nTables: ${database.tables}\nDifficulty: ${database.difficulty}`
          }]
        }]
      })
    });
    
    const data = await response.json();
    return parseAnnotationsFromResponse(data);
    */
    
    // For now, return enhanced mock data
    return generateMockAnnotations(database);
    
  } catch (error) {
    console.error('Error generating annotations:', error);
    throw new Error('Failed to generate annotations. Please check your API credentials and try again.');
  }
}

function generateMockAnnotations(database: Database): TableAnnotation[] {
  const mockSchema = mockSchemas[database.id] || mockSchemas.academic;
  
  return mockSchema.tables.map((table: any) => ({
    tableName: table.name,
    description: `${table.name.charAt(0).toUpperCase() + table.name.slice(1)} table stores information about ${table.name}s in the ${database.name} database. This is part of a ${database.difficulty.toLowerCase()}-complexity schema with ${database.tables} total tables.`,
    columns: table.columns.map((col: any) => ({
      name: col.name,
      type: col.type,
      description: col.description,
      businessContext: `Used in queries for ${database.difficulty.toLowerCase()}-level Spider benchmark evaluation`
    }))
  }));
}

export async function connectToSnowflake(database: Database) {
  try {
    // This would connect to the actual Snowflake database
    console.log(`Connecting to Snowflake database: ${database.name}`);
    
    if (!config.snowflake.user || config.snowflake.user === 'your_username') {
      throw new Error('Snowflake credentials not configured');
    }
    
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      status: 'connected',
      database: database.name,
      endpoint: config.snowflake.account
    };
    
  } catch (error) {
    console.error('Snowflake connection error:', error);
    throw new Error('Failed to connect to Snowflake. Please check your credentials.');
  }
}