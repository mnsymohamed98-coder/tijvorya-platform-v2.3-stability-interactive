export function LoadingState({ text }: { text?: string }) {
  return <div className="empty-state loading-state"><span className="loading-ring" aria-hidden="true" />{text && <p>{text}</p>}</div>;
}
