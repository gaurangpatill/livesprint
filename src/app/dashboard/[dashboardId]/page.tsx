import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { dashboardConfigs, getDashboardConfig } from "@/lib/dashboards/config";

type DashboardPageProps = {
  params: Promise<{
    dashboardId: string;
  }>;
};

export function generateStaticParams() {
  return dashboardConfigs.map((dashboard) => ({
    dashboardId: dashboard.id,
  }));
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { dashboardId } = await params;

  if (!getDashboardConfig(dashboardId)) {
    notFound();
  }

  return <DashboardShell dashboardId={dashboardId} />;
}
