import React, { type ReactNode, useEffect } from 'react';

import type { CSSProperties } from 'glamor';
import hotkeys from 'hotkeys-js';

export type SheetProps = {
  children: ReactNode;
  contentStyle?: CSSProperties;
};

const Sheet = ({ contentStyle, children }: SheetProps) => {
  useEffect(() => {
    // This deactivates any key handlers in the "app" scope. Ideally
    // each modal would have a name so they could each have their own
    // key handlers, but we'll do that later
    let prevScope = hotkeys.getScope();
    hotkeys.setScope('modal');
    return () => hotkeys.setScope(prevScope);
  }, []);

  return (
    <div
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'visible',
        border: 0,
        fontSize: 14,
        backgroundColor: 'transparent',
        padding: 0,
        pointerEvents: 'auto',
        ...contentStyle,
      }}
    >
      {children}
    </div>
  );
};

export default Sheet;
