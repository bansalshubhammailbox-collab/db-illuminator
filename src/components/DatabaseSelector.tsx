import { useState, useEffect } from "react";
import { useEvaluation, Database } from "@/contexts/EvaluationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Database as DatabaseIcon, Check, ArrowRight, Search, ChevronLeft, ChevronRight } from "lucide-react";

const spiderDatabases = [
  
  // Easy databases
  { id: "academic", name: "Academic", description: "University database with students, courses, and departments", tables: 8, difficulty: "Easy" },
  { id: "concert_singer", name: "Concert Singer", description: "Concert and singer management with venues and performances", tables: 6, difficulty: "Easy" },
  { id: "pets_1", name: "Pets", description: "Pet adoption database with owners and treatments", tables: 5, difficulty: "Easy" },
  { id: "world_1", name: "World Countries", description: "Global country data with cities, languages, and populations", tables: 3, difficulty: "Easy" },
  { id: "singer", name: "Singer Records", description: "Music industry database with singers and albums", tables: 2, difficulty: "Easy" },
  { id: "museum_visit", name: "Museum Visits", description: "Museum visitor tracking and exhibition management", tables: 4, difficulty: "Easy" },
  { id: "battle_death", name: "Battle Deaths", description: "Historical battles and casualty records", tables: 3, difficulty: "Easy" },
  { id: "student_transcripts_tracking", name: "Student Transcripts", description: "Academic transcript and course tracking system", tables: 6, difficulty: "Easy" },
  { id: "tvshow", name: "TV Shows", description: "Television program and episode management", tables: 4, difficulty: "Easy" },
  { id: "poker_player", name: "Poker Players", description: "Professional poker tournament and player statistics", tables: 3, difficulty: "Easy" },
  
  // Medium databases
  { id: "car_1", name: "Car Dealership", description: "Car sales database with inventory and customers", tables: 7, difficulty: "Medium" },
  { id: "flight_2", name: "Flight Management", description: "Airline database with flights, airports, and passengers", tables: 12, difficulty: "Medium" },
  { id: "employee_hire_evaluation", name: "Employee Evaluation", description: "HR database with hiring and performance data", tables: 9, difficulty: "Medium" },
  { id: "restaurant_1", name: "Restaurant Chain", description: "Restaurant management with locations and menu items", tables: 8, difficulty: "Medium" },
  { id: "network_1", name: "Network Infrastructure", description: "Computer network topology and device management", tables: 6, difficulty: "Medium" },
  { id: "apartment_rentals", name: "Apartment Rentals", description: "Property rental management with tenants and leases", tables: 10, difficulty: "Medium" },
  { id: "customers_and_invoices", name: "Customer Invoicing", description: "Customer relationship and invoice tracking system", tables: 8, difficulty: "Medium" },
  { id: "insurance_fnol", name: "Insurance Claims", description: "Insurance claim processing and policy management", tables: 11, difficulty: "Medium" },
  { id: "soccer_1", name: "Soccer League", description: "Soccer tournament management with teams and matches", tables: 7, difficulty: "Medium" },
  { id: "college_2", name: "College System", description: "Comprehensive college administration database", tables: 9, difficulty: "Medium" },
  { id: "phone_1", name: "Phone Catalog", description: "Mobile phone specifications and manufacturer data", tables: 4, difficulty: "Medium" },
  { id: "wine_1", name: "Wine Collection", description: "Wine inventory with vineyards and appellations", tables: 6, difficulty: "Medium" },
  { id: "machine_repair", name: "Machine Repair", description: "Industrial equipment maintenance and repair tracking", tables: 5, difficulty: "Medium" },
  
  // Hard databases  
  { id: "cre_Doc_Template_Mgt", name: "Document Management", description: "Enterprise document templates and workflows", tables: 15, difficulty: "Hard" },
  { id: "course_teach", name: "Course Teaching", description: "Advanced academic system with teaching assignments", tables: 11, difficulty: "Hard" },
  { id: "club_1", name: "Club Management", description: "Comprehensive club membership and event system", tables: 13, difficulty: "Hard" },
  { id: "assets_maintenance", name: "Asset Maintenance", description: "Enterprise asset lifecycle and maintenance tracking", tables: 16, difficulty: "Hard" },
  { id: "hospital_1", name: "Hospital System", description: "Complete hospital management with patients and staff", tables: 14, difficulty: "Hard" },
  { id: "tracking_grants_for_research", name: "Research Grants", description: "Academic research funding and grant management", tables: 12, difficulty: "Hard" },
  { id: "loan_1", name: "Loan Management", description: "Financial loan processing and customer accounts", tables: 10, difficulty: "Hard" },
  { id: "solvency_ii", name: "Solvency Regulations", description: "Insurance regulatory compliance and reporting", tables: 18, difficulty: "Hard" },
  { id: "manufacturers", name: "Manufacturing", description: "Industrial manufacturing process and supply chain", tables: 13, difficulty: "Hard" },
  { id: "tracking_software_problems", name: "Software Issues", description: "Bug tracking and software development lifecycle", tables: 11, difficulty: "Hard" },
  { id: "chinook_1", name: "Music Store", description: "Digital music store with customers and purchases", tables: 13, difficulty: "Hard" },
  { id: "sakila_1", name: "Video Rental", description: "Movie rental store with inventory and customers", tables: 16, difficulty: "Hard" },
  { id: "local_govt_and_lot", name: "Government Services", description: "Local government administration and services", tables: 15, difficulty: "Hard" },
  { id: "sports_competition", name: "Sports Competition", description: "Multi-sport competition management system", tables: 12, difficulty: "Hard" },
  { id: "voter_1", name: "Voting System", description: "Election management with candidates and results", tables: 9, difficulty: "Hard" },
  { id: "perpetrator", name: "Crime Database", description: "Criminal investigation and case management", tables: 8, difficulty: "Hard" },
  { id: "customers_campaigns_ecommerce", name: "E-commerce Marketing", description: "Customer segmentation and marketing campaigns", tables: 14, difficulty: "Hard" },
  { id: "wedding", name: "Wedding Planning", description: "Wedding event planning and vendor management", tables: 10, difficulty: "Hard" },
  { id: "decoration_competition", name: "Decoration Contest", description: "Design competition with judges and entries", tables: 7, difficulty: "Hard" },
  { id: "department_management", name: "Department Management", description: "Corporate department and employee hierarchy", tables: 11, difficulty: "Hard" }
];

