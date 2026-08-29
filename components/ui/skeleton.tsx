import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/** §8.10 — skeletons para listas que están cargando. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-surface-container", className)} />;
}

export function CardSkeleton() {
  return (
    <Card className="animate-pulse p-6">
      <div className="mb-3 h-5 w-2/3 rounded bg-surface-container" />
      <div className="h-4 w-1/3 rounded bg-surface-container" />
    </Card>
  );
}

export function CardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-gutter sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RowSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
