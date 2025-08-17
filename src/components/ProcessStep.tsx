import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, CheckCircle } from "lucide-react";

interface ProcessStepProps {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive?: boolean;
  isCompleted?: boolean;
  onStart?: () => void;
}

export function ProcessStep({ 
  step, 
  title, 
  description, 
  icon, 
  isActive = false, 
  isCompleted = false,
  onStart 
}: ProcessStepProps) {
  return (
    <Card className={`relative transition-all duration-300 hover:shadow-elegant ${
      isActive ? 'ring-2 ring-primary shadow-glow' : ''
    } ${isCompleted ? 'bg-accent/5 border-accent' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${
              isCompleted ? 'bg-accent text-accent-foreground' : 
              isActive ? 'bg-primary text-primary-foreground' : 
              'bg-secondary text-secondary-foreground'
            }`}>
              {isCompleted ? <CheckCircle className="h-5 w-5" /> : icon}
            </div>
            <div>
              <CardTitle className="text-lg">
                {title}
              </CardTitle>
              <Badge variant={isCompleted ? "default" : "secondary"} className="mt-1">
                Step {step}
              </Badge>
            </div>
          </div>
          {isCompleted && (
            <CheckCircle className="h-6 w-6 text-accent" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base mb-4">
          {description}
        </CardDescription>
        {onStart && !isCompleted && (
          <Button 
            variant={isActive ? "default" : "outline"} 
            onClick={onStart}
            className="w-full"
          >
            {isActive ? "Continue" : "Start Step"}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}