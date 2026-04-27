import { NextResponse } from "next/server";
import { getDashboardConfig } from "@/lib/dashboards/config";

type RouteContext = {
  params: Promise<{
    dashboardId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { dashboardId } = await context.params;
  const dashboard = getDashboardConfig(dashboardId);

  if (!dashboard) {
    return NextResponse.json(
      { error: `Dashboard "${dashboardId}" was not found.` },
      { status: 404 },
    );
  }

  return NextResponse.json(dashboard);
}
