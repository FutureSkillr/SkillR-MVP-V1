export interface VucaModule {
  id: string;
  title: string;
  description: string;
  category: 'V' | 'U' | 'C' | 'A';
  order: number;
  completed: boolean;
}

export interface CourseContent {
  moduleId: string;
  title: string;
  sections: CourseSection[];
  quiz: QuizQuestion[];
}

export interface CourseSection {
  heading: string;
  content: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface VucaProgress {
  V: number;
  U: number;
  C: number;
  A: number;
}

export interface VucaCurriculum {
  goal: string;
  modules: VucaModule[];
}

export type VucaStationView = 'onboarding' | 'loading-curriculum' | 'dashboard' | 'course' | 'complete';

export interface VucaStationState {
  view: VucaStationView;
  goal: string | null;
  curriculum: VucaCurriculum | null;
  progress: VucaProgress;
  activeModuleId: string | null;
  activeCourse: CourseContent | null;
}

export const VUCA_THRESHOLD = 25;

export const VUCA_LABELS: Record<string, string> = {
  V: 'Volatility',
  U: 'Uncertainty',
  C: 'Complexity',
  A: 'Ambiguity',
};

export function createInitialVucaState(): VucaStationState {
  return {
    view: 'onboarding',
    goal: null,
    curriculum: null,
    progress: { V: 0, U: 0, C: 0, A: 0 },
    activeModuleId: null,
    activeCourse: null,
  };
}

export function isVucaComplete(progress: VucaProgress): boolean {
  return (
    progress.V >= VUCA_THRESHOLD &&
    progress.U >= VUCA_THRESHOLD &&
    progress.C >= VUCA_THRESHOLD &&
    progress.A >= VUCA_THRESHOLD
  );
}
