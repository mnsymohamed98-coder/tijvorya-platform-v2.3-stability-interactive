import { useEffect, useState } from "react";

export function useDelayedLoading(loading: boolean, delay = 400) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!loading) {
      setShow(false);
      return;
    }
    const timer = window.setTimeout(() => setShow(true), delay);
    return () => window.clearTimeout(timer);
  }, [loading, delay]);
  return show;
}
