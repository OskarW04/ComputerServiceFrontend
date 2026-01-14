import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>();

  useEffect(() => {
    const mql = window.matchMedia(
      `(max-width: ${String(MOBILE_BREAKPOINT - 1)}px)`,
    );
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-initialize-state
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => {
      mql.removeEventListener("change", onChange);
    };
  }, []);

  return Boolean(isMobile);
}
