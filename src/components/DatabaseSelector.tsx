import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Check, ArrowRight } from "lucide-react";

const spiderDatabases = [
  {
    id: "academic",
    name: "Academic",
    description: "University database with students, courses, and departments",
    tables: 8,
    difficulty: "Easy"
  },
  {
    id: "concert_singer", 
    name: "Concert Singer",
    description: "Concert and singer management with venues and performances",
    tables: 6,
    difficulty: "Easy"
  },
  {
    id: "pets_1",
    name: "Pets",
    description: "Pet adoption database with owners and treatments", 
    tables: 5,
    difficulty: "Easy"
  },
  {
    id: "car_1",
    name: "Car Dealership",
    description: "Car sales database with inventory and customers",
    tables: 7,
    difficulty: "Medium"
  },
  {
    id: "flight_2",
    name: "Flight Management",
    description: "Airline database with flights, airports, and passengers",
    tables: 12,
    difficulty: "Medium"  
  },
  {
    id: "employee_hire_evaluation",
    name: "Employee Evaluation", 
    description: "HR database with hiring and performance data",
    tables: 9,
    difficulty: "Medium"
  },
  {
    id: "cre_Doc_Template_Mgt",
    name: "Document Management",
    description: "Enterprise document templates and workflows",
    tables: 15,
    difficulty: "Hard"
  },
  {
    id: "course_teach",
    name: "Course Teaching",
    description: "Advanced academic system with teaching assignments",
    tables: 11,
    difficulty: "Hard"
  }
];

interface DatabaseSelectorProps {
  onSelect: (database: typeof spiderDatabases[0]) => void;
  selectedDatabase?: typeof spiderDatabases[0];
}

export function DatabaseSelector({ onSelect, selectedDatabase }: DatabaseSelectorProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"; 
      case "Hard": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Select Spider Database</h3>
        <p className="text-muted-foreground">Choose a dataset from the Spider benchmark collection hosted on Snowflake</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {spiderDatabases.map((db) => (
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
                  <Database className="h-5 w-5 text-primary" />
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
      </div>

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