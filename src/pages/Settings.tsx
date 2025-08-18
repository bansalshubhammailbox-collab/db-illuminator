import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, AlertCircle, Settings as SettingsIcon, TestTube, Save, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [credentials, setCredentials] = useState({
    snowflakeUser: '',
    snowflakePassword: '',
    snowflakeAccount: '',
    geminiApiKey: ''
  });
  
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const testConnection = async () => {
    setTesting(true);
    setTestResults(null);
    
    try {
      console.log('🧪 Testing Snowflake connection with current Supabase secrets...');
      
      const { data, error } = await supabase.functions.invoke('test-snowflake-connection', {
        body: {
          database: { 
            id: 'test', 
            name: 'CONNECTION_TEST',
            description: 'Connection test',
            difficulty: 'Easy',
            tables: 1
          }
        }
      });
      
      if (error) {
        setTestResults({
          success: false,
          error: `Function call failed: ${error.message}`,
          details: error
        });
      } else {
        setTestResults(data);
      }
      
    } catch (err) {
      setTestResults({
        success: false,
        error: `Test failed: ${err.message}`,
        details: err
      });
    } finally {
      setTesting(false);
    }
  };

  const testGeminiConnection = async () => {
    setTesting(true);
    
    try {
      console.log('🧪 Testing Gemini API connection...');
      
      const { data, error } = await supabase.functions.invoke('generate-annotations', {
        body: {
          database: { 
            id: 'test', 
            name: 'GEMINI_TEST',
            description: 'Gemini API test',
            difficulty: 'Easy',
            tables: 1
          },
          customPrompt: 'Test connection only',
          options: {
            processType: 'standard',
            rowLimit: 1
          }
        }
      });
      
      if (error) {
        setTestResults({
          success: false,
          error: `Gemini test failed: ${error.message}`,
          type: 'gemini'
        });
      } else {
        setTestResults({
          success: true,
          message: 'Gemini API connection successful',
          type: 'gemini'
        });
      }
      
    } catch (err) {
      setTestResults({
        success: false,
        error: `Gemini test failed: ${err.message}`,
        type: 'gemini'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-6 w-6" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure and test your Snowflake and Gemini API connections
          </p>
        </div>
      </div>

      <Tabs defaultValue="test" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="test">Test Connections</TabsTrigger>
          <TabsTrigger value="manage">Manage Secrets</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Connection Testing
              </CardTitle>
              <CardDescription>
                Test your actual Supabase secrets to verify they work with Snowflake and Gemini API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={testConnection} 
                  disabled={testing}
                  className="h-20 flex-col"
                >
                  {testing ? (
                    <RefreshCw className="h-6 w-6 animate-spin mb-2" />
                  ) : (
                    <TestTube className="h-6 w-6 mb-2" />
                  )}
                  Test Snowflake Connection
                </Button>

                <Button 
                  onClick={testGeminiConnection} 
                  disabled={testing}
                  variant="outline"
                  className="h-20 flex-col"
                >
                  {testing ? (
                    <RefreshCw className="h-6 w-6 animate-spin mb-2" />
                  ) : (
                    <TestTube className="h-6 w-6 mb-2" />
                  )}
                  Test Gemini API
                </Button>
              </div>

              {testResults && (
                <Card className={`border ${testResults.success ? 'border-green-200' : 'border-red-200'}`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${testResults.success ? 'text-green-700' : 'text-red-700'}`}>
                      {testResults.success ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                      {testResults.success ? 'Connection Successful' : 'Connection Failed'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {testResults.success ? (
                      <div className="space-y-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          ✓ Connection working
                        </Badge>
                        {testResults.connectionInfo && (
                          <div className="text-sm text-muted-foreground">
                            <p>Account: {testResults.connectionInfo.account}</p>
                            <p>Warehouse: {testResults.connectionInfo.warehouse}</p>
                            <p>Database: {testResults.connectionInfo.database}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Badge variant="destructive">
                          ✗ Connection failed
                        </Badge>
                        
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Error:</strong> {testResults.error}
                          </AlertDescription>
                        </Alert>

                        {testResults.error?.includes('authentication failed') && (
                          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">Fix Authentication Issues:</h4>
                            <ul className="text-sm space-y-1">
                              <li>• Check SPIDER_SNOWFLAKE_USER is correct</li>
                              <li>• Check SPIDER_SNOWFLAKE_PASSWORD is correct</li>
                              <li>• Ensure credentials have access to SPIDER2 database</li>
                            </ul>
                          </div>
                        )}

                        {testResults.error?.includes('account') && (
                          <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">Fix Account Format:</h4>
                            <p className="text-sm">
                              SPIDER_SNOWFLAKE_ACCOUNT should be: <code>RSRSBDK-YDB67606</code>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supabase Secrets Management</CardTitle>
              <CardDescription>
                These credentials are stored securely in Supabase and used by edge functions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Note:</strong> Credentials are managed through Supabase dashboard. 
                  Use the links below to update them securely.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Required Secrets</h3>
                  
                  <div className="space-y-3">
                    {[
                      { name: 'SPIDER_SNOWFLAKE_USER', description: 'Your Snowflake username' },
                      { name: 'SPIDER_SNOWFLAKE_PASSWORD', description: 'Your Snowflake password' },
                      { name: 'SPIDER_SNOWFLAKE_ACCOUNT', description: 'Account: RSRSBDK-YDB67606' },
                      { name: 'SPIDER_GEMINI_API_KEY', description: 'Your Gemini API key' }
                    ].map((secret) => (
                      <div key={secret.name} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{secret.name}</p>
                          <p className="text-sm text-muted-foreground">{secret.description}</p>
                        </div>
                        <Badge variant="outline">Required</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quick Actions</h3>
                  
                  <Button 
                    onClick={() => window.open('https://supabase.com/dashboard/project/xhubgojrynqhfkjrrzaa/settings/functions', '_blank')}
                    className="w-full"
                  >
                    Open Supabase Secrets Dashboard
                  </Button>
                  
                  <Button 
                    onClick={testConnection}
                    variant="outline"
                    className="w-full"
                  >
                    Test Current Configuration
                  </Button>

                  <div className="text-sm text-muted-foreground space-y-2">
                    <p><strong>Snowflake Setup:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>User: Your Spider2 username</li>
                      <li>Password: Your Spider2 password</li>
                      <li>Account: RSRSBDK-YDB67606</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}