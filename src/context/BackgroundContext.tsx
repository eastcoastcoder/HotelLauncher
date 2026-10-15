import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  MenuBackground,
  menuBackgrounds as defaultMenuBackgrounds,
} from '../theme/screenBackground';

export type BackgroundController = {
  /** Image and scrim for the hovered menu item, or the active one when nothing is hovered. */
  screenBackground: MenuBackground | null;
  hoveredMenuItemId: string | null;
  activeMenuItemId: string | null;
  /** TV focus is the hover state. */
  setHoveredMenuItem: (menuItemId: string) => void;
  clearHoveredMenuItem: (menuItemId: string) => void;
  /** Select keeps this item's background after focus leaves the row. */
  setActiveMenuItem: (menuItemId: string) => void;
  /** Drop hover and active claims owned by menu items that are leaving the tree. */
  releaseMenuItems: (menuItemIds: ReadonlySet<string>) => void;
};

const BackgroundContext = createContext<BackgroundController | null>(null);

type BackgroundProviderProps = {
  children: ReactNode;
  backgrounds?: Readonly<Record<string, MenuBackground>>;
};

function defer(work: () => void) {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(work);
    return;
  }
  setTimeout(work, 0);
}

export function BackgroundProvider({
  children,
  backgrounds = defaultMenuBackgrounds,
}: BackgroundProviderProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const hoverGeneration = useRef(0);

  const setHoveredMenuItem = useCallback((menuItemId: string) => {
    hoverGeneration.current += 1;
    setHoveredId(menuItemId);
  }, []);

  const clearHoveredMenuItem = useCallback((menuItemId: string) => {
    const ticket = hoverGeneration.current + 1;
    hoverGeneration.current = ticket;
    // Blur is delivered before the next row's focus. Wait a frame so a move
    // between items does not flash the default background in between.
    defer(() => {
      if (ticket !== hoverGeneration.current) {
        return;
      }
      setHoveredId(current => (current === menuItemId ? null : current));
    });
  }, []);

  const setActiveMenuItem = useCallback((menuItemId: string) => {
    setActiveId(menuItemId);
  }, []);

  const releaseMenuItems = useCallback((menuItemIds: ReadonlySet<string>) => {
    setHoveredId(current =>
      current != null && menuItemIds.has(current) ? null : current,
    );
    setActiveId(current =>
      current != null && menuItemIds.has(current) ? null : current,
    );
  }, []);

  const backgroundMenuItemId = hoveredId ?? activeId;
  const screenBackground =
    backgroundMenuItemId == null
      ? null
      : backgrounds[backgroundMenuItemId] ?? null;

  const value = useMemo<BackgroundController>(
    () => ({
      screenBackground,
      hoveredMenuItemId: hoveredId,
      activeMenuItemId: activeId,
      setHoveredMenuItem,
      clearHoveredMenuItem,
      setActiveMenuItem,
      releaseMenuItems,
    }),
    [
      screenBackground,
      hoveredId,
      activeId,
      setHoveredMenuItem,
      clearHoveredMenuItem,
      setActiveMenuItem,
      releaseMenuItems,
    ],
  );

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground(): BackgroundController {
  const value = useContext(BackgroundContext);
  if (value == null) {
    throw new Error('useBackground must be used within BackgroundProvider');
  }
  return value;
}

export function useScreenBackground(): MenuBackground | null {
  return useBackground().screenBackground;
}
