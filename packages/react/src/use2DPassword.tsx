import { useEffect, useState, useCallback } from "react";
import { Password2DEngine, Password2DOptions } from "@password2d/core";
import { Password2DGrid } from "./Password2DGrid";

/**
 * Hook that wraps the Password2DEngine and returns:
 *   [flattened password, React component]
 */
export function use2DPassword(options: Password2DOptions = {}) {
  const [engine] = useState(() => new Password2DEngine(options));
  const [grid, setGrid] = useState<string[][]>(engine.getMaskedGrid());
  const [masked, setMasked] = useState(engine.masked);
  const [password, setPassword] = useState(engine.getFlattened());

  const updateGrid = useCallback(() => {
    setGrid(engine.getMaskedGrid());
    setMasked(engine.masked);
    setPassword(engine.getFlattened());
  }, [engine]);

  const handleChange = useCallback(() => updateGrid(), [updateGrid]);

  const GridComponent = useCallback(() => (
    <Password2DGrid engine={engine} grid={grid} masked={masked} onChange={handleChange} />
  ), [engine, grid, masked, handleChange]);

  // Keep password up to date if mask toggled externally
  useEffect(() => {
    updateGrid();
  }, [updateGrid]);

  return [password, GridComponent] as const;
}
