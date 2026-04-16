export type VitalsPayload = {
  metric: "LCP" | "INP" | "CLS" | "DASHBOARD_TAB";
  value: number;
  pathname: string;
  viewportClass: "mobile" | "desktop";
  networkType: string;
  locale: string;
  timestamp: number;
};
