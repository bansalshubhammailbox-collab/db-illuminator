import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { ProcessOverview } from "@/components/ProcessOverview";
import { CredentialStatus } from "@/components/CredentialStatus";
import { DatabaseSelector } from "@/components/DatabaseSelector";
import { AnnotationPromptCreator } from "@/components/AnnotationPromptCreator";
import { AnnotationGenerator } from "@/components/AnnotationGenerator";
import { SpiderEvaluationRunner } from "@/components/SpiderEvaluationRunner";
import { ResultsSaver } from "@/components/ResultsSaver";
import { EvaluationValidator } from "@/components/EvaluationValidator";
import { EvaluationProvider, useEvaluation } from "@/contexts/EvaluationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Zap, 
  BarChart3, 
  Shield, 
  Snowflake,
  Sparkles,
  TrendingUp,
  Settings
} from "lucide-react";

const Index = () => {
  return (
    <EvaluationProvider>
      <IndexContent />
    </EvaluationProvider>
  );
};

const IndexContent = () => {
  const [showDatabaseSelector, setShowDatabaseSelector] = useState(false);
  const { state, setSelectedDatabase, setCurrentStep } = useEvaluation();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <HeroSection onStartEvaluation={() => setShowDatabaseSelector(true)} />
      
      {/* Credential Status Section */}
      <section className="py-8 bg-background/30">
        <div className="container mx-auto px-4">
          <CredentialStatus />
        </div>
      </section>

      {showDatabaseSelector ? (
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <DatabaseSelector 
              onSelect={(db) => {
                setSelectedDatabase(db);
                setShowDatabaseSelector(false);
                setCurrentStep(2);
              }} 
              selectedDatabase={state.selectedDatabase}
            />
          </div>
        </section>
      ) : state.currentStep === 2 ? (
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <AnnotationPromptCreator />
          </div>
        </section>
      ) : state.currentStep === 3 ? (
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <AnnotationGenerator />
          </div>
        </section>
      ) : state.currentStep === 4 ? (
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <SpiderEvaluationRunner />
          </div>
        </section>
      ) : state.currentStep === 5 ? (
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <ResultsSaver />
          </div>
        </section>
      ) : (
        <>
          <ProcessOverview 
            activeStep={state.currentStep} 
            onStartStep={(step) => {
              if (step === 1) {
                setShowDatabaseSelector(true);
              } else if (step === 2 && state.selectedDatabase) {
                setCurrentStep(2);
              } else if (step === 3 && state.selectedDatabase && state.customPrompt) {
                setCurrentStep(3);
              } else if (step === 4 && state.selectedDatabase && Object.keys(state.annotations || {}).length > 0) {
                setCurrentStep(4);
              } else if (step === 5 && state.evaluationResults) {
                setCurrentStep(5);
              }
            }}
          />
          
          {/* Evaluation Status Section */}
          {state.selectedDatabase && (
            <section className="py-8 bg-background/30">
              <div className="container mx-auto px-4 max-w-2xl">
                <EvaluationValidator />
              </div>
            </section>
          )}
        </>
      )}
      
      {/* Features Section */}
      <section className="py-20 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Platform Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to enhance your SQL generation with intelligent database annotations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Snowflake className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Snowflake Integration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Direct access to Spider's comprehensive database collection hosted on Snowflake. No setup required.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Sparkles className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle>Gemini AI Integration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Leverage Google's Gemini API for generating contextual database annotations and SQL queries.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Spider Benchmark</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Run official Spider test evaluations to measure SQL generation accuracy with standardized metrics.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Settings className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle>Custom Prompts</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Design and experiment with custom prompting strategies to optimize annotation quality.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Performance Tracking</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Track accuracy improvements and compare different annotation strategies across multiple runs.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Shield className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle>Secure & Scalable</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Built with security best practices and designed to handle large-scale database evaluations.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl font-bold">
              Ready to Improve Your SQL Generation?
            </h2>
            <p className="text-xl opacity-90">
              Start your first evaluation run and discover how contextual annotations can dramatically improve your LLM's SQL accuracy scores.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                <Database className="mr-2 h-5 w-5" />
                Connect to Backend
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;