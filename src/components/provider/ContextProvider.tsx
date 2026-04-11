"use client"
import { createContext, useContext } from 'react'

export interface ContextProps {
  text?: string;
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const PageContext = createContext<ContextProps | null>(null)

export const PageProvider = (props: PageProviderProps) => {
  const { children } = props

  return (
    <PageContext.Provider
      value={{}}
    >
      {children}
    </PageContext.Provider>
  )
}

export const usePageContext = () => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error("usePageContext must be used within an PageProvider");
  }
  return context;
};
