import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface ThemeContextType {
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({ isDark: true });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
