# Knowunity Brand File — Extracted Design Tokens & Patterns

Source: Figma file `Yummy__Knowie---Evelyn` (key `czYYTmUKwJFFmqiQ669i4t`), read live via the Figma desktop MCP connection.
Pulled from: the **"Full Flow ✅ ready for claude"** page (Module 4, node `13499:3646`) for screens, and the **FOUNDATIONS → 🎨 Mascot & components** page (node `3:5`) for the component/token library. All values below are pulled directly from Figma variables and rendered node styles — nothing here is invented. Anywhere a value looked incomplete or inconsistent, it's called out explicitly in a **Gap** note rather than filled in.

Everything documented is **dark mode** — there is no light-mode variant in this file; `background/page` (#090c18) is the only canvas color used across every screen sampled.

> **Note on scaling artifact:** the screens live inside a section called "SHORTLIST - SCREEN DIRECTION" that is scaled up ~3.66% from the underlying token grid (e.g. a `space/600` token of `24` renders as `24.879px` in that frame). All px values below are the **canonical, unscaled token values** (i.e. divided back out by ×1.0366) unless marked "as-rendered."

---

## 1. Color tokens

### Backgrounds & surfaces
| Token | Hex | Used for |
|---|---|---|
| `background/page` | `#090c18` | App canvas / root background on every screen |
| `background/surface` | `#22242f` | Cards, mascot speech-bubble fill, secondary button fill, progress-bar track, summary list rows |
| `background/inverse` | `#f4f2ff` | Light-on-dark inversions (status-bar battery fill, etc.) |
| `background/stacking` | `#ffffff1a` (white, 10% alpha) | Bottom-sheet drag handle |
| `background/scrim` | `#0a0a0a80` (black, 50% alpha) | Backdrop behind modal/priming dialogs |

### Text
| Token | Hex | Used for |
|---|---|---|
| `text/primary` | `#f4f2ff` | Primary body/label copy |
| `text/secondary` | `#f5f3ffad` (white, ~68% alpha) | Subtitles, mic helper copy, de-emphasized captions |
| `text/disabled` | `#ffffff66` (white, 40% alpha) | Disabled button labels (e.g. "Continue" before confidence is picked) |

### Borders / dividers
| Token | Hex | Used for |
|---|---|---|
| `border/subtle` | `#ffffff1a` | Hairline dividers |
| `border/default` | `#ffffff1a` | Bottom-sheet top hairline |

**Gap:** `border/subtle` and `border/default` resolve to the identical value. Either they're meant to diverge and haven't yet, or one is redundant — worth confirming before treating them as two real tokens in code.

### Brand accent (primary purple)
| Token | Hex | Used for |
|---|---|---|
| `accent/brand/bold` | `#9178e6` | Progress bar fill, idle mic button, primary brand purple |
| `accent/brand/subtle` | `#15103a` | Bordered "highlight card" fill (definition card, transcript-echo card) |
| `accent/brand/onSubtle` | `#7b65e0` | Text/icon on the subtle bg above (card eyebrow labels) |
| `accent/brand/onBold` | `#0e0a18` | Text on bold brand purple |

### Multi-hue accent system (bold / subtle / onBold / onSubtle per hue)
Each hue follows the same 4-slot pattern: `bold` = solid fill, `onBold` = text/icon on that fill, `subtle` = low-contrast tint fill, `onSubtle` = text/icon on that tint.

| Hue | bold | onBold | subtle | onSubtle | Observed use |
|---|---|---|---|---|---|
| blue | `#5fa0fc` | `#06173b` | `#0a1635` | `#7ba8f2` | Term-counter chip in the top app bar |
| green | `#00c386` | `#0a1f18` | — | — | "Exactly right" celebration sheet, "On your own" result chip |
| coral | `#fb7e5b` | `#2e0f06` | `#512e2c` | `#ffb59b` | "Revealed" result chip; wrong-answer sheet ("You are closer!") |
| magenta | `#e879c0` | `#2c0a20` | `#380d29` | — | Active mic-recording state (button fill + voice waveform bars) |
| `pro/*` (gold) | `#f5b53d` | `#2a1d04` | `#3a2d0b` | — | "With a hint" result chip |

**Confirms CLAUDE.md's existing note:** there is no dedicated `amber/warning` accent family with the bold/subtle/onBold/onSubtle set — `pro/bold` (gold) is being borrowed for the "hint" result chip, and coral is being borrowed elsewhere for warning-adjacent states. This matches what the project file already flags as unresolved.

### Feedback (system messaging, distinct from the "green" accent above)
| Token | Hex | Used for |
|---|---|---|
| `feedback/success/subtle` | `#0a2e22` | "Nice! / Exactly right" celebration bottom-sheet background |
| `feedback/success/onSubtle` | `#4ae5b0` | Text/icon on that sheet |
| `feedback/warning` | `#ffd13e` | Defined in the library — **not observed on any sampled screen.** |

**Gap:** `feedback/warning` exists as a token but didn't appear on any of the 9 screens inspected (idle, recording, confidence tap, result-nailed, incorrect, summary, streak reveal, OS-permission primer). Can't confirm its actual usage context from the file alone.

### Interactive (buttons)
| Token | Hex | Used for |
|---|---|---|
| `interactive/primary` | `#f4f2ff` | Primary CTA fill ("Continue", "Let's go!") |
| `interactive/onPrimary` | `#090c18` | Text on primary CTA |
| `interactive/secondary` | `#ffffff1a` (white, 10% alpha) | Secondary CTA fill ("Why?", "Try again", "Type instead") — reads as a soft dark-slate pill against the page background |
| `interactive/onSecondary` | `#f4f2ff` | Text on secondary CTA |
| `interactive/disabled` | `#ffffff1a` | Disabled button fill (same value as secondary — see gap below) |
| `interactive/destructive` | `#ff6b6b` | Defined in the library — **not observed on any sampled screen** (no destructive action exists in this flow, which tracks: skip/exit are neutral, never punitive, per the "never blocking / no stark red incorrect" rule) |

**Gap:** `interactive/secondary` and `interactive/disabled` share the identical value (`#ffffff1a`). Disabled buttons may be visually indistinguishable from active secondary buttons unless disambiguated by opacity or the label color (`text/disabled` at 40% alpha) doing the work instead.

### Mascot-specific
| Token | Hex | Used for |
|---|---|---|
| `mascot/primary` | `#9178e6` | Mascot body fill (same purple as `accent/brand/bold`) |
| `mascot/eyes` | `#ffffff` | Mascot eye whites |
| `Homie/Inkwell` | `#9178e6` | Legacy-named duplicate of `mascot/primary` |
| `Homie/Eyes` | `#0a0a0a` | Mascot pupil color |

**Gap — naming, not color:** several mascot variables are still named `Homie/*` internally (pre-reskin branding), even though CLAUDE.md's committed reskin target is the "Noe" mascot. The *hex values* are fine to use as-is; the *token names* haven't been migrated. Don't let this leak into new code as `Homie`-named variables.

### System / OS-chrome tokens (not app design-system tokens)
These live in the same Figma variable collection but back the iOS status bar and the native permission-dialog mockup, not the app's own UI:

| Token | Hex | Used for |
|---|---|---|
| `Action` | `#1C98F3` | iOS system blue — "Allow" / "Don't Allow" text in the mic-permission OS dialog mockup |
| `Labels - Vibrant/Primary` | `#f5f5f5` | iOS vibrancy material label color |
| `Fills - Vibrant/Primary` | `#333333` | iOS vibrancy material fill |
| `Miscellaneous/Keyboards/Glyphs - Primary` | `#a6a6a6` | iOS keyboard glyph mockup |
| `Miscellaneous/Keyboards/Emoji + Mic` | `#ffffffba` | iOS keyboard mockup |
| `Accents/Blue` | `#0091ff` | iOS system accent (keyboard mockup context) |
| `Purple/950` | `#3c0366` | Unclear — not seen rendered on any sampled screen; likely a leftover primitive |

Don't pull these into the app's token set — they exist to make the native-OS mockups (status bar, permission dialog, keyboard) look authentic, and are styled with San Francisco (SF Pro), not the app's Inter/Bricolage system.

---

## 2. Type scale

Two typefaces are in active use for actual app UI:

- **Inter** (Regular, Medium) — body copy, mascot dialogue, transcript/answer text, list item titles and captions.
- **Bricolage Grotesque** (Regular, Medium, SemiBold, Bold/Black) — headlines, buttons, chips, status labels, mic status text.

A third, **SF Pro / SF Pro Text**, appears only inside the iOS status-bar and native-permission-dialog mockups — that's simulated system chrome, not part of this app's type scale, and shouldn't be treated as a real token.

| Size (px) | Family / weight | Line height | Tracking | Where it's used |
|---|---|---|---|---|
| 9 | Inter Regular | 12 (1.33×) | +1% | Summary list item caption (e.g. "Strong start!") — **very small; flag for accessibility review** |
| 12.4 | Bricolage Regular | 16.6 (1.34×) | — | "Maybe later" text-link (underlined) |
| 12.4 | Avenir Medium | 16.6 (1.33×) | — | Mic idle helper text ("Try to go to quiet place…") — **off-system font, see Gap below** |
| 15 | Inter Medium | 16.6 (1.1×) | +1% | Summary list item title (e.g. "Note", "Signature") |
| 15 | Bricolage Medium | 20.7 (1.33×) | +1% | Summary result chips ("On your own", "With a hint", "Revealed", "Skipped") |
| 16 | Inter Medium | 24 (1.5×) *or* 1.5 line-height keyword | +1% (some instances) / −1.1% (others) | Mascot dialogue bubble, transcript/answer bubble text — **tracking is inconsistent between instances, see Gap below** |
| 18 | Bricolage Medium | 24 (1.33×) | +1% | MCQ / confidence-tap option button labels, mic status text ("Tap to answer", "Recording"), app-bar streak-chip number |
| 18 | Bricolage SemiBold | 20.7 (1.15×) | +1% | Bottom-sheet secondary/primary button labels ("Why?", "Continue") on the result sheet |
| 20 | Bricolage Regular | 26 (1.3×) | — | OS-permission primer subtext |
| 21–22 | Bricolage Bold/Black | 24 (1.1–1.2×) | — | Primary CTA button labels ("Check", "Continue", "I can't speak right now", "Try again") — **rendered at two slightly different sizes (21.8px and 22.6px) for what should be the same button tier, see Gap below** |
| 23 | Bricolage Medium | 26.5 (1.14×) | — | Recording timer ("0:01") |
| 24 | Bricolage Bold | 32 (1.33×) | — | Summary headline ("You knew you had this") |
| 28 | Bricolage Bold/Black | 28 (1.0×, tight) | −1% | Celebration sheet heading ("Nice!", "Exactly right") |
| 40 | Bricolage Black | 32 (0.8×, very tight display) | — | OS-permission primer headline ("Say it back to knowie") |

**Gaps:**
- **Off-system font:** the mic-idle helper copy ("Try to go to quiet place for better results") is set in **Avenir Medium**, not Inter or Bricolage Grotesque. Everywhere else in the flow sticks to the two-typeface system; this looks like a one-off that should be normalized to Inter Regular/Medium at the same 12–13px caption size.
- **Tracking inconsistency at 16px Inter Medium:** the mascot-question bubble uses `line-height: 1.5` with −1.1% tracking, while the answer/transcript bubble uses a fixed 24px line-height with +1% tracking. Same nominal style, two different specs — worth reconciling into one "body/bubble" text style.
- **CTA size drift:** most large primary buttons render their label at ~21.8px, but the OS-permission primer's "Let's go!" / "Type instead" render at ~22.6px. Likely unintentional drift rather than a deliberate second size — flagging rather than picking one.
- **9px caption** is small enough to be worth a deliberate accessibility check before shipping as-is.
- No dedicated **small/caption size below 9px** or **display size above 40px** was observed, and no explicit named Figma text styles were retrievable through the API (the file defines type via ad hoc text properties on each layer rather than shared Text Styles) — so this table is reconstructed from rendered instances, not a canonical style list. If a text-styles panel exists in the file that wasn't surfaced here, it should supersede this table.

---

## 3. Spacing & radius tokens (px)

### Spacing (from the `space/*` variable family)
| Token | Value |
|---|---|
| `space/0` | 0 |
| `space/050` | 2 |
| `space/200` | 8 |
| `space/300` | 12 |
| `space/600` | 24 |
| `space/700` | 28 |

**Gap:** the sequence skips what would be `space/100` (~4) and `space/400`/`space/500` (~16/~20). Those steps almost certainly exist in the file's spacing collection but weren't captured here because no inspected screen happened to reference them directly — the variable-read tool only returns variables actually bound to the node you query, not the full library. Treat this as a partial read, not proof those steps don't exist.

Observed spacing rhythm on screens: **12px** between stacked option buttons (confidence tap) and between summary list rows; **8px** as the small internal gap inside chips/icon rows; **24–28px** as the standard screen-edge padding (`bottomCta` and `middleContent` both pad with `space/600`–`space/700`).

### Radius
| Token | Value | Used for |
|---|---|---|
| `radius/full` (`--sds-size-radius-full`) | effectively infinite (pill) | All buttons, chips, the mic button, progress-bar end-caps |
| `radius/400` | 16 | Mascot speech bubble, confidence-tap/MCQ-adjacent smaller cards |

**Gap:** two other corner radii are used repeatedly but have **no matching named variable** in what the API returned:
- **~24px** — MCQ option buttons, the bordered "definition/transcript" highlight card, and the outer screen-frame corner.
- **~32–36px** — summary list-row pills, and the bottom-sheet's top-left/top-right corners.
- The progress-bar track also uses a hardcoded `12px` radius rather than a token reference.

These are either unnamed/undocumented steps in the radius scale, or hardcoded one-offs — worth checking directly in Figma's local variables panel before assuming a `radius/600`-style token is meant to exist.

### Icon / illustration sizing
Only partial capture here, same caveat as spacing:
- `icon/large` = 24px (the only icon-size variable bound to inspected nodes)
- Mascot illustration slot sizes, from the component-library documentation frame: **XL = 64, 2XL = 120, 3XL = 200, 4XL = 320** (px, square). `Illustration/1500` (=120) and `Illustration/2500` (=200) are the two named variables that surfaced; XL/4XL likely have sibling variable names (e.g. `Illustration/1000`, `Illustration/3500`) that weren't captured.

---

## 4. Composition patterns

### Persistent chrome (every screen)
Every screen in the flow shares the same three-layer scaffold:
1. **Status bar** (49.7px) — device chrome only (SF Pro clock, wifi/cell/battery icons).
2. **App bar** (58px) — a circular back button, a full-width **pill progress bar** (`background/surface` track, `accent/brand/bold` fill) representing position in the term queue, and a **streak/lightning chip** (icon + number) at the trailing edge.
3. **`bottomCta`** — a docked, full-width button row pinned to the bottom safe area on *every* screen, always built from the same `buttonGroup` pattern: a small circular icon-only button (usually "skip forward") + one or two pill buttons filling the remaining width.

This is the mechanism that satisfies the "text fallback reachable in one tap, never hard-gated" rule structurally — the fallback/skip affordance lives in the same docked slot on every screen rather than being screen-specific.

### Mascot + speech-bubble card
The recurring "Noe is talking" unit is a fixed two-part row: a circular mascot avatar (with a small drop-shadow ellipse beneath it) on the left, and a rounded `background/surface` speech bubble to its right with a triangular tail pointing back at the mascot. Mascot **expression changes per moment**, not just per screen — same layout, different character art:
- `standby` — pre-step / neutral prompts
- `excited` — confidence tap
- `Listening` (with a headphones overlay + closed eyes) — while recording
- `Cool` (sunglasses + hat) — summary and the permission-priming screen
- A much larger expression library exists in the component page for states not seen in this flow's sampled screens: `confused`, `laughing`, `approving`, `overIt`, `angry`, `amazed`, `dazed`, `giggling`, `questioning`, `thinking`, `sad`, `determined`, `Happy`, `Reading`, and a "Don't leave" variant (presumably for exit-intent).

When the student answers, a **second** bubble of the same shape appears below the (now dimmed, 50%-opacity) question bubble, using the mascot's own avatar frame again but showing the transcribed answer/feedback — i.e. the "conversation" reads as a vertical thread of alternating bubbles, not a single card that mutates.

### Bordered "highlight card"
A second, distinct card type — solid `accent/brand/subtle` fill with a thicker `accent/brand/onSubtle` border and a small eyebrow label — is reused in two different moments: the **term definition preview** on the mic-permission primer ("Picture this: …") and the **transcript echo** on a wrong-answer screen ("What I heard. …"). Same component, two jobs: preview what's coming, and let the student verify what the mic captured. Worth keeping as one shared component rather than two lookalikes.

### Options / input area
Directly below the mascot bubble, the content area is single-purpose per screen and swaps in place:
- **MCQ / confidence tap:** vertically stacked full-width pill buttons (`background/surface` fill, 12px gap between them).
- **Term prompt (idle):** one large circular mic button (`accent/brand/bold`) centered, with a two-line status stack underneath (short status + small helper caption).
- **Recording:** the same mic button recolors to `accent/magenta/bold` and swaps its icon to pause; a delete/cancel icon button and a 7-bar voice waveform (also magenta) appear beside it, with a running timer.

### Result / feedback bottom sheet
Every result (correct, wrong, hint) resolves into a **bottom sheet that slides up over the mic UI** rather than a full screen transition — a drag handle, a colored heading + like/dislike reaction icons, then a two-button row. The sheet's background color encodes the outcome (`feedback/success/subtle` dark-green for a win, a coral-tinted dark surface for "closer, not quite"), but **never a saturated red** — consistent with the "no stark red incorrect state" rule. The wrong-answer sheet also adds a "Hint me!" secondary action alongside "Try again."

### Summary list
The summary screen's per-term breakdown is a vertical stack of **pill-shaped list rows** (`interactive/secondary` fill, which reads as a soft dark slate against the page background): a small status icon on the left (check / wavy "partial" / error triangle), a two-line title+caption in the middle, and a colored pill chip on the right whose fill communicates the outcome (green = on your own, gold = with a hint, coral = revealed, gray/disabled = skipped). This is the same "chip communicates state via hue" language used for the streak-day tracker and the result sheets — one consistent color-coded vocabulary for outcome state across the whole flow.

### Full-bleed celebration takeover
The streak-reveal screen is the one exception to the standard dark `background/page` chrome: it goes full-bleed **solid coral**, with an oversized flame icon, a big "03 / Day Streak" numeral, and a Mon–Fri day tracker (filled circles for completed days). It ends with a **"Share"** button next to "Continue."

**Flag, not just a description:** CLAUDE.md is explicit that any social/community element must stay a single *passive, anonymous* signal and is unshipped without Harry's sign-off. A "Share" CTA is an active, user-initiated social action, not a passive signal — this screen as currently designed reads as a stronger social feature than the brief's constraint allows. Surfacing this rather than quietly softening or dropping it.

### Spacing rhythm, summarized
Screen-edge padding is consistently `space/600`–`space/700` (24–28px). Related elements inside a group (stacked buttons, list rows, chip internals) sit at `space/300` (12px) or tighter at `space/200` (8px). There's no visible use of a larger "section" gap beyond ~28px anywhere sampled — density stays fairly tight throughout, which tracks with a single-card-in-view mobile layout rather than a scrolling page.
