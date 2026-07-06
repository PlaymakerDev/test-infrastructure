"use client"
import { createContext, useContext } from 'react'

export interface ContextProps {

}

export interface PageProviderProps {
  children: React.ReactNode
}

export const ProjectDetailContext = createContext<ContextProps | null>(null)

export const ProjectDetailProvider = (props: PageProviderProps) => {
  const { children } = props

  return (
    <ProjectDetailContext.Provider
      value={{

      }}
    >
      {children}
    </ProjectDetailContext.Provider>
  )
}

export const useProjectDetailContext = () => {
  const context = useContext(ProjectDetailContext);
  if (!context) {
    throw new Error("useProjectDetailContext must be used within a ProjectDetailProvider");
  }
  return context;
};
