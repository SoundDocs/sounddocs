import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CalibrationState {
  calibrationOffset: number;
  lastCalibrationDate: string | null;
}

interface CalibrationActions {
  setCalibrationOffset: (offset: number) => void;
  resetCalibration: () => void;
}

export const useCalibrationStore = create<CalibrationState & CalibrationActions>()(
  persist(
    (set) => ({
      // State
      calibrationOffset: 0,
      lastCalibrationDate: null,

      // Actions
      setCalibrationOffset: (offset: number) =>
        set({
          calibrationOffset: offset,
          lastCalibrationDate: new Date().toISOString(),
        }),

      resetCalibration: () =>
        set({
          calibrationOffset: 0,
          lastCalibrationDate: null,
        }),
    }),
    {
      name: "sounddocs-calibration",
      version: 1,
    },
  ),
);
