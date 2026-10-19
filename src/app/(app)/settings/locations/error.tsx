"use client";

import { PageContainer } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function LocationsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <PageContainer>
      <EmptyState
        title="Não foi possível carregar as filiais"
        description="Verifique sua conexão e tente novamente."
        action={<Button onClick={reset}>Tentar novamente</Button>}
      />
    </PageContainer>
  );
}
