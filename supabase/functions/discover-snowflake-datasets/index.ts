import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Discovering Snowflake datasets...');

    // Get credentials from environment variables
    const snowflakeUser = Deno.env.get('SPIDER_SNOWFLAKE_USER');
    const snowflakePassword = Deno.env.get('SPIDER_SNOWFLAKE_PASSWORD');
    const snowflakeAccount = Deno.env.get('SPIDER_SNOWFLAKE_ACCOUNT');

    if (!snowflakeUser || !snowflakePassword || !snowflakeAccount) {
      throw new Error('Snowflake credentials not configured');
    }

    const config = {
      user: snowflakeUser,
      password: snowflakePassword,
      account: snowflakeAccount,
      warehouse: 'COMPUTE_WH',
      database: 'SPIDER2',
      schema: 'PUBLIC'
    };

    // Authenticate with Snowflake
    const authResult = await authenticateSnowflake(config);
    if (!authResult.success) {
      throw new Error(`Snowflake authentication failed: ${authResult.error}`);
    }

    console.log('Successfully authenticated with Snowflake');

    // Query to discover all tables in SPIDER2 database
    const discoveryQueries = [
      // Get all tables in SPIDER2.PUBLIC
      `SELECT table_name, table_type, row_count 
       FROM SPIDER2.information_schema.tables 
       WHERE table_schema = 'PUBLIC' 
       ORDER BY table_name`,
      
      // Get count of tables
      `SELECT COUNT(*) as total_tables 
       FROM SPIDER2.information_schema.tables 
       WHERE table_schema = 'PUBLIC'`,
      
      // Get sample table names with prefixes to identify database groups
      `SELECT 
         SUBSTRING(table_name, 1, POSITION('_' IN table_name || '_') - 1) as dataset_prefix,
         COUNT(*) as table_count
       FROM SPIDER2.information_schema.tables 
       WHERE table_schema = 'PUBLIC'
       GROUP BY dataset_prefix
       ORDER BY table_count DESC`
    ];

    const results = [];
    
    for (const sql of discoveryQueries) {
      console.log(`Executing query: ${sql}`);
      const result = await executeSnowflakeQuery(authResult.sessionToken, config, sql);
      results.push({
        query: sql,
        success: result.success,
        data: result.data,
        error: result.error
      });
    }

    return new Response(JSON.stringify({
      success: true,
      authentication: 'SUCCESS',
      results: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error discovering Snowflake datasets:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function authenticateSnowflake(config: any) {
  try {
    // Convert account format for Snowflake URL - use lowercase
    const accountUrl = config.account.toLowerCase();
    const authUrl = `https://${accountUrl}.snowflakecomputing.com/session/v1/login-request`;
    
    console.log(`Authenticating with Snowflake at: ${authUrl}`);
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        data: {
          CLIENT_APP_ID: 'Spider2Discovery',
          CLIENT_APP_VERSION: '1.0.0',
          loginName: config.user,
          password: config.password,
          clientEnvironment: {
            APPLICATION: 'Spider2Discovery'
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

async function executeSnowflakeQuery(sessionToken: string, config: any, sql: string) {
  try {
    // Convert account format for Snowflake URL - use lowercase
    const accountUrl = config.account.toLowerCase();
    const queryUrl = `https://${accountUrl}.snowflakecomputing.com/queries/v1/query-request`;
    
    console.log(`Executing query at: ${queryUrl}`);
    
    const queryResponse = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Snowflake Token="${sessionToken}"`
      },
      body: JSON.stringify({
        sqlText: sql,
        warehouse: config.warehouse,
        database: config.database,
        schema: config.schema,
        resultSetMetaData: {
          format: 'json'
        }
      })
    });

    if (!queryResponse.ok) {
      const errorText = await queryResponse.text();
      return { success: false, error: `Query failed: ${errorText}` };
    }

    const queryData = await queryResponse.json();
    
    if (!queryData.success) {
      return { success: false, error: `Query execution failed: ${queryData.message}` };
    }

    return { 
      success: true, 
      data: queryData.data,
      rowCount: queryData.data?.length || 0
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}