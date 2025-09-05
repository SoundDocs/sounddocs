import { create } from "zustand";
import { CommsElementProps } from "../components/comms-planner/CommsElement";
import { CommsBeltpackProps } from "../components/comms-planner/CommsBeltpack";
import { Zone } from "../lib/commsTypes";

interface CommsPlannerData {
  planName: string;
  elements: CommsElementProps[];
  beltpacks: CommsBeltpackProps[];
  zones: Zone[];
  venueWidth: number;
  venueHeight: number;
  dfsEnabled: boolean;
  poeBudget: number;
}

interface HistoryState {
  past: CommsPlannerData[];
  future: CommsPlannerData[];
}

interface CommsPlannerState extends CommsPlannerData {
  history: HistoryState;
  setPlanName: (name: string) => void;
  setElements: (elements: CommsElementProps[]) => void;
  addElement: (element: CommsElementProps) => void;
  updateElement: (id: string, props: Partial<CommsElementProps>) => void;
  removeElement: (id: string) => void;
  setBeltpacks: (beltpacks: CommsBeltpackProps[]) => void;
  addBeltpack: (beltpack: CommsBeltpackProps) => void;
  updateBeltpack: (id: string, props: Partial<CommsBeltpackProps>) => void;
  removeBeltpack: (id: string) => void;
  setZones: (zones: Zone[]) => void;
  addZone: (zone: Zone) => void;
  updateZone: (id: string, props: Partial<Zone>) => void;
  removeZone: (id: string) => void;
  setVenueWidth: (width: number) => void;
  setVenueHeight: (height: number) => void;
  setDfsEnabled: (enabled: boolean) => void;
  setPoeBudget: (budget: number) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

const initialData: CommsPlannerData = {
  planName: "Untitled Comms Plan",
  elements: [],
  beltpacks: [],
  zones: [],
  venueWidth: 100,
  venueHeight: 80,
  dfsEnabled: false,
  poeBudget: 370,
};

const initialState = {
  ...initialData,
  history: { past: [], future: [] },
};

// Helper function to save current state to history
const saveToHistory = (state: CommsPlannerState) => {
  const currentData: CommsPlannerData = {
    planName: state.planName,
    elements: state.elements,
    beltpacks: state.beltpacks,
    zones: state.zones,
    venueWidth: state.venueWidth,
    venueHeight: state.venueHeight,
    dfsEnabled: state.dfsEnabled,
    poeBudget: state.poeBudget,
  };
  return {
    ...state,
    history: {
      past: [...state.history.past, currentData].slice(-50), // Cap at 50 entries
      future: [],
    },
  };
};

export const useCommsPlannerStore = create<CommsPlannerState>((set) => ({
  ...initialState,
  setPlanName: (name) => set((state) => saveToHistory({ ...state, planName: name })),
  setElements: (elements) => set((state) => saveToHistory({ ...state, elements })),
  addElement: (element) =>
    set((state) =>
      saveToHistory({
        ...state,
        elements: [...state.elements, element],
      }),
    ),
  updateElement: (id, props) =>
    set((state) =>
      saveToHistory({
        ...state,
        elements: state.elements.map((el) => (el.id === id ? { ...el, ...props } : el)),
      }),
    ),
  removeElement: (id) =>
    set((state) =>
      saveToHistory({
        ...state,
        elements: state.elements.filter((el) => el.id !== id),
      }),
    ),
  setBeltpacks: (beltpacks) => set((state) => saveToHistory({ ...state, beltpacks })),
  addBeltpack: (beltpack) =>
    set((state) =>
      saveToHistory({
        ...state,
        beltpacks: [...state.beltpacks, beltpack],
      }),
    ),
  updateBeltpack: (id, props) =>
    set((state) =>
      saveToHistory({
        ...state,
        beltpacks: state.beltpacks.map((bp) => (bp.id === id ? { ...bp, ...props } : bp)),
      }),
    ),
  removeBeltpack: (id) =>
    set((state) =>
      saveToHistory({
        ...state,
        beltpacks: state.beltpacks.filter((bp) => bp.id !== id),
      }),
    ),
  setZones: (zones) => set((state) => saveToHistory({ ...state, zones })),
  addZone: (zone) =>
    set((state) =>
      saveToHistory({
        ...state,
        zones: [...state.zones, zone],
      }),
    ),
  updateZone: (id, props) =>
    set((state) =>
      saveToHistory({
        ...state,
        zones: state.zones.map((z) => (z.id === id ? { ...z, ...props } : z)),
      }),
    ),
  removeZone: (id) =>
    set((state) =>
      saveToHistory({
        ...state,
        zones: state.zones.filter((z) => z.id !== id),
      }),
    ),
  setVenueWidth: (width) => set((state) => saveToHistory({ ...state, venueWidth: width })),
  setVenueHeight: (height) => set((state) => saveToHistory({ ...state, venueHeight: height })),
  setDfsEnabled: (enabled) => set((state) => saveToHistory({ ...state, dfsEnabled: enabled })),
  setPoeBudget: (budget) => set((state) => saveToHistory({ ...state, poeBudget: budget })),
  undo: () =>
    set((state) => {
      const { past, future } = state.history;
      if (past.length === 0) return state;

      const previous = past[past.length - 1];
      const newPast = past.slice(0, -1);

      return {
        ...previous,
        history: {
          past: newPast,
          future: [state, ...future],
        },
      };
    }),
  redo: () =>
    set((state) => {
      const { past, future } = state.history;
      if (future.length === 0) return state;

      const next = future[0];
      const newFuture = future.slice(1);

      return {
        ...next,
        history: {
          past: [...past, state],
          future: newFuture,
        },
      };
    }),
  reset: () => set(initialState),
}));
