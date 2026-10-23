import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ScreenId } from '../types';

type HandleMap = Partial<Record<ScreenId, number | null>>;

type FocusTarget = {
  requestTVFocus?: () => void;
};

type NavReturnState = {
  /** Native tag of each screen's row in the main menu. */
  mains: HandleMap;
  /** Native tag of the first row in each screen's submenu. */
  entries: HandleMap;
  setMain: (screen: ScreenId, handle: number | null) => void;
  setEntry: (screen: ScreenId, handle: number | null) => void;
  /** Keeps the main-menu row so a screen can put focus back on it. */
  registerMainNode: (screen: ScreenId, node: FocusTarget | null) => void;
  focusMain: (screen: ScreenId) => void;
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

  const mainNodes = useRef<Partial<Record<ScreenId, FocusTarget | null>>>({});
  const registerMainNode = useCallback(
    (screen: ScreenId, node: FocusTarget | null) => {
      mainNodes.current[screen] = node;
    },
    [],
  );
  const focusMain = useCallback((screen: ScreenId) => {
    const node = mainNodes.current[screen];
    if (node != null && typeof node.requestTVFocus === 'function') {
      node.requestTVFocus();
    }
  }, []);

  const value = useMemo(
    () => ({
      mains,
      entries,
      setMain,
      setEntry,
      registerMainNode,
      focusMain,
    }),
    [entries, focusMain, mains, registerMainNode, setEntry, setMain],
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
