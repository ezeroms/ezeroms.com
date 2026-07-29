"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type SearchFilterApi = {
  /** クエリ文字列（先頭 `?` 付き、条件なしなら空文字） */
  getQueryString: () => string;
  /** 条件適用先の一覧パス（trailing slash 付き） */
  getBasePath: () => string;
  /** 下書きに条件があるか */
  isActive: () => boolean;
  /** 下書きを空にする（遷移はしない） */
  clearDraft: () => void;
};

type SearchFilterContextValue = {
  api: SearchFilterApi | null;
  register: (next: SearchFilterApi | null) => void;
};

const SearchFilterContext = createContext<SearchFilterContextValue | null>(
  null,
);

export function SearchFilterProvider({ children }: { children: ReactNode }) {
  const [api, setApi] = useState<SearchFilterApi | null>(null);
  const register = useCallback((next: SearchFilterApi | null) => {
    setApi(next);
  }, []);
  const value = useMemo(() => ({ api, register }), [api, register]);
  return (
    <SearchFilterContext.Provider value={value}>
      {children}
    </SearchFilterContext.Provider>
  );
}

export function useSearchFilterHost() {
  const ctx = useContext(SearchFilterContext);
  if (!ctx) {
    throw new Error("useSearchFilterHost requires SearchFilterProvider");
  }
  return ctx;
}

/** パネル側: マウント中だけ API を登録する。 */
export function useRegisterSearchFilter(api: SearchFilterApi | null) {
  const ctx = useContext(SearchFilterContext);
  useLayoutEffect(() => {
    if (!ctx) return;
    ctx.register(api);
    return () => ctx.register(null);
  }, [ctx, api]);
}
