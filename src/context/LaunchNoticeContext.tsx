import React, { useContext, useMemo, useState } from 'react';

type LaunchNoticeValue = {
  notice: string | null;
  setNotice: (notice: string | null) => void;
};

const LaunchNoticeContext = React.createContext<LaunchNoticeValue | null>(
  null,
);

export function LaunchNoticeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  const value = useMemo(() => ({ notice, setNotice }), [notice]);
  return (
    <LaunchNoticeContext.Provider value={value}>
      {children}
    </LaunchNoticeContext.Provider>
  );
}

export function useLaunchNotice(): LaunchNoticeValue {
  const value = useContext(LaunchNoticeContext);
  if (value == null) {
    throw new Error(
      'useLaunchNotice must be used within LaunchNoticeProvider',
    );
  }
  return value;
}
