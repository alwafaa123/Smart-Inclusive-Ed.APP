"use client";

import { AccessibilityProvider } from "@/components/AccessibilityProvider";

export default function StudentLayout({ children }) {
  return <AccessibilityProvider>{children}</AccessibilityProvider>;
}
