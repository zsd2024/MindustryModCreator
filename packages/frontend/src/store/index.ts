import { configureStore } from '@reduxjs/toolkit';
import assetReducer from './assetSlice';
import editorReducer from './editorSlice';
import projectReducer from './projectSlice';

export const store = configureStore({
  reducer: {
    assets: assetReducer,
    editor: editorReducer,
    project: projectReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;