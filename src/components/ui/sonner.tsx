import { useEffect, useRef, useState } from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const resolveDocumentTheme = (): ToasterProps["theme"] => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "system";
  }

  const root = document.documentElement;
  if (root.classList.contains("dark")) {
    return "dark";
  }

  if (root.classList.contains("light")) {
    return "light";
  }

  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
};

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = useState<ToasterProps["theme"]>(() => resolveDocumentTheme());
  const themeRef = useRef(theme);
  const scheduleRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const updateTheme = () => {
      const nextTheme = resolveDocumentTheme();
      if (themeRef.current !== nextTheme) {
        themeRef.current = nextTheme;
        setTheme(nextTheme);
      }
    };

    const scheduleUpdate = () => {
      if (scheduleRef.current !== null) {
        return;
      }
      if (typeof window.requestAnimationFrame === "function") {
        scheduleRef.current = window.requestAnimationFrame(() => {
          scheduleRef.current = null;
          updateTheme();
        });
        return;
      }

      scheduleRef.current = window.setTimeout(() => {
        scheduleRef.current = null;
        updateTheme();
      }, 0);
    };

    scheduleUpdate();

    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    const mediaListener = () => scheduleUpdate();
    mediaQuery?.addEventListener?.("change", mediaListener);

    const observer = typeof MutationObserver !== "undefined"
      ? new MutationObserver(() => scheduleUpdate())
      : null;

    observer?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      if (scheduleRef.current !== null) {
        if (typeof window.cancelAnimationFrame === "function") {
          window.cancelAnimationFrame(scheduleRef.current);
        } else {
          window.clearTimeout(scheduleRef.current);
        }
        scheduleRef.current = null;
      }
      mediaQuery?.removeEventListener?.("change", mediaListener);
      observer?.disconnect();
    };
  }, []);

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
