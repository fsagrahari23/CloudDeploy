import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const startDeployment = createAsyncThunk(
  "deploy/start",
  async ({ projectId }, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Deploy start failed: ${res.status}`);
      const data = await res.json();
      return data?.data;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const refreshProjectData = createAsyncThunk(
  "deploy/refreshProject",
  async ({ projectId }, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error(`Project refresh failed: ${res.status}`);
      const data = await res.json();
      return data?.data || null;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchLogs = createAsyncThunk(
  "deploy/logs",
  async ({ deploymentId }, { rejectWithValue }) => {
    try {
      if (!deploymentId) throw new Error("Missing deployment id");
      const res = await fetch(`/api/logs/${deploymentId}`);
      if (!res.ok) throw new Error(`Logs fetch failed: ${res.status}`);
      const data = await res.json();
      return { deploymentId, logs: data?.data || [] };
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

const deploySlice = createSlice({
  name: "deploy",
  initialState: {
    deploymentId: null,
    status: "idle",
    error: null,
    logs: [],
    deploymentStatus: "idle", // Track deployment completion
    currentProject: null, // Store current project data
    currentDeploymentId: null, // Track which deployment the logs belong to
  },
  reducers: {
    clearDeployment(state) {
      state.deploymentId = null;
      state.status = "idle";
      state.error = null;
      state.logs = [];
      state.deploymentStatus = "idle";
      state.currentProject = null;
      state.currentDeploymentId = null;
    },
    appendLogs(state, action) {
      // Deduplicate by concatenated key
      const existing = new Set(state.logs.map((l) => `${l.timestamp}|${l.log}`));
      action.payload.forEach((l) => {
        const key = `${l.timestamp}|${l.log}`;
        if (!existing.has(key)) {
          state.logs.push(l);
          existing.add(key);
        }
      });
    },
    setDeploymentStatus(state, action) {
      state.deploymentStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startDeployment.pending, (state) => {
        state.status = "loading";
        state.error = null;
        // Clear previous deployment logs when starting a NEW deployment
        state.logs = [];
        state.deploymentStatus = "idle";
      })
      .addCase(startDeployment.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.deploymentId = action.payload?.deploymentId || null;
      })
      .addCase(startDeployment.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Unknown error";
      })
      .addCase(fetchLogs.fulfilled, (state, action) => {
        const { deploymentId, logs } = action.payload;
        
        // If fetching logs for a different deployment, clear old logs
        if (state.currentDeploymentId && state.currentDeploymentId !== deploymentId) {
          state.logs = [];
          state.deploymentStatus = "idle";
        }
        
        // Track which deployment these logs belong to
        state.currentDeploymentId = deploymentId;
        
        // Sort logs by timestamp before adding
        const sortedLogs = (logs || []).sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeA - timeB;
        });
        
        const existing = new Set(state.logs.map((l) => `${l.timestamp}|${l.log}`));
        sortedLogs.forEach((l) => {
          const key = `${l.timestamp}|${l.log}`;
          if (!existing.has(key)) {
            state.logs.push(l);
            existing.add(key);
          }
          
          // Check for deployment completion
          if (l.log && l.log.includes("All files uploaded successfully. Build process complete.")) {
            state.deploymentStatus = "READY";
          }
        });
        
        // Re-sort the entire logs array by timestamp
        state.logs.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeA - timeB;
        });
      })
      .addCase(refreshProjectData.fulfilled, (state, action) => {
        state.currentProject = action.payload;
      });
  },
});

export const { clearDeployment, appendLogs, setDeploymentStatus } = deploySlice.actions;
export default deploySlice.reducer;
