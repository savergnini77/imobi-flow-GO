"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import { deleteLocation, setHeadquarters, toggleLocationActive } from "@/modules/locations/actions";
import type { Location } from "@/modules/locations/types";

type Pending =
  | { kind: "hq"; location: Location }
  | { kind: "deactivate"; location: Location }
  | { kind: "delete"; location: Location }
  | null;

/**
 * Ações de uma filial que pedem confirmação (matriz, desativar, excluir),
 * com o diálogo já pronto. Reativar não pede confirmação.
 */
export function useLocationActions(options: { afterDelete?: () => void } = {}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState<Pending>(null);
  const [running, startTransition] = useTransition();

  const run = (action: () => Promise<ActionResult>, success: string, after?: () => void) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast(success);
        setPending(null);
        after?.();
      } else {
        toast(result.formError ?? "Não foi possível concluir a ação.", "error");
        setPending(null);
      }
    });

  const reactivate = (location: Location) =>
    run(
      () => toggleLocationActive({ id: location.id, isActive: true }),
      `"${location.name}" reativada.`,
    );

  const dialog = pending && (
    <ConfirmDialog
      open
      pending={running}
      onClose={() => setPending(null)}
      {...(pending.kind === "hq"
        ? {
            title: `Definir "${pending.location.name}" como matriz?`,
            description:
              "A matriz atual passa a ser uma filial comum. Corretores e equipes não mudam.",
            confirmLabel: "Definir como matriz",
            onConfirm: () =>
              run(
                () => setHeadquarters(pending.location.id),
                `"${pending.location.name}" agora é a matriz.`,
              ),
          }
        : pending.kind === "deactivate"
          ? {
              title: `Desativar "${pending.location.name}"?`,
              description:
                "A filial deixa de aparecer como ativa, mas nada é apagado. Você pode reativar quando quiser.",
              confirmLabel: "Desativar",
              tone: "danger" as const,
              onConfirm: () =>
                run(
                  () => toggleLocationActive({ id: pending.location.id, isActive: false }),
                  `"${pending.location.name}" desativada.`,
                ),
            }
          : {
              title: `Excluir "${pending.location.name}"?`,
              description: "Esta ação não pode ser desfeita.",
              confirmLabel: "Excluir filial",
              tone: "danger" as const,
              onConfirm: () =>
                run(
                  () => deleteLocation(pending.location.id),
                  `"${pending.location.name}" excluída.`,
                  options.afterDelete ?? (() => router.refresh()),
                ),
            })}
    />
  );

  return {
    running,
    dialog,
    reactivate,
    askHeadquarters: (location: Location) => setPending({ kind: "hq", location }),
    askDeactivate: (location: Location) => setPending({ kind: "deactivate", location }),
    askDelete: (location: Location) => setPending({ kind: "delete", location }),
  };
}

/** Motivo para não poder excluir (ou null se pode). */
export function deleteBlockedReason(
  location: Location & { memberCount?: number; teamCount?: number },
): string | null {
  if (location.isHeadquarters) return "A matriz não pode ser excluída.";
  if ((location.memberCount ?? 0) > 0 || (location.teamCount ?? 0) > 0) {
    return "Tem corretores ou equipes. Remova-os ou desative.";
  }
  return null;
}
