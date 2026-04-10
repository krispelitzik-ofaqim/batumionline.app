import React from 'react';

export type AdminContextType = {
  isAdmin: boolean;
  setAdmin: (v: boolean) => void;
};

export const AdminContext = React.createContext<AdminContextType>({
  isAdmin: false,
  setAdmin: () => {},
});
