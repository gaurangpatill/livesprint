const maxFilePaths = 12;
const maxFilePathLength = 180;

function toValues(input: string[] | string) {
  return Array.isArray(input) ? input : input.split(/[\n,]/);
}

function normalizePathValue(path: string) {
  return path.trim().replace(/^\/+/, "");
}

export function isValidFilePath(path: string) {
  const normalizedPath = normalizePathValue(path);

  if (!normalizedPath || normalizedPath.length > maxFilePathLength) {
    return false;
  }

  if (
    normalizedPath.includes("\\") ||
    normalizedPath.includes("://") ||
    normalizedPath.startsWith("~") ||
    normalizedPath.includes("//") ||
    /[\u0000-\u001f]/.test(normalizedPath)
  ) {
    return false;
  }

  return !normalizedPath
    .split("/")
    .some((segment) => segment === "." || segment === ".." || !segment.trim());
}

export function getInvalidFilePaths(input: string[] | string) {
  return toValues(input)
    .map((path) => path.trim())
    .filter(Boolean)
    .filter((path) => !isValidFilePath(path));
}

export function validateFilePaths(input: string[] | string) {
  const invalidPaths = getInvalidFilePaths(input);

  if (invalidPaths.length > 0) {
    throw new Error(
      `Invalid file path "${invalidPaths[0]}". Use repo-relative paths like src/lib/session/index.ts.`,
    );
  }
}

export function normalizeFilePaths(input: string[] | string) {
  const values = toValues(input);

  return Array.from(
    new Set(
      values
        .map(normalizePathValue)
        .filter(Boolean)
        .filter(isValidFilePath),
    ),
  ).slice(0, maxFilePaths);
}
