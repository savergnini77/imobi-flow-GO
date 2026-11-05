"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { describedBy, Field, FormAlert, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useActionResult } from "@/hooks/use-action-form";
import { updatePassword } from "@/modules/auth/actions";
import { updatePasswordSchema } from "@/modules/auth/schema";

type Values = z.input<typeof updatePasswordSchema>;

export function UpdatePasswordForm() {
  const router = useRouter();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(updatePasswordSchema) });
  const { formError, apply } = useActionResult(setError, setFocus);

  const onSubmit = handleSubmit(async (values) => {
    if (apply(await updatePassword(values))) {
      toast("Senha atualizada.");
      router.replace("/dashboard");
      router.refresh();
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormAlert>{formError}</FormAlert>
      <Field id="password" label="Nova senha" error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          autoFocus
          aria-invalid={!!errors.password}
          aria-describedby={describedBy("password", errors.password?.message)}
          {...register("password")}
        />
      </Field>
      <Field
        id="confirmPassword"
        label="Confirme a nova senha"
        error={errors.confirmPassword?.message}
      >
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={describedBy("confirmPassword", errors.confirmPassword?.message)}
          {...register("confirmPassword")}
        />
      </Field>
      <Button type="submit" size="lg" loading={isSubmitting}>
        Salvar nova senha
      </Button>
    </form>
  );
}
