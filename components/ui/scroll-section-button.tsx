"use client";

import type { MouseEvent, ReactNode } from "react";
import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { scrollToSection } from "@/utils/tools";

type ScrollSectionButtonProps = {
  children: ReactNode;
  className?: string;
  offsetY?: number;
  pagePath?: string;
  sectionId: string;
};

export default function ScrollSectionButton({
  children,
  className,
  offsetY,
  pagePath,
  sectionId,
}: ScrollSectionButtonProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();

      const targetPath = pagePath ?? pathname;

      if (pathname === targetPath) {
        scrollToSection(sectionId, offsetY);
        return;
      }

      router.push(targetPath);

      const waitForElement = () => {
        if (document.getElementById(sectionId)) {
          scrollToSection(sectionId, offsetY);
          return;
        }

        requestAnimationFrame(waitForElement);
      };

      setTimeout(waitForElement, 100);
    },
    [offsetY, pagePath, pathname, router, sectionId],
  );

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
