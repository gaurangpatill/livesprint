export function normalizeFilePaths(input: string[] | string) {
  const values = Array.isArray(input) ? input : input.split(/[\n,]/);

  return Array.from(
    new Set(
      values
        .map((path) => path.trim())
        .filter(Boolean)
        .map((path) => path.replace(/^\/+/, "")),
    ),
  ).slice(0, 12);
}
