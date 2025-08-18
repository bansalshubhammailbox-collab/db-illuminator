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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { database }: { database: Database } = await req.json();

    // Get credentials from environment variables
    const snowflakeUser = Deno.env.get('SPIDER_SNOWFLAKE_USER');
    const snowflakePassword = Deno.env.get('SPIDER_SNOWFLAKE_PASSWORD');
    const snowflakeAccount = Deno.env.get('SPIDER_SNOWFLAKE_ACCOUNT');

    if (!snowflakeUser || !snowflakePassword || !snowflakeAccount) {
      throw new Error('Snowflake credentials not configured in environment variables');
    }

    console.log(`Testing Snowflake connection for ${database.name}`);
    console.log(`Account from env: ${snowflakeAccount}`);
    console.log(`User from env: ${snowflakeUser}`);
    
    // Test real Snowflake connection
    const connectionTest = await testSnowflakeConnection({
      account: snowflakeAccount,
      user: snowflakeUser,
      password: snowflakePassword,
      warehouse: 'COMPUTE_WH',
      database: 'SPIDER2',
      schema: 'PUBLIC'
    });

    if (!connectionTest.success) {
      throw new Error(`Snowflake connection failed: ${connectionTest.error}`);
    }

    return new Response(
      JSON.stringify({
        status: 'connected',
        database: database.name,
        endpoint: `${snowflakeAccount}.snowflakecomputing.com`,
        warehouse: 'COMPUTE_WH',
        schema: 'PUBLIC',
        user: snowflakeUser,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in test-snowflake-connection:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to test Snowflake connection',
        details: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

// Test Snowflake connection function
async function testSnowflakeConnection(config: {
  account: string;
  user: string;
  password: string;
  warehouse: string;
  database: string;
  schema: string;
}) {
  try {
    // Use Snowflake REST API for connection test
    // Format account correctly: RSRSBDK-YDB67606 -> rsrsbdk-ydb67606.snowflakecomputing.com
    const formattedAccount = config.account.toLowerCase();
    // Ensure hyphen is preserved in account format
    const correctAccountFormat = formattedAccount.includes('.') ? formattedAccount.replace('.', '-') : formattedAccount;
    const authUrl = `https://${correctAccountFormat}.snowflakecomputing.com/session/v1/login-request`;
    console.log(`Raw account: ${config.account}`);
    console.log(`Formatted account: ${correctAccountFormat}`);
    console.log(`Attempting connection to: ${authUrl}`);
    
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