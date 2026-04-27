export type DashboardStatusTone = "ready" | "pending" | "warning" | "danger";

export type DashboardModuleStatus = {
  title: string;
  label: string;
  value: string;
  detail: string;
  tone: DashboardStatusTone;
  href?: string;
  cta?: string;
};
