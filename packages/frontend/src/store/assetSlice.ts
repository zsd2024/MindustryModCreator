import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AssetNode } from '../types';

interface AssetState {
  nodes: Record<string, AssetNode>;
  selectedId: string | null;
  expandedIds: string[];
}

const initialState: AssetState = {
  nodes: {},
  selectedId: null,
  expandedIds: [],
};

const assetSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    addNode: (state, action: PayloadAction<AssetNode>) => {
      state.nodes[action.payload.id] = action.payload;
    },
    removeNode: (state, action: PayloadAction<string>) => {
      delete state.nodes[action.payload];
      if (state.selectedId === action.payload) {
        state.selectedId = null;
      }
    },
    updateNode: (state, action: PayloadAction<Partial<AssetNode> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      if (state.nodes[id]) {
        state.nodes[id] = { ...state.nodes[id], ...updates };
      }
    },
    selectNode: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
    },
    toggleExpanded: (state, action: PayloadAction<string>) => {
      const index = state.expandedIds.indexOf(action.payload);
      if (index === -1) {
        state.expandedIds.push(action.payload);
      } else {
        state.expandedIds.splice(index, 1);
      }
    },
    moveNode: (state, action: PayloadAction<{ id: string; parentId: string | null; order: number }>) => {
      const { id, parentId, order } = action.payload;
      if (state.nodes[id]) {
        state.nodes[id].parentId = parentId;
        state.nodes[id].order = order;
      }
    },
  },
});

export const { addNode, removeNode, updateNode, selectNode, toggleExpanded, moveNode } = assetSlice.actions;
export default assetSlice.reducer;