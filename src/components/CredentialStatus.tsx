import { useState, useEffect } from "react";
import { validateCredentials } from "@/config/credentials";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Settings } from "lucide-react";

export const CredentialStatus = () => {
  const [validation, setValidation] = useState(validateCredentials());

  useEffect(() => {
    // Recheck credentials every few seconds during setup
    const interval = setInterval(() => {
      setValidation(validateCredentials());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5" />
          <div>
            <CardTitle>Credential Status</CardTitle>
            <CardDescription>
              Configure your API credentials to start using the platform
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Overall Status</span>
            <Badge variant={validation.isValid ? "default" : "destructive"}>
              {validation.isValid ? (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Ready
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Setup Required
                </div>
              )}
            </Badge>
          </div>

          {!validation.isValid && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Configuration needed:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                  <p className="text-sm mt-2">
                    Edit <code className="bg-muted px-1 rounded">src/config/credentials.ts</code> to add your credentials.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span>Snowflake Connection:</span>
              <Badge variant={validation.errors.some(e => e.includes("Snowflake")) ? "outline" : "secondary"}>
                {validation.errors.some(e => e.includes("Snowflake")) ? "Not configured" : "Configured"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Gemini API Key:</span>
              <Badge variant={validation.errors.some(e => e.includes("Gemini")) ? "outline" : "secondary"}>
                {validation.errors.some(e => e.includes("Gemini")) ? "Not configured" : "Configured"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};