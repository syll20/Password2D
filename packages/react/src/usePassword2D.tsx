import React, { useState, useMemo, useCallback } from "react";
import { Password2DEngine, Password2DOptions } from "@password2d/core";
import { Password2DGrid } from "./Password2DGrid";

/** Stable use2DPassword hook */
export function usePassword2D(options: Password2DOptions = {}) {
  const [engine] = useState(() => new Password2DEngine(options));
  const [masked, setMasked] = useState(engine.masked);
  const [version, setVersion] = useState(0);

  const handleChange = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  const GridComponent = useMemo(
    () =>
      function Grid() {
        return (
          <Password2DGrid
            engine={engine}
            masked={masked}
            onChange={() => {
              handleChange();
              setMasked(engine.masked);
            }}
          />
        );
      },
    [engine, masked, handleChange]
  );

  return [engine.getFlattened(), GridComponent, engine] as const;
}
