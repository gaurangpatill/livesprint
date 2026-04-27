import { describe, expect, it } from "vitest";
import {
  getInvalidFilePaths,
  isValidFilePath,
  normalizeFilePaths,
  validateFilePaths,
} from "@/lib/tasks/filePaths";

describe("file path helpers", () => {
  it("normalizes repo-relative file paths", () => {
    expect(
      normalizeFilePaths([
        "/src/lib/session/index.ts",
        "src/lib/session/index.ts",
        " README.md ",
      ]),
    ).toEqual(["src/lib/session/index.ts", "README.md"]);
  });

  it("rejects paths that should not enter task or Git payloads", () => {
    expect(isValidFilePath("src/lib/session/index.ts")).toBe(true);
    expect(isValidFilePath("../secrets.env")).toBe(false);
    expect(isValidFilePath("https://example.com/file.ts")).toBe(false);
    expect(isValidFilePath("src\\lib\\session.ts")).toBe(false);
    expect(getInvalidFilePaths(["src/app/page.tsx", "../secret"])).toEqual([
      "../secret",
    ]);
  });

  it("throws a readable validation error for invalid paths", () => {
    expect(() => validateFilePaths("src/app/page.tsx\n../secret")).toThrow(
      "Invalid file path",
    );
  });
});
