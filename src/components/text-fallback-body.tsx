"use client";

import { HighlightCard } from "@/components/highlight-card";
import { TextInput } from "@/components/text-input";
import { SendingIndicator, CheckingIndicator } from "@/components/mic-status-indicator";

/**
 * The text-mode body for a term's "entering answer" / Sending / Checking
 * moments (Figma 13900:25098, 13900:25130, 13900:25170) — shared by every
 * term rather than rebuilt per term. Once sent, the typed answer is
 * echoed via the same HighlightCard pattern term-3's voice "What I heard."
 * card already uses, just with "What you wrote." and the real typed text
 * instead of a scripted transcript line — it persists through Sending and
 * Checking exactly like the Figma frames show, then stays visible into
 * whatever Result/hint/reveal screen the caller renders next (each term
 * renders that part itself, since result branching differs per term).
 */
export function TextFallbackBody({
  stage,
  value,
  onChange,
  onSend,
  onCancelSending,
}: {
  stage: "idle" | "sending" | "checking";
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onCancelSending: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col px-4 pt-5">
      {stage === "idle" ? (
        <TextInput value={value} onChange={onChange} onSend={onSend} autoFocus />
      ) : (
        <>
          <HighlightCard eyebrow="What you wrote.">{value}</HighlightCard>
          <div className="mt-10 flex flex-1 flex-col items-center">
            {stage === "sending" ? (
              <SendingIndicator onCancel={onCancelSending} />
            ) : (
              <CheckingIndicator />
            )}
          </div>
        </>
      )}
    </div>
  );
}
