import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Database, Brain, Target, ArrowRight, History } from "lucide-react";
import heroImage from "@/assets/hero-database.jpg";
import { SavedRunsViewer } from "@/components/SavedRunsViewer";

export function HeroSection({ onStartEvaluation }: { onStartEvaluation?: () => void }) {
  const [savedRunsOpen, setSavedRunsOpen] = useState(false);
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-gradient-subtle">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="text-sm">
                <Database className="w-4 h-4 mr-2" />
                Database Intelligence Platform
              </Badge>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  DB Illuminator
                </span>
              </h1>
              
              <h2 className="text-2xl lg:text-3xl text-muted-foreground font-medium">
                Enhance SQL Generation with Smart Database Annotations
              </h2>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Run Spider benchmark evaluations with custom LLM-generated database annotations. 
                Prove that contextual schema descriptions improve SQL query accuracy and discover 
                the optimal prompting strategies for your models.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-primary text-lg px-8 hover:shadow-glow transition-all"
                onClick={onStartEvaluation}
              >
                Start Evaluation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Dialog open={savedRunsOpen} onOpenChange={setSavedRunsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="text-lg px-8">
                    <History className="mr-2 h-5 w-5" />
                    View Saved Runs
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Saved Evaluation Runs</DialogTitle>
                    <DialogDescription>
                      View and analyze your previous Spider benchmark evaluation results
                    </DialogDescription>
                  </DialogHeader>
                  <div className="overflow-y-auto">
                    <SavedRunsViewer />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">LLM-Powered Annotations</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium">Spider Benchmark</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Accuracy Tracking</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <img 
                src={heroImage} 
                alt="Database annotation and SQL evaluation platform interface"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-accent/20" />
            </div>
            
            <div className="absolute -top-4 -right-4 bg-accent text-accent-foreground px-4 py-2 rounded-lg shadow-lg">
              <div className="text-sm font-medium">Spider Benchmark</div>
              <div className="text-lg font-bold">Ready</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}