import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ScreenId } from '../types';

type HandleMap = Partial<Record<ScreenId, number | null>>;

type NavReturnState = {
  /** Native tag of each screen's row in the main menu. */
  mains: HandleMap;
  /** Native tag of the first row in each screen's submenu. */
  entries: HandleMap;
  setMain: (screen: ScreenId, handle: number | null) => void;
  setEntry: (screen: ScreenId, handle: number | null) => void;
};

const NavReturnContext = createContext<NavReturnState | null>(null);

function remember(
  current: HandleMap,
  screen: ScreenId,
  handle: number | null,
): HandleMap {
  if (current[screen] === handle) {
    return current;
  }
  return { ...current, [screen]: handle };
}

/**
 * Links a screen menu row to the submenu it opened.
 * Left from the submenu returns to that row. Right from that row enters the submenu.
 */
export function NavReturnProvider({ children }: { children: ReactNode }) {
  const [mains, setMains] = useState<HandleMap>({});
  const [entries, setEntries] = useState<HandleMap>({});

  const setMain = useCallback((screen: ScreenId, handle: number | null) => {
    setMains(current => remember(current, screen, handle));
  }, []);

  const setEntry = useCallback((screen: ScreenId, handle: number | null) => {
    setEntries(current => remember(current, screen, handle));
  }, []);

  const value = useMemo(
    () => ({ mains, entries, setMain, setEntry }),
    [entries, mains, setEntry, setMain],
  );

  return (
    <NavReturnContext.Provider value={value}>
      {children}
    </NavReturnContext.Provider>
  );
}

export function useNavReturn() {
  return useContext(NavReturnContext);
}
