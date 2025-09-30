// store/slices/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

// Helper function to normalize role data
const normalizeRole = (role?: string): string => {
  if (!role) return "Member";
  switch (role.toLowerCase()) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "member":
      return "Member";
    default:
      return role; // Keep original if it's something else
  }
};

export interface Workspace {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
  workspaces: [],
  currentWorkspace: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ token: string; user: AuthUser }>
    ) {
      state.token = action.payload.token;
      state.user = {
        ...action.payload.user,
        role: normalizeRole(action.payload.user.role),
      };
    },
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
    },
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload
        ? {
            ...action.payload,
            role: normalizeRole(action.payload.role),
          }
        : null;
    },
    setWorkspaces(state, action: PayloadAction<Workspace[]>) {
      state.workspaces = action.payload;
    },
    setCurrentWorkspace(state, action: PayloadAction<Workspace | null>) {
      state.currentWorkspace = action.payload;
    },
    addWorkspace(state, action: PayloadAction<Workspace>) {
      state.workspaces.push(action.payload);
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.workspaces = [];
      state.currentWorkspace = null;
    },
  },
});

export const {
  setCredentials,
  setToken,
  setUser,
  setWorkspaces,
  setCurrentWorkspace,
  addWorkspace,
  logout,
} = authSlice.actions;
export const authReducer = authSlice.reducer;
