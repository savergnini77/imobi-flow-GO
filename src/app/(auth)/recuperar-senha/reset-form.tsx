"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { describedBy, Field, FormAlert, Input } from "@/components/ui/field";
import { useActionResult } from "@/hooks/use-action-form";
import { requestPasswordReset } from "@/modules/auth/actions";
import { requestPasswordResetSchema } from "@/modules/auth/schema";

type Values = z.input<typeof requestPasswordResetSchema>;

export function ResetForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(requestPasswordResetSchema) });
  const { formError, apply } = useActionResult(setError, setFocus);

  const onSubmit = handleSubmit(async (values) => {
    if (apply(await requestPasswordReset(values))) setSent(true);
  });

  if (sent) {
    return (
      <p
        role="status"
        className="border-border bg-accent text-accent-foreground rounded-xl border p-4 text-sm"
      >
        Se existir uma conta com este e-mail, você receberá o link em instantes. Confira também a
        caixa de spam.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormAlert>{formError}</FormAlert>
      <Field id="email" label="E-mail" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoFocus
          aria-invalid={!!errors.email}
          aria-describedby={describedBy("email", errors.email?.message)}
          {...register("email")}
        />
      </Field>
      <Button type="submit" size="lg" loading={isSubmitting}>
        Enviar link
      </Button>
    </form>
  );
}
