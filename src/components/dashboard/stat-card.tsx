import type { LucideIcon } from "lucide-react";
export function StatCard({ label, value, note, change, icon: Icon, trend }: { label: string; value: string; note?: string; change?: string; icon: LucideIcon; trend?: "up" | "down" | "neutral" }) {
  return <article className="stat-card"><div className="stat-card-head"><span>{label}</span><span className="stat-icon"><Icon /></span></div><strong>{value}</strong><small className={`trend-${trend ?? "up"}`}>{note ?? change ?? ""}</small></article>;
}
