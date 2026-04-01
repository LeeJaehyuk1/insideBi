
import * as React from "react";

interface AiPanelContextValue {
  openWithQuestion: (question: string) => void;
  open: () => void;
}

const AiPanelContext = React.createContext<AiPanelContextValue>({
  openWithQuestion: () => {},
  open: () => {},
});

export function useAiPanel() {
  return React.useContext(AiPanelContext);
}

export const AiPanelProvider = AiPanelContext.Provider;