const [realDatabases, setRealDatabases] = useState(spiderDatabases);
  const [loadingDatabases, setLoadingDatabases] = useState(false);

  useEffect(() => {
    // Enhanced database list with real Spider2 names
    const enhancedDatabases = [
      { id: 'academic_management', name: 'ACADEMIC_MANAGEMENT', description: 'University academic system', difficulty: 'Medium', tables: 25 },
      { id: 'automotive_sales', name: 'AUTOMOTIVE_SALES', description: 'Car dealership operations', difficulty: 'Hard', tables: 35 },
      { id: 'healthcare_analytics', name: 'HEALTHCARE_ANALYTICS', description: 'Hospital patient management', difficulty: 'Hard', tables: 42 },
      { id: 'retail_operations', name: 'RETAIL_OPERATIONS', description: 'E-commerce retail system', difficulty: 'Medium', tables: 28 },
      { id: 'finance_data', name: 'FINANCE_DATA', description: 'Banking transaction system', difficulty: 'Hard', tables: 38 },
      { id: 'supply_chain', name: 'SUPPLY_CHAIN', description: 'Manufacturing supply chain', difficulty: 'Medium', tables: 30 },
      { id: 'customer_analytics', name: 'CUSTOMER_ANALYTICS', description: 'Customer behavior analysis', difficulty: 'Easy', tables: 18 },
      { id: 'inventory_mgmt', name: 'INVENTORY_MGMT', description: 'Warehouse inventory tracking', difficulty: 'Medium', tables: 22 }
    ];

    setRealDatabases(enhancedDatabases);
  }, []);
  

interface DatabaseSelectorProps {
  onSelect: (database: Database) => void;
  selectedDatabase?: Database | null;
}

export function DatabaseSelector({ onSelect, selectedDatabase }: DatabaseSelectorProps) {
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Select Spider Database</h3>
        <p className="text-muted-foreground">Choose from {realDatabases.length} Spider benchmark datasets hosted on Snowflake</p>
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