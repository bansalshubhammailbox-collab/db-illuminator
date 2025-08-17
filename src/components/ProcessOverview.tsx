import { ProcessStep } from "@/components/ProcessStep";
import { Database, FileText, Brain, TestTube, Archive } from "lucide-react";

const processSteps = [
  {
    step: 1,
    title: "Select Database",
    description: "Choose from Spider's Snowflake-hosted datasets to run your evaluation on. Each database comes with comprehensive schemas and test cases.",
    icon: <Database className="h-5 w-5" />,
  },
  {
    step: 2,
    title: "Create Annotation Prompt",
    description: "Design custom prompts that will guide the LLM in generating meaningful annotations for database tables and columns.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    step: 3,
    title: "Generate Annotations",
    description: "Let your LLM create contextual descriptions and metadata for the database schema. Review and edit annotations as needed.",
    icon: <Brain className="h-5 w-5" />,
  },
  {
    step: 4,
    title: "Run Spider Evaluation",
    description: "Execute the Spider benchmark using your annotated schema. Watch as the LLM generates SQL queries for test cases and get accuracy scores.",
    icon: <TestTube className="h-5 w-5" />,
  },
  {
    step: 5,
    title: "Save & Compare Results",
    description: "Store your evaluation runs to compare different prompting strategies and measure the impact of annotations on accuracy.",
    icon: <Archive className="h-5 w-5" />,
  },
];

interface ProcessOverviewProps {
  activeStep?: number;
  completedSteps?: number[];
}

export function ProcessOverview({ activeStep = 1, completedSteps = [] }: ProcessOverviewProps) {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Evaluation Process
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Follow our structured 5-step process to enhance SQL generation accuracy through intelligent database annotations
          </p>
        </div>

        <div className="grid gap-6 max-w-4xl mx-auto">
          {processSteps.map((step, index) => (
            <ProcessStep
              key={step.step}
              step={step.step}
              title={step.title}
              description={step.description}
              icon={step.icon}
              isActive={activeStep === step.step}
              isCompleted={completedSteps.includes(step.step)}
              onStart={() => console.log(`Starting step ${step.step}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}