import { createContext, Fragment, ReactNode, useContext, useEffect, useId, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

interface PortalApi {
  mount: (key: string, node: ReactNode) => void;
  unmount: (key: string) => void;
}

const PortalContext = createContext<PortalApi | null>(null);

/**
 * Renders portaled content above the whole navigator (including the tab bar). Sheets use this
 * instead of RN `Modal`, whose separate native window drops Reanimated style updates on the new
 * architecture, so sheets would appear without animating.
 */
export function PortalHost({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<Record<string, ReactNode>>({});

  const api = useMemo<PortalApi>(
    () => ({
      mount: (key, node) => setNodes((prev) => ({ ...prev, [key]: node })),
      unmount: (key) =>
        setNodes((prev) => {
          if (!(key in prev)) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        }),
    }),
    []
  );

  return (
    <PortalContext.Provider value={api}>
      {children}
      {/* box-none so an empty overlay never blocks tab/card presses after sheets unmount */}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill} collapsable={false}>
        {Object.entries(nodes).map(([key, node]) => (
          <Fragment key={key}>{node}</Fragment>
        ))}
      </View>
    </PortalContext.Provider>
  );
}

export function Portal({ children }: { children: ReactNode }) {
  const api = useContext(PortalContext);
  const key = useId();

  // Update portaled content in place. Do NOT unmount in this effect's cleanup when
  // `children` changes — that cleanup→remount gap flashes nested sheets (e.g. Chanters)
  // on every parent re-render.
  useEffect(() => {
    if (children == null || children === false) {
      api?.unmount(key);
      return;
    }
    api?.mount(key, children);
  }, [api, key, children]);

  useEffect(() => {
    return () => api?.unmount(key);
  }, [api, key]);

  return null;
}
