'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from 'react';
import type { AgentState, SmartCardData } from '@/types';

// ─── State Shape ─────────────────────────────────────────────────────────────
interface AgentContextState {
  agentState: AgentState;
  smartCardsVisible: boolean;
  smartCards: SmartCardData[];
  isMuted: boolean;
}

// ─── Actions ─────────────────────────────────────────────────────────────────
type AgentAction =
  | { type: 'SET_STATE'; payload: AgentState }
  | { type: 'SHOW_CARDS'; payload: SmartCardData[] }
  | { type: 'HIDE_CARDS' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'RESET' };

// ─── Context Interface ────────────────────────────────────────────────────────
interface AgentContextValue extends AgentContextState {
  setAgentState: (state: AgentState) => void;
  showSmartCards: (cards: SmartCardData[]) => void;
  hideSmartCards: () => void;
  toggleMute: () => void;
  reset: () => void;
}

// ─── Reducer ─────────────────────────────────────────────────────────────────
const initialState: AgentContextState = {
  agentState: 'idle',
  smartCardsVisible: false,
  smartCards: [],
  isMuted: false,
};

function agentReducer(
  state: AgentContextState,
  action: AgentAction,
): AgentContextState {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, agentState: action.payload };
    case 'SHOW_CARDS':
      return { ...state, smartCardsVisible: true, smartCards: action.payload };
    case 'HIDE_CARDS':
      return { ...state, smartCardsVisible: false };
    case 'TOGGLE_MUTE':
      return { ...state, isMuted: !state.isMuted };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AgentContext = createContext<AgentContextValue | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(agentReducer, initialState);

  const setAgentState = useCallback((s: AgentState) => {
    dispatch({ type: 'SET_STATE', payload: s });
  }, []);

  const showSmartCards = useCallback((cards: SmartCardData[]) => {
    dispatch({ type: 'SHOW_CARDS', payload: cards });
  }, []);

  const hideSmartCards = useCallback(() => {
    dispatch({ type: 'HIDE_CARDS' });
  }, []);

  const toggleMute = useCallback(() => {
    dispatch({ type: 'TOGGLE_MUTE' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <AgentContext.Provider
      value={{
        ...state,
        setAgentState,
        showSmartCards,
        hideSmartCards,
        toggleMute,
        reset,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgent must be used within AgentProvider');
  return ctx;
}
