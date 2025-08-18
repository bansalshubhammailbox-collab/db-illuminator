import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  id: string;
  name: string;
  difficulty: string;
  tables: number;
}

interface SpiderEvaluation {
  database: Database;
  sqlQuery: string;
  expectedResult?: any;
  evaluationType: 'execution' | 'accuracy' | 'both';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { database, sqlQuery, expectedResult, evaluationType }: SpiderEvaluation = await req.json();

    console.log(`Running Spider evaluation for ${database.name}: ${evaluationType}`);

    // Get credentials from environment variables
    const snowflakeUser = Deno.env.get('SNOWFLAKE_USER');
    const snowflakePassword = Deno.env.get('SNOWFLAKE_PASSWORD');
    const snowflakeAccount = Deno.env.get('SNOWFLAKE_ACCOUNT');

    if (!snowflakeUser || !snowflakePassword || !snowflakeAccount) {
      throw new Error('Snowflake credentials not configured');
    }

    const snowflakeConfig = {
      user: snowflakeUser,
      password: snowflakePassword,
      account: snowflakeAccount,
      warehouse: "COMPUTE_WH",
      database: "SPIDER2",
      schema: "PUBLIC"
    };

    // Authenticate with Snowflake
    const authResult = await authenticateSnowflake(snowflakeConfig);
    if (!authResult.success) {
      throw new Error(`Snowflake authentication failed: ${authResult.error}`);
    }

    // Execute the SQL query
    const executionResult = await executeSpiderQuery(authResult.sessionToken, snowflakeConfig, sqlQuery, database);

    // Evaluate based on type
    let evaluation = {};
    
    if (evaluationType === 'execution' || evaluationType === 'both') {
      evaluation = {
        ...evaluation,
        execution: {
          success: executionResult.success,
          rowCount: executionResult.data?.length || 0,
          executionTime: executionResult.executionTime,
          error: executionResult.error
        }
      };
    }

    if (evaluationType === 'accuracy' || evaluationType === 'both') {
      if (expectedResult && executionResult.success) {
        const accuracy = compareResults(executionResult.data, expectedResult);
        evaluation = {
          ...evaluation,
          accuracy: {
            score: accuracy.score,
            matches: accuracy.matches,
            differences: accuracy.differences,
            exactMatch: accuracy.exactMatch
          }
        };
      } else {
        evaluation = {
          ...evaluation,
          accuracy: {
            score: 0,
            matches: 0,
            differences: ['No expected result provided or query failed'],
            exactMatch: false
          }
        };
      }
    }

    return new Response(
      JSON.stringify({
        database: database.name,
        sqlQuery,
        evaluation,
        resultData: executionResult.data?.slice(0, 10), // Return first 10 rows
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in run-spider-evaluation:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to run Spider evaluation',
        details: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

// Snowflake authentication function
async function authenticateSnowflake(config: any) {
  try {
    const authUrl = `https://${config.account}.snowflakecomputing.com/session/v1/login-request`;
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        data: {
          CLIENT_APP_ID: 'Spider2Evaluator',
          CLIENT_APP_VERSION: '1.0.0',
          loginName: config.user,
          password: config.password,
          clientEnvironment: {
            APPLICATION: 'Spider2Evaluator'
          }
        }
      })
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      return { success: false, error: `Authentication failed: ${errorText}` };
    }

    const authData = await authResponse.json();
    
    if (!authData.success) {
      return { success: false, error: `Authentication failed: ${authData.message}` };
    }

    return { success: true, sessionToken: authData.data.token };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Execute SQL query on Snowflake
async function executeSpiderQuery(sessionToken: string, config: any, sqlQuery: string, database: Database) {
  const startTime = Date.now();
  
  try {
    const queryUrl = `https://${config.account}.snowflakecomputing.com/queries/v1/query-request`;
    
    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        statement: sqlQuery,
        timeout: 120,
        database: config.database,
        schema: config.schema,
        warehouse: config.warehouse
      })
    });

    const executionTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        error: `Query execution failed: ${response.statusText}`,
        executionTime
      };
    }

    const result = await response.json();
    
    if (result.success === false) {
      return {
        success: false,
        error: result.message || 'Query execution failed',
        executionTime
      };
    }

    return {
      success: true,
      data: result.data || [],
      rowCount: result.data?.length || 0,
      executionTime,
      queryId: result.statementHandle
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      executionTime: Date.now() - startTime
    };
  }
}

// Compare actual results with expected results
function compareResults(actualData: any[], expectedData: any[]) {
  if (!actualData || !expectedData) {
    return {
      score: 0,
      matches: 0,
      differences: ['Missing data for comparison'],
      exactMatch: false
    };
  }

  const actualRows = actualData.length;
  const expectedRows = expectedData.length;
  
  if (actualRows !== expectedRows) {
    return {
      score: 0,
      matches: 0,
      differences: [`Row count mismatch: expected ${expectedRows}, got ${actualRows}`],
      exactMatch: false
    };
  }

  let matches = 0;
  const differences = [];
  
  for (let i = 0; i < actualRows; i++) {
    const actualRow = JSON.stringify(actualData[i]);
    const expectedRow = JSON.stringify(expectedData[i]);
    
    if (actualRow === expectedRow) {
      matches++;
    } else {
      differences.push(`Row ${i + 1}: expected ${expectedRow}, got ${actualRow}`);
    }
  }

  const score = actualRows > 0 ? (matches / actualRows) * 100 : 0;
  const exactMatch = matches === actualRows && actualRows > 0;

  return {
    score: Math.round(score * 100) / 100,
    matches,
    differences: differences.slice(0, 5), // Limit to first 5 differences
    exactMatch
  };
}