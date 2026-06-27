import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProjectMeta } from '../types';

interface ProjectState {
  meta: ProjectMeta;
  isSaving: boolean;
  lastSaved: string | null;
  error: string | null;
}

const initialState: ProjectState = {
  meta: {
    name: 'my-awesome-mod',
    displayName: '我的牛逼Mod',
    author: 'Dev',
    description: 'A test mod.',
    version: '1.0',
    minGameVersion: '145',
  },
  isSaving: false,
  lastSaved: null,
  error: null,
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    updateMeta: (state, action: PayloadAction<Partial<ProjectMeta>>) => {
      state.meta = { ...state.meta, ...action.payload };
    },
    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },
    setLastSaved: (state, action: PayloadAction<string>) => {
      state.lastSaved = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetProject: (state) => {
      state.meta = initialState.meta;
      state.isSaving = false;
      state.lastSaved = null;
      state.error = null;
    },
  },
});

export const { updateMeta, setSaving, setLastSaved, setError, resetProject } = projectSlice.actions;
export default projectSlice.reducer;