"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface StateSearchContextType {
  query: string;
  setQuery: (q: string) => void;
}

const StateSearchContext = createContext<StateSearchContextType>({
  query: "",
  setQuery: () => {},
});

export function StateSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  return (
    <StateSearchContext.Provider value={{ query, setQuery }}>
      {children}
    </StateSearchContext.Provider>
  );
}

export function useStateSearch() {
  return useContext(StateSearchContext);
}
