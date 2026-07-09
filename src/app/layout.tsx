import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voice Recall — Knowunity",
  description: "Voice active-recall prototype for Knowunity's Exam Plan.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#090c18",
};

/**
 * Fake status bar — desktop phone-mockup decoration only (see the
 * `min-[500px]:` frame below). Purely cosmetic glyphs, not a real OS
 * status bar: real devices render their own, and the actual app content
 * never draws one of its own (TopBar starts directly below this).
 */
function DesktopFakeStatusBar() {
  return (
    <div className="hidden shrink-0 items-center justify-between px-6 pb-1 pt-3 text-text-primary min-[500px]:flex">
      <span className="font-sans text-[15px] font-semibold">9:41</span>
      <div className="flex items-center gap-1.5">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden>
          <rect x="0" y="8" width="3" height="4" rx="0.5" />
          <rect x="5" y="5" width="3" height="7" rx="0.5" />
          <rect x="10" y="2" width="3" height="10" rx="0.5" />
          <rect x="15" y="0" width="3" height="12" rx="0.5" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden>
          <path
            d="M8 10.5a1 1 0 100-2 1 1 0 000 2zM5 7.5a4.2 4.2 0 016 0M2.5 5a7.8 7.8 0 0111 0"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden>
          <rect x="0.5" y="0.5" width="21" height="11" rx="2.5" stroke="currentColor" />
          <rect x="2" y="2" width="18" height="8" rx="1.5" fill="currentColor" />
          <rect x="22.5" y="4" width="1.5" height="4" rx="0.75" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${bricolage.variable} antialiased`}>
      {/* `h-dvh` (not `h-full` + `min-h-dvh`) — the previous pairing let a
          static, non-viewport-aware `height: 100%` win over the dynamic
          viewport height, which could size body taller than the actually
          visible area once mobile browser chrome is accounted for, pushing
          bottom content (e.g. BottomCta buttons) below the fold. `h-dvh`
          alone always matches the real visible viewport, no matter the
          device.
          `min-[500px]:` below is the desktop-only phone-mockup frame — a
          decorative gradient backdrop + fixed-size frame + fake status bar,
          gated well above any real phone's CSS width so it never renders on
          an actual device. The real app content inside never assumes this
          frame exists: it's sized by flex-1/dvh regardless of whether the
          frame is present. */}
      <body className="desktop-frame-backdrop flex h-dvh flex-col bg-background-page font-sans text-text-primary min-[500px]:items-center min-[500px]:justify-center">
        <div className="relative mx-auto flex w-full min-h-0 max-w-[404.28px] flex-1 flex-col bg-background-page min-[500px]:h-[874.9px] min-[500px]:flex-none min-[500px]:overflow-hidden min-[500px]:rounded-[40px] min-[500px]:border min-[500px]:border-white/10 min-[500px]:shadow-2xl">
          <DesktopFakeStatusBar />
          {children}
        </div>
      </body>
    </html>
  );
}
