// Global state management using Zustand
import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

interface ExamSession {
  sessionId: string;
  examName: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  mode: 'SIMULATION' | 'STUDY';
  currentQuestionIndex: number;
  responses: Record<number, any>;
  startTime: number;
}

interface ExamStore {
  session: ExamSession | null;
  setSession: (session: ExamSession) => void;
  updateResponse: (questionIndex: number, response: any) => void;
  clearSession: () => void;
}

export const useExamStore = create<ExamStore>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  updateResponse: (questionIndex, response) =>
    set((state) => ({
      session: state.session
        ? {
            ...state.session,
            responses: {
              ...state.session.responses,
              [questionIndex]: response,
            },
          }
        : null,
    })),
  clearSession: () => set({ session: null }),
}));
