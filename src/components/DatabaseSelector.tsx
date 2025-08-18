import { useState, useEffect } from "react";
import { useEvaluation, Database } from "@/contexts/EvaluationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Database as DatabaseIcon, Check, ArrowRight, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DatabaseSelectorProps {
  onSelect: (database: Database) => void;
  selectedDatabase?: Database | null;
}

export function DatabaseSelector({ onSelect, selectedDatabase }: DatabaseSelectorProps) {
  const [realDatabases, setRealDatabases] = useState<Database[]>([]);
  const [loadingDatabases, setLoadingDatabases] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [credentialDetails, setCredentialDetails] = useState<any>(null);

  useEffect(() => {
    async function loadRealDatabases() {
      try {
        setLoadingDatabases(true);
        setConnectionError(null);
        
        console.log('🔍 Loading real Snowflake databases (NO FALLBACKS)...');
        
        const { data, error } = await supabase.functions.invoke('discover-snowflake-datasets', {
          body: {}
        });
        
        if (error) {
          console.error('❌ Supabase function error:', error);
          setConnectionError(`Supabase function error: ${error.message}`);
          setLoadingDatabases(false);
          return;
        }
        
        if (!data.success) {
          console.error('❌ Discovery failed:', data.error);
          
          // Parse specific credential errors
          let errorDetails = data.error;
          let credentialIssue = null;
          
          if (data.error.includes('authentication failed')) {
            credentialIssue = 'Authentication failed - check SPIDER_SNOWFLAKE_USER and SPIDER_SNOWFLAKE_PASSWORD';
          } else if (data.error.includes('invalid peer certificate') || data.error.includes('NotValidForName')) {
            credentialIssue = 'Account URL format error - check SPIDER_SNOWFLAKE_ACCOUNT format';
          } else if (data.error.includes('not configured')) {
            credentialIssue = 'Missing credentials in Supabase secrets';
          }
          
          setConnectionError(errorDetails);
          setCredentialDetails({
            issue: credentialIssue,
            fullError: data.error
          });
          setLoadingDatabases(false);
          return;
        }
        
        console.log('✅ SUCCESS! Raw Snowflake response:');
        console.log(JSON.stringify(data, null, 2));
        
        // Parse actual databases from Snowflake response
        const databases = parseSnowflakeDatabases(data.results);
        console.log('📊 Parsed databases:', databases);
        
        setRealDatabases(databases);
        setLoadingDatabases(false);
        
      } catch (error) {
        console.error('❌ Function call failed:', error);
        setConnectionError(`Function call failed: ${error.message}`);
        setLoadingDatabases(false);
      }
    }
    
    loadRealDatabases();
  }, []);
  
  // Helper function to parse Snowflake results into database list
  const parseSnowflakeDatabases = (results: any[]) => {
    if (!results || results.length === 0) return [];
    
    // Find the dataset prefix query result (Query 3)
    const prefixResult = results.find(r => r.query?.includes('dataset_prefix'));
    
    if (!prefixResult || !prefixResult.success || !prefixResult.data) {
      console.warn('No dataset prefix data found, using table list');
      // Fallback to using all tables from Query 1
      const tablesResult = results.find(r => r.query?.includes('table_name'));
      if (tablesResult?.success && tablesResult.data) {
        return tablesResult.data.slice(0, 20).map((table: any) => ({
          id: table.TABLE_NAME?.toLowerCase() || 'unknown',
          name: table.TABLE_NAME || 'Unknown',
          description: `Table: ${table.TABLE_NAME}`,
          difficulty: 'Medium' as const,
          tables: 1
        }));
      }
      return [];
    }
    
    // Convert dataset prefixes to database objects
    return prefixResult.data.map((item: any) => ({
      id: item.DATASET_PREFIX?.toLowerCase() || 'unknown',
      name: item.DATASET_PREFIX || 'Unknown',
      description: `${item.DATASET_PREFIX} database from Spider benchmark`,
      difficulty: item.TABLE_COUNT > 15 ? 'Hard' : item.TABLE_COUNT > 8 ? 'Medium' : 'Easy',
      tables: item.TABLE_COUNT || 0
    }));
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const itemsPerPage = 8;
  
  // Filter databases based on search and difficulty
  const filteredDatabases = realDatabases.filter(db => {
    const matchesSearch = db.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         db.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = !selectedDifficulty || db.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredDatabases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDatabases = filteredDatabases.slice(startIndex, startIndex + itemsPerPage);
  
  // Reset to first page when search changes
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };
  
  const handleDifficultyFilter = (difficulty: string | null) => {
    setSelectedDifficulty(difficulty);
    setCurrentPage(1);
  };
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"; 
      case "Hard": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  if (loadingDatabases) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">Loading Snowflake Databases</h3>
          <p className="text-muted-foreground">Connecting to Snowflake to discover available datasets...</p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2 text-destructive">Snowflake Connection Failed</h3>
          <p className="text-muted-foreground">Unable to load databases from Snowflake</p>
        </div>
        
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Connection Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {credentialDetails?.issue && (
              <div className="bg-destructive/10 p-4 rounded-lg">
                <h4 className="font-semibold text-destructive mb-2">Credential Issue:</h4>
                <p className="text-sm">{credentialDetails.issue}</p>
              </div>
            )}
            
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Full Error:</h4>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{connectionError}</pre>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Check Supabase Secrets:</h4>
              <ul className="text-sm space-y-1">
                <li>• SPIDER_SNOWFLAKE_USER</li>
                <li>• SPIDER_SNOWFLAKE_PASSWORD</li>
                <li>• SPIDER_SNOWFLAKE_ACCOUNT</li>
              </ul>
            </div>
            
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Select Snowflake Database</h3>
        <p className="text-muted-foreground">
          {realDatabases.length > 0 
            ? `Choose from ${realDatabases.length} real databases loaded from Snowflake` 
            : "No databases found in Snowflake"}
        </p>
      </div>
      
      {/* Search and Filter Controls */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search databases by name or description..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Difficulty Filter */}
        <div className="flex justify-center gap-2">
          <Button
            variant={selectedDifficulty === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleDifficultyFilter(null)}
          >
            All ({realDatabases.length})
          </Button>
          {["Easy", "Medium", "Hard"].map((difficulty) => (
            <Button
              key={difficulty}
              variant={selectedDifficulty === difficulty ? "default" : "outline"}
              size="sm"
              onClick={() => handleDifficultyFilter(difficulty)}
              className={selectedDifficulty === difficulty ? getDifficultyColor(difficulty) : ""}
            >
              {difficulty} ({realDatabases.filter(db => db.difficulty === difficulty).length})
            </Button>
          ))}
        </div>
      </div>
      
      {/* Results Info */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {currentDatabases.length} of {filteredDatabases.length} databases
        {searchTerm && ` matching "${searchTerm}"`}
        {selectedDifficulty && ` (${selectedDifficulty} difficulty)`}
      </div>
      
      {/* Database Grid */}
      <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto min-h-[400px]">
        {currentDatabases.map((db) => (
          <Card 
            key={db.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedDatabase?.id === db.id ? 'ring-2 ring-primary bg-primary/5' : ''
            }`}
            onClick={() => onSelect(db)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DatabaseIcon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{db.name}</CardTitle>
                </div>
                {selectedDatabase?.id === db.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription className="text-sm">
                {db.description}
              </CardDescription>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {db.tables} tables
                  </Badge>
                  <Badge className={`text-xs ${getDifficultyColor(db.difficulty)}`}>
                    {db.difficulty}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* No results message */}
        {currentDatabases.length === 0 && (
          <div className="col-span-full text-center py-12">
            <DatabaseIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No databases found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {selectedDatabase && (
        <div className="text-center">
          <Button size="lg" className="px-8">
            Continue with {selectedDatabase.name}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}