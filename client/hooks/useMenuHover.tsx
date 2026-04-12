import { useRef, useState, useCallback } from "react";

export function useMenuHover(delay = 150) {
   const [open, setOpen] = useState(false);
   const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

   const onMouseEnter = useCallback(() => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setOpen(true);
   }, []);

   const onMouseLeave = useCallback(() => {
      closeTimer.current = setTimeout(() => setOpen(false), delay);
   }, [delay]);

   return { open, onMouseEnter, onMouseLeave };
}
