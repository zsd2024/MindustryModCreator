import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EditorMode, HjsonSchema } from '../types';

interface EditorState {
  mode: EditorMode;
  hjsonData: HjsonSchema | null;
  javaBlocks: any | null;
  isDirty: boolean;
  previewHtml: string | null;
}

const initialState: EditorState = {
  mode: 'hjson',
  hjsonData: null,
  javaBlocks: null,
  isDirty: false,
  previewHtml: null,
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<EditorMode>) => {
      state.mode = action.payload;
    },
    setHjsonData: (state, action: PayloadAction<HjsonSchema | null>) => {
      state.hjsonData = action.payload;
      state.isDirty = true;
    },
    setJavaBlocks: (state, action: PayloadAction<any | null>) => {
      state.javaBlocks = action.payload;
      state.isDirty = true;
    },
    markClean: (state) => {
      state.isDirty = false;
    },
    setPreviewHtml: (state, action: PayloadAction<string | null>) => {
      state.previewHtml = action.payload;
    },
    resetEditor: (state) => {
      state.mode = 'hjson';
      state.hjsonData = null;
      state.javaBlocks = null;
      state.isDirty = false;
      state.previewHtml = null;
    },
  },
});

export const { setMode, setHjsonData, setJavaBlocks, markClean, setPreviewHtml, resetEditor } = editorSlice.actions;
export default editorSlice.reducer;