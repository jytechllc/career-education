// The model tends to open the body with its own "# Title" and a byline
// blockquote, which the post page already renders above the content.
const LEADING_H1 = /^\s*#\s+[^\n]*\n+/;
const LEADING_BYLINE =
  /^\s*>[^\n]*(作者|撰写|杰圆|JY ?Career|Written by|\bBy\b)[^\n]*\n(>[^\n]*\n)*\n*/i;
const LEADING_RULE = /^\s*(-{3,}|\*{3,})\s*\n+/;

/** Strip a leading title, byline and divider that duplicate the page header. */
export function stripLeadingHeader(content: string): string {
  let out = content.replace(LEADING_H1, "");
  out = out.replace(LEADING_BYLINE, "");
  out = out.replace(LEADING_RULE, "");
  return out.trimStart();
}
