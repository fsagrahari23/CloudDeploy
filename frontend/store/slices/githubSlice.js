import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// Fetch repos via our Next.js API which uses the user's GitHub token from session
export const fetchRepos = createAsyncThunk("github/fetchRepos", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch("/api/github/repos");
    if (!res.ok) {
      // Handle GitHub not connected case
      if (res.status === 401) {
        return rejectWithValue("GitHub not connected");
      }
      throw new Error(`Repo fetch failed: ${res.status}`);
    }
    const data = await res.json();
    return data?.data || [];
  } catch (e) {
    return rejectWithValue(e.message);
  }
});

const githubSlice = createSlice({
  name: "github",
  initialState: { repos: [], status: "idle", error: null },
  reducers: {
    // Reset repos state when disconnecting GitHub
    resetRepos: (state) => {
      state.repos = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRepos.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchRepos.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.repos = action.payload;
      })
      .addCase(fetchRepos.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Unknown error";
      });
  },
});

export const { resetRepos } = githubSlice.actions;
export default githubSlice.reducer;
