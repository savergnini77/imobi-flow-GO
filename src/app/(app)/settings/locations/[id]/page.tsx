import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { PageContainer } from "@/components/shared/page-header";
import { can, requireAppContext } from "@/lib/auth/context";
import {
  getLocation,
  listCompanyMembers,
  listCompanyTeams,
  listLocationMembers,
} from "@/modules/locations/queries";

import { LocationDetail } from "../_components/location-detail";

async function load(props: PageProps<"/settings/locations/[id]">) {
  const { id } = await props.params;
  if (!z.uuid().safeParse(id).success) notFound();
  const context = await requireAppContext();
  const location = await getLocation(context.active.companyId, id);
  if (!location) notFound();
  return { context, location };
}

export async function generateMetadata(
  props: PageProps<"/settings/locations/[id]">,
): Promise<Metadata> {
  const { location } = await load(props);
  return { title: location.name };
}

export default async function LocationDetailPage(props: PageProps<"/settings/locations/[id]">) {
  const { context, location } = await load(props);
  const companyId = context.active.companyId;

  const [members, companyMembers, teams] = await Promise.all([
    listLocationMembers(companyId, location.id),
    listCompanyMembers(companyId),
    listCompanyTeams(companyId),
  ]);

  return (
    <PageContainer>
      <LocationDetail
        location={location}
        members={members}
        companyMembers={companyMembers}
        teams={teams}
        can={{
          create: can(context, "locations.create"),
          update: can(context, "locations.update"),
          delete: can(context, "locations.delete"),
          manageMembers: can(context, "locations.manage_members"),
          manageTeams: can(context, "teams.update"),
        }}
      />
    </PageContainer>
  );
}
