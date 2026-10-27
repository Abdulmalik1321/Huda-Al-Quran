# Right-to-left justified Quran text

## Resolution (2026-10-06)

**Solved by option C below.** The old continuous-text reader (`app/quran.tsx`) was replaced by a page-by-page Mushaf. Each line is a row of separate word views (`flexDirection: "row-reverse"`, `justifyContent: "space-between"`), and the line breaks come from the KFGQPC Mushaf layout. Justification no longer depends on `textAlign: "justify"`, `writingDirection` or `I18nManager`, and the native layout direction is kept LTR. Checked on the web build. Still to be checked on Android and iOS devices (see the checklist at the end). See `ARCHITECTURE.md` for the implementation.

The analysis below is kept because it explains why `textAlign: "justify"` must not be used for Arabic text in this app (for example in future translation or tafsir views).

---

The original problem: the reader (`app/quran.tsx`) displayed each surah as continuous Arabic text that should be **justified** (flush on both edges) and flow **right to left**, like a printed Mushaf. In practice the text did not consistently align right to left when `text-justify` was applied.

The analysis comes from reading `app/quran.tsx` and the React Native 0.74 source in `node_modules/react-native`.

## How the old reader rendered text

```tsx
<Text  // outer paragraph
  style={{ lineHeight: 48, justifyContent: "center", display: "flex" }}
  className="text-justify px-3 text-2xl mt-5 text-white font-[othmani-1] items-end">
  {verses.map((item, index) =>
    index < verse - 1 ? <></> : (
      <Text className={isLast ? "text-right text-red-400" : "text-justify"} ...>
        {item.ar}{" "}<Text style={{ fontSize: 30 }}>{arabicNumber}</Text>{" "}
      </Text>
    ))}
</Text>
```

The whole surah is one paragraph made of nested `Text` spans.

## Root causes found

1. **Android: `justify` is hard-wired to left alignment.**
   In `ReactAndroid/.../text/TextAttributeProps.java` (`getTextAlignment`) and `ReactBaseTextShadowNode.java`, `textAlign: "justify"` becomes `Gravity.LEFT` plus `JUSTIFICATION_MODE_INTER_WORD` (Android 8 / API 26+ only). `Gravity.LEFT` is an *absolute* alignment, so every line that Android does not stretch — the last line of the paragraph, and any line that ends with a forced break — is pinned to the **left** edge, even though the paragraph is Arabic. On Android < 8, there is no justification at all and everything is left aligned.

2. **`I18nManager.forceRTL` flips `left`/`right`.**
   Once RTL is active (after the first full reload), React Native swaps `textAlign: "right"` to left and vice versa on both platforms (`RCTTextAttributes.mm` `effectiveParagraphStyle` on iOS, `getTextAlignment(isRTL)` on Android). So `text-right` in the code actually means "align to the start", and the result differs between the first launch (LTR) and later launches (RTL). Use `textAlign: "left"` / `"auto"` meaning "start" under RTL, or avoid depending on it.

3. **`forceRTL` is applied late and needs a restart.** It is called in a `useEffect` in `app/_layout.tsx`; the native flag only takes effect after the app is reloaded, so screens render LTR on first launch. `allowRTL(true)` is not called, and there is no `expo-localization`/`app.json` `supportsRTL` config.

4. **Paragraph styles on nested `Text` are ignored.** `textAlign` (`text-justify`, `text-right`) only applies on the outermost `Text`. The per-verse classes have no effect except color/background. Likewise `justifyContent`, `display: "flex"` and `items-end` do nothing on a `Text`.

5. **No explicit paragraph direction.** The paragraph direction is inferred from the first strong character (iOS `NSWritingDirectionNatural`, Android `FIRSTSTRONG` heuristic). It is normally Arabic, but nothing forces it. `writingDirection: "rtl"` exists but is **iOS only**; on Android the reliable way is to start the text with a Right-to-Left Mark (`\u200F`) or wrap it in RLE/PDF or RLI/PDI characters.

6. **Platform justification is inter-word only.** Neither iOS nor Android stretches Arabic with kashida (tatweel); they widen the spaces. Lines with few words (long verses with long words, large font) can get large gaps. That is expected and is the reason real Mushaf apps use fixed line layouts (option C below).

## Fix options (ordered from cheapest to most faithful)

### A. Fix the single-paragraph approach (try first)
- Put all paragraph styles on the outer `Text` only: `textAlign: "justify"`, `writingDirection: "rtl"` (iOS), `lineHeight`.
- Prefix the paragraph with `\u200F` (RLM) so Android resolves an RTL paragraph.
- Remove `text-right`/`text-justify` from nested spans and the no-op `justifyContent`/`display`/`items-end`.
- For the Android last-line problem, test whether the paragraph's last line still lands on the left; if it does, possible workarounds are: render the last verse (or the last line) in a separate `Text` with start alignment, or use option B/C. Verify on Android 8+ only (justify is unsupported below API 26).
- Call `I18nManager.allowRTL(true)` + `forceRTL(true)` as early as possible (module scope) and set `"extra": { "supportsRTL": true }` / `expo-localization` config so the first launch is already RTL.

### B. Render the reader in a `WebView`
CSS gives full control: `direction: rtl; text-align: justify; text-align-last: right;` with the Uthmani font embedded via `@font-face`. Long-press / bookmark interactions need `postMessage` between the WebView and React Native. Robust and identical on both platforms, at the cost of an extra dependency (`react-native-webview`) and a less native feel.

### C. Mushaf page mode: line-by-line layout
Render fixed lines (15 per page, 604 pages) where each line is a `View` with `flexDirection: "row-reverse"` (or `row` under RTL) and `justifyContent: "space-between"` over its words. Justification is then done by layout, not by the text engine, so it is identical on Android and iOS and never depends on paragraph direction. `assets/fonts/Othmani/.../hafsData_v2-0.json` already has `page` and `line_start`/`line_end` per verse, but verses span lines, so **word-level** line data is needed (for example the Quran.com / QUL "words with `line_number`" datasets for the Madinah Mushaf). This is the most faithful option and also enables page and juz navigation.

## Recommendation
Do option A first as a quick improvement for the continuous-scroll reader, and plan option C as the long-term "Mushaf mode". Keep option B as a fallback if A cannot fix the Android last-line alignment.

## Test checklist for any fix
- Android 8+ device/emulator and iOS simulator, both on first launch after install (LTR state) and after reload (RTL state).
- Al-Fatiha (short), Al-Baqarah (long, lazy loading), At-Tawbah (must have no Basmalah), a verse starting with `۞`, a verse containing `۩`.
- Last line of the surah aligned to the right; verse numbers stay attached to the end of their verse; long-press highlights the correct verse.
