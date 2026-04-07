"use client"
import { createContext, useContext } from 'react'

export interface ContextProps {
  text?: string;
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const LoginContext = createContext<ContextProps | null>(null)

export const LoginProvider = (props: PageProviderProps) => {
  const { children } = props

  return (
    <LoginContext.Provider
      value={{}}
    >
      {children}
    </LoginContext.Provider>
  )
}

export const useLoginContext = () => {
  const context = useContext(LoginContext);
  if (!context) {
    throw new Error("useLoginContext must be used within a LoginProvider");
  }
  return context;
};
