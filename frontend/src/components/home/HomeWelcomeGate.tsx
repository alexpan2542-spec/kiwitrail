import { useEffect } from "react";

import { useHomeAuth } from "../../contexts/HomeAuthContext";
import {
  logHomeVisit,
  markWelcomeShownThisTab,
  shouldShowHomeWelcome,
} from "../../lib/homeVisit";
import HomeWelcomeOverlay from "./HomeWelcomeOverlay";

export type HomeWelcomeGateProps = {
  backendUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function HomeWelcomeGate({
  backendUrl,
  open,
  onOpenChange,
}: HomeWelcomeGateProps) {
  const { user } = useHomeAuth();

  useEffect(() => {
    if (!shouldShowHomeWelcome()) return;

    markWelcomeShownThisTab();
    onOpenChange(true);
    void logHomeVisit(backendUrl, { userEmail: user?.email ?? null });
  }, [backendUrl, onOpenChange, user?.email]);

  return (
    <HomeWelcomeOverlay open={open} onClose={() => onOpenChange(false)} />
  );
}
