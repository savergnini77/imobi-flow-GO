"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { acceptInvitation } from "@/modules/invitations/actions";

export function AcceptInvitation({ token }: { token: string }) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-6 flex flex-col gap-3">
      <FormAlert>{error}</FormAlert>
      <Button
        size="lg"
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await acceptInvitation(token);
            if (!result.ok) {
              setError(result.formError);
              return;
            }
            toast("Convite aceito. Bem-vindo à equipe!");
            router.replace("/dashboard");
            router.refresh();
          })
        }
      >
        Aceitar convite
      </Button>
    </div>
  );
}
