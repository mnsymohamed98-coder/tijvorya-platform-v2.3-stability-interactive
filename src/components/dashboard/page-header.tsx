export function PageHeader({ eyebrow, title, text, description, actions }: { eyebrow?: string; title: string; text?: string; description?: string; actions?: React.ReactNode }) {
  const copy = text ?? description;
  return <div className="dashboard-page-header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{copy && <p>{copy}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</div>;
}
export const DashboardPageHeader = PageHeader;
