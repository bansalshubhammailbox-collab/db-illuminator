import { useState, useEffect } from "react";
import { validateCredentials } from "@/config/credentials";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Settings, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

export const CredentialStatus = () => {
  const [supabaseStatus, setSupabaseStatus] = useState<{
    isValid: boolean;
    testing: boolean;
    lastTest?: any;
  }>({
    isValid: false,
    testing: false
  });

  const testSupabaseSecrets = async () => {
    setSupabaseStatus(prev => ({ ...prev, testing: true }));
    
    try {
      console.log('🧪 Testing actual Supabase secrets...');
      
      const { data, error } = await supabase.functions.invoke('test-snowflake-connection', {
        body: {
          database: { 
            id: 'credential-test', 
            name: 'CREDENTIAL_TEST',
            description: 'Testing credentials',
            difficulty: 'Easy',
            tables: 1
          }
        }
      });
      
      const isValid = !error && data?.success;
      
      setSupabaseStatus({
        isValid,
        testing: false,
        lastTest: {
          success: isValid,
          error: error?.message || data?.error,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (err) {
      setSupabaseStatus({
        isValid: false,
        testing: false,
        lastTest: {
          success: false,
          error: err.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  useEffect(() => {
    // Test on component mount
    testSupabaseSecrets();
  }, []);

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5" />
            <div>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>
                Real-time status of your Snowflake and Gemini API connections
              </CardDescription>
            </div>
          </div>
          <Link to="/settings">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Supabase Secrets Status</span>
            <div className="flex items-center gap-2">
              {supabaseStatus.testing ? (
                <Badge variant="outline" className="animate-pulse">
                  Testing...
                </Badge>
              ) : (
                <Badge variant={supabaseStatus.isValid ? "default" : "destructive"}>
                  {supabaseStatus.isValid ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Connection Failed
                    </div>
                  )}
                </Badge>
              )}
              <Button 
                onClick={testSupabaseSecrets}
                disabled={supabaseStatus.testing}
                size="sm"
                variant="ghost"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {supabaseStatus.lastTest && !supabaseStatus.isValid && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Connection Issue:</p>
                  <p className="text-sm">{supabaseStatus.lastTest.error}</p>
                  <div className="flex gap-2 mt-3">
                    <Link to="/settings">
                      <Button size="sm" variant="outline">
                        Fix in Settings
                      </Button>
                    </Link>
                    <Button 
                      onClick={testSupabaseSecrets}
                      size="sm"
                      variant="ghost"
                    >
                      Retry Test
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {supabaseStatus.isValid && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                ✅ All credentials are working! Your Snowflake connection is active and ready for evaluations.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-muted-foreground">
            {supabaseStatus.lastTest && (
              <p>Last tested: {new Date(supabaseStatus.lastTest.timestamp).toLocaleTimeString()}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};