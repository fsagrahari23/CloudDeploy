import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const createProject = createAsyncThunk(
  "project/create",
  async ({ name, gitUrl }, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, gitUrl }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData?.error || `Project create failed: ${res.status}`;
        throw new Error(errorMessage);
      }
      const data = await res.json();
      return data?.data;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

const projectSlice = createSlice({
  name: "project",
  initialState: { current: null, status: "idle", error: null },
  reducers: {
    clearProject(state) {
      state.current = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createProject.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.current = action.payload;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Unknown error";
      });
  },
});

export const { clearProject } = projectSlice.actions;
export default projectSlice.reducer;
