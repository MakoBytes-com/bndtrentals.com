"use client";

// Loads the MakoChat chat widget (tenant "bndt") on public pages only.
// The embed.js loader injects a floating bubble + an iframe to
// makochat.app/widget/bndt. We skip /admin so staff don't get the public
// chat bubble, and clean up the injected elements if the user navigates into
// the admin within the same session.

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const TENANT = "bndt";
const EMBED_SRC = "https://makochat.app/embed.js";

function removeWidget() {
  document.getElementById("makochat-embed")?.remove();
  document
    .querySelectorAll(
      'button[aria-label="Open chat"], button[aria-label="Close chat"], iframe[src*="makochat.app/widget"]',
    )
    .forEach((el) => el.remove());
}

export function MakoChatWidget() {
  const pathname = usePathname();
  const onAdmin = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (onAdmin) {
      removeWidget();
      return;
    }
    if (document.getElementById("makochat-embed")) return;
    const s = document.createElement("script");
    s.id = "makochat-embed";
    s.src = EMBED_SRC;
    s.defer = true;
    s.setAttribute("data-makochat", TENANT);
    document.body.appendChild(s);
  }, [onAdmin]);

  return null;
}
