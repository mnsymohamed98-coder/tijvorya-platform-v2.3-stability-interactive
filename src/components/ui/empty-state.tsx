import { PackageOpen } from "lucide-react";
export function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return <div className="empty-state"><PackageOpen /><h3>{title}</h3><p>{text}</p>{action}</div>;
}
