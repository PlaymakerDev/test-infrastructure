"use client"
import { createContext, useContext } from 'react'

export interface ContextProps {
  text?: string;
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const ExampleContext = createContext<ContextProps | null>(null)

export const ExampleProvider = (props: PageProviderProps) => {
  const { children } = props

  return (
    <ExampleContext.Provider
      value={{}}
    >
      {children}
    </ExampleContext.Provider>
  )
}

export const useExampleContext = () => {
  const context = useContext(ExampleContext);
  if (!context) {
    throw new Error("useExampleContext must be used within a ExampleProvider");
  }
  return context;
};
