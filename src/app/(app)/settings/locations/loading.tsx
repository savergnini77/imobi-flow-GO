import { PageContainer } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/empty-state";

export default function Loading() {
  return (
    <PageContainer>
      <div aria-busy="true" aria-label="Carregando filiais">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-7 w-40" />
        <Skeleton className="mt-8 h-10 w-full max-w-sm" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
