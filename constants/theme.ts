import React from 'react';

export type ThemeContextType = {
  dark: boolean;
  toggle: () => void;
};

export const ThemeContext = React.createContext<ThemeContextType>({
  dark: false,
  toggle: () => {},
});
