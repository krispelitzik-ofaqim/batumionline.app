import React from 'react';

export type PreviewMode = 'mobile' | 'tablet' | 'desktop' | null;

export type PreviewContextType = {
  mode: PreviewMode;
  setMode: (m: PreviewMode) => void;
  simulatedWidth: number | null;
};

export const PreviewContext = React.createContext<PreviewContextType>({
  mode: null,
  setMode: () => {},
  simulatedWidth: null,
});
