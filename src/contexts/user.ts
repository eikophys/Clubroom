import React, { createContext } from 'react';

export const AuthContext = createContext<{
  loginStatus: {
    current: boolean | null;
    update?: React.Dispatch<React.SetStateAction<boolean | null>>;
  };
  accountEnablement: {
    current: boolean | null;
    update?: React.Dispatch<React.SetStateAction<boolean | null>>;
  };
}>({
  loginStatus: { current: false },
  accountEnablement: { current: false },
});