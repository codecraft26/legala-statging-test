// store/slices/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

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
      state.user = action.payload.user;
    },
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
    },
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
    },
    setWorkspaces(state, action: PayloadAction<Workspace[]>) {
      state.workspaces = action.payload;
    },
    setCurrentWorkspace(state, action: PayloadAction<Workspace | null>) {
      state.currentWorkspace = action.payload;
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
  logout,
} = authSlice.actions;
export const authReducer = authSlice.reducer;
