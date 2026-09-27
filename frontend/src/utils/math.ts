/**
 * Normalizes and prepares LaTeX math formulas in markdown text for Remark-Math & KaTeX.
 * Handles various LLM output formats:
 * - \[ ... \] -> $$ ... $$
 * - \( ... \) -> $ ... $
 * - Standalone single-line [ <latex formula> ] -> $$ ... $$
 * - Fixes newline breaks like \[4pt] to \\[4pt] in aligned/matrix environments
 * - Normalizes isolated math symbols like (\Delta) -> ($\Delta$)
 * - Normalizes accidental 4-space indented non-code lines that trigger <pre><code>
 */
export function preprocessMathContent(content: string | null | undefined): string {
  if (!content) return '';

  let res = content;

  // 1. Prevent accidental indented code blocks outside fenced code blocks
  const codeBlockSplit = res.split(/(```[\s\S]*?```)/g);
  res = codeBlockSplit.map((chunk, i) => {
    if (i % 2 === 1) return chunk; // Inside ```...``` code block, keep intact
    // Outside code blocks, reduce 4+ spaces at the start of a line to 2 spaces so it doesn't trigger <pre>
    return chunk.replace(/^[ ]{4,}(?=[*#\-+>0-9]|[a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])/gm, '  ');
  }).join('');

  // 2. Convert escaped display math: \[ ... \] or \\[ ... \\] to $$ ... $$
  res = res.replace(/\\\[([\s\S]*?)\\\]/g, (_match, formula) => {
    return `\n\n$$\n${cleanInnerFormula(formula)}\n$$\n\n`;
  });

  // 3. Convert escaped inline math: \( ... \) or \\( ... \\) to $ ... $
  res = res.replace(/\\\(([\s\S]*?)\\\)/g, (_match, formula) => {
    return `$${cleanInnerFormula(formula)}$`;
  });

  // 4. Convert strictly single-line standalone bracket blocks [ <latex math> ] to $$ ... $$
  // Only matches when:
  // - It is strictly on its own line
  // - Does NOT contain multiple lines or other brackets [ or ]
  // - Contains explicit LaTeX math keywords (\frac, \sqrt, \Delta, etc.)
  res = res.replace(
    /(^|\n)[ \t]*\[[ \t]*([^\n\r\[\]]*?\\(?:Delta|frac|sqrt|cdot|pm|begin|alpha|beta|gamma|theta|lambda|pi|sigma|omega|partial|int|sum|prod|lim|infty|qquad|quad|times|div|le|ge|neq|approx|mathbf|mathrm|vec|displaystyle)[^\n\r\[\]]*?)[ \t]*\][ \t]*(?=\n|$)/g,
    (_match, prefix, formula) => {
      return `${prefix}\n\n$$\n${cleanInnerFormula(formula)}\n$$\n\n`;
    }
  );

  // 5. Wrap isolated Greek symbols in parentheses e.g. (\Delta) -> ($\Delta$)
  res = res.replace(/\((\\[a-zA-Z]+)\)/g, '($$$1$)');

  return res;
}

/**
 * Clean common LLM LaTeX syntax quirks inside formulas
 */
function cleanInnerFormula(formula: string): string {
  let f = formula.trim();
  // Fix \[4pt] or \[1em] to \\[4pt]
  f = f.replace(/\\\[(\d+(?:pt|em|ex|px|cm|mm|in)?)\]/g, '\\\\ [$1]');
  // Fix accidental single backslash before bracket inside math environments
  f = f.replace(/([^\\])\\\[/g, '$1\\\\ [');
  return f;
}
