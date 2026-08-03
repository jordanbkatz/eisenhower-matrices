import { useState, useEffect } from "react";

export function useMatrixNavigation() {
  const [activeMatrixId, setActiveMatrixId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matrixPath, setMatrixPath] = useState<string[]>([]);

  useEffect(() => {
    const handleLocation = () => {
      const match = window.location.pathname.match(/\/matrix\/([^/]+)/);
      if (match && match[1]) {
        setActiveMatrixId(match[1]);
      } else {
        setActiveMatrixId(null);
      }
    };

    handleLocation();
    window.addEventListener("popstate", handleLocation);
    return () => window.removeEventListener("popstate", handleLocation);
  }, []);

  const selectMatrixAndNavigate = (id: string | null) => {
    setActiveMatrixId(id);
    setMatrixPath([]);
    setSelectedId(null);
    if (id) {
      window.history.pushState({}, "", `/matrix/${id}`);
    } else {
      window.history.pushState({}, "", "/");
    }
  };

  const navigateMatrixPath = (path: string[]) => {
    setMatrixPath(path);
    const leaf = path[path.length - 1];
    setSelectedId(leaf ?? null);
  };

  return {
    activeMatrixId,
    setActiveMatrixId,
    selectedId,
    setSelectedId,
    matrixPath,
    setMatrixPath,
    selectMatrixAndNavigate,
    navigateMatrixPath,
  };
}
