import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  toggle: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove("light", "dark");
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
        
      root.classList.add(systemTheme);
      return;
    }
    
    root.classList.add(theme);
  }, [theme]);

  const toggle = () => {
    setTheme((prevTheme) => {
      if (prevTheme === "light") {
        localStorage.setItem("theme", "dark");
        return "dark";
      } else if (prevTheme === "dark") {
        localStorage.setItem("theme", "system");
        return "system";
      } else {
        localStorage.setItem("theme", "light");
        return "light";
      }
    });
  };

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem("theme", theme);
      setTheme(theme);
    },
    toggle,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
    
  return context;
};
