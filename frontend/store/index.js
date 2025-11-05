"use client";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import githubReducer from "./slices/githubSlice";
import projectReducer from "./slices/projectSlice";
import deployReducer from "./slices/deploySlice";

export const store = configureStore({
  reducer: {
    github: githubReducer,
    project: projectReducer,
    deploy: deployReducer,
  },
});

export function ReduxProvider({ children }) {
  return <Provider store={store}>{children}</Provider>;
}
