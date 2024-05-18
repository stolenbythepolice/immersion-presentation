export default function formulas(
  strings: TemplateStringsArray,
  ...rest: any[]
): string[] {
  return String.raw(strings, ...rest)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '')
}
