import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const createProject = createAsyncThunk(
  "project/create",
  async ({ name, gitUrl }, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        "/api/project",
        { name, gitUrl },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true, // 👈 important to send cookies
        }
      );

      return res.data?.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to create project";
      return rejectWithValue(errorMessage);
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
