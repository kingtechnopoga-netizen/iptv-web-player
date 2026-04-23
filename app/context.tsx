"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { Credentials, AuthResponse, Category, Stream } from "./types";

interface AppContextType {
  credentials: Credentials | null;
  authData: AuthResponse | null;
  categories: Category[];
  streams: Stream[];
  selectedCategory: Category | null;
  loading: boolean;
  error: string | null;
  login: (creds: Credentials) => Promise<boolean>;
  logout: () => void;
  selectCategory: (cat: Category) => void;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

function buildProxyUrl(baseUrl: string, path: string): string {
  const separator = baseUrl.endsWith("/") ? "" : "/";
  const fullUrl = `${baseUrl}${separator}${path}`;
  return `/api/proxy?url=${encodeURIComponent(fullUrl)}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [authData, setAuthData] = useState<AuthResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load credentials from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("iptv_credentials");
      const savedAuth = localStorage.getItem("iptv_auth");
      if (saved) {
        setCredentials(JSON.parse(saved));
      }
      if (savedAuth) {
        setAuthData(JSON.parse(savedAuth));
      }
    } catch {
      // ignore parse errors
    }
    setInitialized(true);
  }, []);

  const login = useCallback(async (creds: Credentials): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const url = buildProxyUrl(
        creds.server,
        `player_api.php?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}`
      );

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.user_info?.auth === 0) {
        throw new Error("Invalid credentials. Please check your username and password.");
      }

      if (!data.user_info) {
        throw new Error("Invalid server response. Please check the server URL.");
      }

      setCredentials(creds);
      setAuthData(data);
      localStorage.setItem("iptv_credentials", JSON.stringify(creds));
      localStorage.setItem("iptv_auth", JSON.stringify(data));
      setLoading(false);
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Connection failed. Please check your server URL.";
      setError(message);
      setLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setCredentials(null);
    setAuthData(null);
    setCategories([]);
    setStreams([]);
    setSelectedCategory(null);
    localStorage.removeItem("iptv_credentials");
    localStorage.removeItem("iptv_auth");
  }, []);

  // Fetch categories when we have credentials
  useEffect(() => {
    if (!credentials) return;

    const fetchCategories = async () => {
      setLoading(true);
      try {
        const url = buildProxyUrl(
          credentials.server,
          `player_api.php?username=${encodeURIComponent(credentials.username)}&password=${encodeURIComponent(credentials.password)}&action=get_live_categories`
        );

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch categories");

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length > 0 && !selectedCategory) {
            setSelectedCategory(data[0]);
          }
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load categories";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentials]);

  // Fetch streams when category changes
  useEffect(() => {
    if (!credentials || !selectedCategory) return;

    const fetchStreams = async () => {
      setLoading(true);
      setStreams([]);
      try {
        const url = buildProxyUrl(
          credentials.server,
          `player_api.php?username=${encodeURIComponent(credentials.username)}&password=${encodeURIComponent(credentials.password)}&action=get_live_streams&category_id=${selectedCategory.category_id}`
        );

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch streams");

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        if (Array.isArray(data)) {
          setStreams(data);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load streams";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
  }, [credentials, selectedCategory]);

  const selectCategory = useCallback((cat: Category) => {
    setSelectedCategory(cat);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  if (!initialized) {
    return null;
  }

  return (
    <AppContext.Provider
      value={{
        credentials,
        authData,
        categories,
        streams,
        selectedCategory,
        loading,
        error,
        login,
        logout,
        selectCategory,
        clearError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
