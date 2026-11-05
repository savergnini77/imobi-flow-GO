import type { Metadata } from "next";

import { ShieldIcon } from "@/components/shared/icons";
import { PageContainer } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { can, requireAppContext } from "@/lib/auth/context";
import { countLocations, listLocations } from "@/modules/locations/queries";
import { locationFiltersSchema } from "@/modules/locations/schema";

import { LocationsBoard } from "./_components/locations-board";

export const metadata: Metadata = { title: "Filiais" };

export default async function LocationsPage(props: PageProps<"/settings/locations">) {
  const context = await requireAppContext();

  if (!can(context, "locations.view")) {
    return (
      <PageContainer>
        <EmptyState
          icon={<ShieldIcon />}
          title="Sem acesso às filiais"
          description="Seu papel nesta imobiliária não permite ver as filiais. Fale com um administrador."
        />
      </PageContainer>
    );
  }

  const filters = locationFiltersSchema.parse(await props.searchParams);
  const companyId = context.active.companyId;
  const [locations, totals] = await Promise.all([
    listLocations(companyId, filters),
    countLocations(companyId),
  ]);

  return (
    <PageContainer>
      <LocationsBoard
        companyName={context.active.companyName}
        locations={locations}
        totals={totals}
        filters={filters}
        can={{
          create: can(context, "locations.create"),
          update: can(context, "locations.update"),
          delete: can(context, "locations.delete"),
          manageMembers: can(context, "locations.manage_members"),
        }}
      />
    </PageContainer>
  );
}
