import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createInitialState } from '../state';
import type {
  Wall,
  Floor,
  Period,
  WindowSide,
  CurtainSettings,
  LightingSettings,
  RugColor,
} from '../types';

export const roomSlice = createSlice({
  name: 'room',
  initialState: createInitialState(),
  reducers: {
    wallChanged(state, action: PayloadAction<Wall>) {
      state.wall = action.payload;
    },
    floorChanged(state, action: PayloadAction<Floor>) {
      state.floor = action.payload;
    },
    periodChanged(state, action: PayloadAction<Period>) {
      state.period = action.payload;
    },
    curtainChanged(
      state,
      action: PayloadAction<{
        side: WindowSide;
        changes: Partial<CurtainSettings>;
      }>,
    ) {
      const { side, changes } = action.payload;
      if (
        changes.length !== undefined &&
        (!Number.isFinite(changes.length) ||
          changes.length < 120 ||
          changes.length > 260 ||
          changes.length % 10 !== 0)
      )
        return;
      Object.assign(state.curtains[side], changes);
    },
    curtainsAppliedToAll(state, action: PayloadAction<WindowSide>) {
      const settings = { ...state.curtains[action.payload], enabled: true };
      state.curtains = { left: { ...settings }, back: { ...settings } };
    },
    lightingChanged(state, action: PayloadAction<Partial<LightingSettings>>) {
      const { brightness } = action.payload;
      if (
        brightness !== undefined &&
        (!Number.isFinite(brightness) ||
          brightness < 10 ||
          brightness > 100 ||
          brightness % 5 !== 0)
      )
        return;
      Object.assign(state.lighting, action.payload);
    },
    rugToggled(state, action: PayloadAction<boolean>) {
      state.rug.enabled = action.payload;
    },
    rugColorChanged(state, action: PayloadAction<RugColor>) {
      state.rug.color = action.payload;
    },
    roomReset: () => createInitialState(),
  },
});
export const {
  wallChanged,
  floorChanged,
  periodChanged,
  curtainChanged,
  curtainsAppliedToAll,
  lightingChanged,
  rugToggled,
  rugColorChanged,
  roomReset,
} = roomSlice.actions;
export default roomSlice.reducer;
