import { NextResponse } from "next/server";
import { dashboardConfigs } from "@/lib/dashboards/config";

export function GET() {
  return NextResponse.json({
    dashboards: dashboardConfigs.map((dashboard) => ({
      id: dashboard.id,
      title: dashboard.title,
      description: dashboard.description,
      sections: dashboard.sections,
    })),
  });
}
