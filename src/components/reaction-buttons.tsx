"use client";

import { useState } from "react";
import { ThumbsDownIcon, ThumbsUpIcon } from "@/components/icons";

type Reaction = "like" | "dislike" | null;

/**
 * Thumbs up/down reaction toggle shared by every result-type bottom sheet
 * (Figma node 14036:11759/14036:14586 show the outline-vs-filled
 * treatment). Mutually exclusive — selecting one clears the other — and
 * tapping an already-selected icon deselects it back to outline. Renders
 * just the two `<button>`s (no wrapper), so it drops straight into each
 * sheet's existing app-bar row without touching that row's own layout/gap.
 * Each call site gets its own independent instance/state — a reaction on
 * one term's result sheet has no bearing on any other sheet.
 */
export function ReactionButtons() {
  const [reaction, setReaction] = useState<Reaction>(null);

  function toggle(value: "like" | "dislike") {
    setReaction((prev) => (prev === value ? null : value));
  }

  return (
    <>
      <button
        type="button"
        aria-label="Dislike this reply"
        aria-pressed={reaction === "dislike"}
        onClick={() => toggle("dislike")}
      >
        <ThumbsDownIcon
          filled={reaction === "dislike"}
          className="h-6 w-6 text-text-primary"
        />
      </button>
      <button
        type="button"
        aria-label="Like this reply"
        aria-pressed={reaction === "like"}
        onClick={() => toggle("like")}
      >
        <ThumbsUpIcon
          filled={reaction === "like"}
          className="h-6 w-6 text-text-primary"
        />
      </button>
    </>
  );
}
