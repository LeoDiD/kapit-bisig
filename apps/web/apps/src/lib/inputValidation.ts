export const MAX_TEXT_LENGTH = 64
const ASCII_TEXT_REGEX = /^[\x20-\x7E]*$/

export function sanitizeAsciiText(input: string, max = MAX_TEXT_LENGTH): string {
  return input
    .slice(0, max)
    .split('')
    .filter((ch) => ASCII_TEXT_REGEX.test(ch))
    .join('')
}

export function sanitizeNoWhitespace(input: string, max = MAX_TEXT_LENGTH): string {
  return sanitizeAsciiText(input, max).replace(/\s/g, '')
}

export function isAsciiText(input: string): boolean {
  return ASCII_TEXT_REGEX.test(input)
}
