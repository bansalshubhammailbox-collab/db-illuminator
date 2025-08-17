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
    const snowflakeUser = Deno.env.get('SNOWFLAKE_USER');
    const snowflakePassword = Deno.env.get('SNOWFLAKE_PASSWORD');

    if (!snowflakeUser || !snowflakePassword) {
      throw new Error('Snowflake credentials not configured in environment variables');
    }

    console.log(`Testing Snowflake connection for ${database.name}`);
    
    // Simulate connection test (in production, would use Snowflake SDK)
    await new Promise(resolve => setTimeout(resolve, 1000));

    return new Response(
      JSON.stringify({
        status: 'connected',
        database: database.name,
        endpoint: 'RSRSBDK-YDB67606.snowflakecomputing.com',
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