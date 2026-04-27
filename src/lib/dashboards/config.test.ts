import { describe, expect, it } from "vitest";
import { dashboardConfigs, getDashboardConfig } from "@/lib/dashboards/config";

describe("dashboard config", () => {
  it("defines the expected route-backed dashboards", () => {
    expect(dashboardConfigs.map((dashboard) => dashboard.id)).toEqual([
      "main",
      "sprint-board",
      "activity",
      "conflicts",
      "github",
      "timer",
    ]);
  });

  it("returns dashboard metadata with renderable sections", () => {
    const dashboard = getDashboardConfig("conflicts");

    expect(dashboard).toMatchObject({
      id: "conflicts",
      title: "Conflict Risk",
    });
    expect(dashboard?.sections).toContain("conflicts");
    expect(dashboard?.sections.length).toBeGreaterThan(0);
  });
});
