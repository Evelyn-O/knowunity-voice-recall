"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { motion } from "motion/react";
import { MascotImage } from "@/components/mascot-image";
import { HighlightCard } from "@/components/highlight-card";
import { BottomCta } from "@/components/bottom-cta";
import { PrimaryButton, SecondaryButton, TextLinkButton } from "@/components/buttons";
import { IosPermissionDialog } from "@/components/ios-permission-dialog";
import {
  useMascotBubble,
  useRecallChromeBlur,
  useRecallStep,
  useRequestExit,
  useSetMicPermissionGranted,
} from "@/lib/recall-flow-context";
import { gentle } from "@/lib/motion";

/**
 * First-encounter entry screen (SPEC.md §2A; Figma node 13900:26392).
 * This IS the entry fork — there is no separate Speak/Type/Maybe-later
 * screen before it. Mic permission is mocked here as an overlay, never a
 * real getUserMedia call (prototype-rules.md).
 */
export default function EntryScreen() {
  const router = useRouter();
  const [permissionOpen, setPermissionOpen] = useState(false);
  const setMicPermissionGranted = useSetMicPermissionGranted();

  const goToConfidence = useCallback(
    (mode: "voice" | "type") => {
      router.push(`/confidence?mode=${mode}`);
    },
    [router]
  );

  // X and "Maybe later" both now open the shared exit-confirm sheet
  // instead of navigating directly — the sheet's own "Leave" (owned by
  // (recall)/layout.tsx) is what actually routes to /streak.
  const requestExit = useRequestExit();

  useRecallStep({
    currentStep: 1,
    totalSteps: 6,
    onExit: requestExit,
  });
  // Tells the layout to blur TopBar too, so it blurs together with this
  // screen's own content below — same combined effect as before TopBar
  // moved into the shared layout.
  useRecallChromeBlur(permissionOpen);
  // This screen has its own bespoke mascot treatment (the large idle-bob
  // hero art above), not the shared bubble block — clear it so a leftover
  // value from a previous confidence/term screen doesn't render here.
  useMascotBubble(null);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={`flex min-h-0 flex-1 flex-col transition-[filter] duration-[180ms] ease-out ${
          permissionOpen ? "blur-[10px]" : ""
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-5 pt-[42px]">
          <div className="relative flex flex-col items-center">
            <div
              aria-hidden
              className="mascot-glow absolute left-1/2 top-1/2 h-[260px] w-[260px] rounded-full bg-brand-bold/25 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute bottom-2 h-5 w-32 rounded-full bg-black/40 blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={gentle}
              className="relative"
            >
              <div className="mascot-bob">
                <div className="mascot-drift">
                  <MascotImage
                    pose="cool"
                    alt="Noe, wearing sunglasses and a cap"
                    size={200}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-4 flex w-full flex-col items-center gap-[38px] text-center">
            <div className="flex flex-col gap-2">
              <h1 className="whitespace-nowrap font-display text-[30px] font-black leading-[32px] tracking-tight text-text-primary">
                Say it back to knowie
              </h1>
              <p className="font-display text-xl leading-[1.3] text-text-secondary">
                Explaining out loud is the best way to lock in what you just
                learned.
              </p>
            </div>

            <HighlightCard eyebrow="Picture this:" variant="definition">
              You&apos;re teaching a friend who missed class, 4 terms.
            </HighlightCard>
          </div>
        </div>

        <BottomCta className="flex flex-col gap-2">
          <PrimaryButton onClick={() => setPermissionOpen(true)}>
            Let&apos;s go!
          </PrimaryButton>
          <SecondaryButton onClick={() => goToConfidence("type")}>
            Type instead
          </SecondaryButton>
          <TextLinkButton
            className="mx-auto mt-1"
            onClick={requestExit}
          >
            Maybe later
          </TextLinkButton>
        </BottomCta>
      </div>

      {/* Siblings of the blurred wrapper above, so they stay crisp on top
          of it. absolute inset-0 resolves against the layout's outer
          relative box, covering TopBar too — see (recall)/layout.tsx. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-black/25 transition-opacity duration-[180ms] ease-out ${
          permissionOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <IosPermissionDialog
        open={permissionOpen}
        onAllow={() => {
          setMicPermissionGranted(true);
          goToConfidence("voice");
        }}
        onDeny={() => {
          setMicPermissionGranted(false);
          goToConfidence("type");
        }}
      />
    </div>
  );
}
