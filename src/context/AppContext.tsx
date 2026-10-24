"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import {
  AppState,
  ColumnMapping,
  EmailConfig,
  PersonalizedEmail,
  PromotionalMaterial,
  SchoolRecord,
  SendingResult,
  WorkflowStep,
} from "@/types";

const SESSION_KEY = "schoolreach_session";

const initialEmailConfig: EmailConfig = {
  campaignName: "School Outreach Campaign",
  senderName: "",
  replyTo: "",
  subject: "Supporting Student Learning at {{school_name}}",
  body: `Dear {{principal_name}},

I am reaching out regarding an education platform designed to help schools provide students with more personalised academic support and stronger conceptual understanding.

We would love to understand how {{school_name}} currently supports students academically and explore whether our platform could add value to your existing learning ecosystem.

Would you be available for a short discovery call?

Regards,
[Your Name]`,
  aiPersonalization: true,
};

const initialState: AppState = {
  step: "upload",
  demoMode: false,
  rawHeaders: [],
  rawRows: [],
  fileName: "",
  columnMapping: {},
  schools: [],
  selectedSchoolIds: new Set(),
  emailConfig: initialEmailConfig,
  promotionalMaterial: { type: "none" },
  personalizedEmails: new Map(),
  sendingResults: [],
  isSending: false,
  sendingStopped: false,
};

type Action =
  | { type: "SET_STEP"; step: WorkflowStep }
  | { type: "SET_DEMO_MODE"; value: boolean }
  | {
      type: "SET_FILE_DATA";
      headers: string[];
      rows: Record<string, string>[];
      fileName: string;
    }
  | { type: "SET_COLUMN_MAPPING"; mapping: Partial<ColumnMapping> }
  | { type: "SET_SCHOOLS"; schools: SchoolRecord[] }
  | { type: "SET_SELECTED_IDS"; ids: Set<string> }
  | { type: "TOGGLE_SCHOOL"; id: string }
  | { type: "SELECT_ALL" }
  | { type: "DESELECT_ALL" }
  | { type: "SET_EMAIL_CONFIG"; config: Partial<EmailConfig> }
  | { type: "SET_PROMOTIONAL_MATERIAL"; material: PromotionalMaterial }
  | { type: "SET_PERSONALIZED_EMAIL"; schoolId: string; email: PersonalizedEmail }
  | { type: "SET_SENDING_RESULTS"; results: SendingResult[] }
  | { type: "ADD_SENDING_RESULTS"; results: SendingResult[] }
  | { type: "SET_IS_SENDING"; value: boolean }
  | { type: "SET_SENDING_STOPPED"; value: boolean }
  | { type: "RESET" };

function serialize(state: AppState): string {
  return JSON.stringify({
    ...state,
    selectedSchoolIds: Array.from(state.selectedSchoolIds),
    personalizedEmails: Array.from(state.personalizedEmails.entries()),
  });
}

function deserialize(raw: string): Partial<AppState> {
  try {
    const obj = JSON.parse(raw);
    return {
      ...obj,
      selectedSchoolIds: new Set(obj.selectedSchoolIds || []),
      personalizedEmails: new Map(obj.personalizedEmails || []),
    };
  } catch {
    return {};
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step };
    case "SET_DEMO_MODE":
      return { ...state, demoMode: action.value };
    case "SET_FILE_DATA":
      return {
        ...state,
        rawHeaders: action.headers,
        rawRows: action.rows,
        fileName: action.fileName,
      };
    case "SET_COLUMN_MAPPING":
      return { ...state, columnMapping: action.mapping };
    case "SET_SCHOOLS":
      return { ...state, schools: action.schools };
    case "SET_SELECTED_IDS":
      return { ...state, selectedSchoolIds: action.ids };
    case "TOGGLE_SCHOOL": {
      const next = new Set(state.selectedSchoolIds);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, selectedSchoolIds: next };
    }
    case "SELECT_ALL": {
      const validIds = state.schools
        .filter((s) => s.status === "valid")
        .map((s) => s.id);
      return { ...state, selectedSchoolIds: new Set(validIds) };
    }
    case "DESELECT_ALL":
      return { ...state, selectedSchoolIds: new Set() };
    case "SET_EMAIL_CONFIG":
      return {
        ...state,
        emailConfig: { ...state.emailConfig, ...action.config },
      };
    case "SET_PROMOTIONAL_MATERIAL":
      return { ...state, promotionalMaterial: action.material };
    case "SET_PERSONALIZED_EMAIL": {
      const next = new Map(state.personalizedEmails);
      next.set(action.schoolId, action.email);
      return { ...state, personalizedEmails: next };
    }
    case "SET_SENDING_RESULTS":
      return { ...state, sendingResults: action.results };
    case "ADD_SENDING_RESULTS":
      return {
        ...state,
        sendingResults: [...state.sendingResults, ...action.results],
      };
    case "SET_IS_SENDING":
      return { ...state, isSending: action.value };
    case "SET_SENDING_STOPPED":
      return { ...state, sendingStopped: action.value };
    case "RESET":
      return { ...initialState, demoMode: state.demoMode };
    default:
      return state;
  }
}

type ContextType = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  goToStep: (step: WorkflowStep) => void;
};

const AppContext = createContext<ContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    if (typeof window === "undefined") return init;
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const restored = deserialize(saved);
        return {
          ...init,
          ...restored,
          isSending: false,
          sendingStopped: false,
        };
      }
    } catch {}
    return init;
  });

  // Persist to sessionStorage (except large binary data)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // Don't persist promotional image/pdf data (too large)
      const toSave = {
        ...state,
        promotionalMaterial:
          state.promotionalMaterial.type === "image" ||
          state.promotionalMaterial.type === "pdf"
            ? { type: state.promotionalMaterial.type, imageName: state.promotionalMaterial.imageName, pdfName: state.promotionalMaterial.pdfName }
            : state.promotionalMaterial,
      };
      sessionStorage.setItem(SESSION_KEY, serialize(toSave as AppState));
    } catch {}
  }, [state]);

  const goToStep = useCallback(
    (step: WorkflowStep) => dispatch({ type: "SET_STEP", step }),
    []
  );

  return (
    <AppContext.Provider value={{ state, dispatch, goToStep }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
