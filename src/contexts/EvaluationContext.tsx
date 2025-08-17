import { createContext, useContext, useState, ReactNode } from 'react';

export interface Database {
  id: string;
  name: string;
  description: string;
  tables: number;
  difficulty: string;
}

export interface EvaluationState {
  selectedDatabase: Database | null;
  customPrompt: string;
  annotations: Record<string, any>;
  evaluationResults: any;
  currentStep: number;
}

interface EvaluationContextType {
  state: EvaluationState;
  setSelectedDatabase: (database: Database | null) => void;
  setCustomPrompt: (prompt: string) => void;
  setAnnotations: (annotations: Record<string, any>) => void;
  setEvaluationResults: (results: any) => void;
  setCurrentStep: (step: number) => void;
  canProceedToStep: (step: number) => boolean;
  resetEvaluation: () => void;
}

const EvaluationContext = createContext<EvaluationContextType | null>(null);

const initialState: EvaluationState = {
  selectedDatabase: null,
  customPrompt: '',
  annotations: {},
  evaluationResults: null,
  currentStep: 1
};

export function EvaluationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EvaluationState>(initialState);

  const setSelectedDatabase = (database: Database | null) => {
    setState(prev => ({ ...prev, selectedDatabase: database }));
  };

  const setCustomPrompt = (prompt: string) => {
    setState(prev => ({ ...prev, customPrompt: prompt }));
  };

  const setAnnotations = (annotations: Record<string, any>) => {
    setState(prev => ({ ...prev, annotations }));
  };

  const setEvaluationResults = (results: any) => {
    setState(prev => ({ ...prev, evaluationResults: results }));
  };

  const setCurrentStep = (step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return true; // Always can start
      case 2:
        return state.selectedDatabase !== null;
      case 3:
        return state.selectedDatabase !== null && state.customPrompt.length > 0;
      case 4:
        return state.selectedDatabase !== null && 
               state.customPrompt.length > 0 && 
               Object.keys(state.annotations).length > 0;
      case 5:
        return state.selectedDatabase !== null && 
               state.evaluationResults !== null;
      default:
        return false;
    }
  };

  const resetEvaluation = () => {
    setState(initialState);
  };

  const value: EvaluationContextType = {
    state,
    setSelectedDatabase,
    setCustomPrompt,
    setAnnotations,
    setEvaluationResults,
    setCurrentStep,
    canProceedToStep,
    resetEvaluation
  };

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
}

export function useEvaluation() {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within an EvaluationProvider');
  }
  return context;
}