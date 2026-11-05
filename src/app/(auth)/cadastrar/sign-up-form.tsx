"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { MailIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { describedBy, Field, FormAlert, Input } from "@/components/ui/field";
import { useActionResult } from "@/hooks/use-action-form";
import { signUp } from "@/modules/auth/actions";
import { signUpSchema } from "@/modules/auth/schema";

type Values = z.input<typeof signUpSchema>;

export function SignUpForm({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const router = useRouter();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(signUpSchema) });
  const { formError, apply } = useActionResult(setError, setFocus);

  const onSubmit = handleSubmit(async (values) => {
    const result = await signUp(values, redirectTo);
    if (!apply(result)) return;
    if (result.data.needsEmailConfirmation) {
      setSentTo(values.email);
    } else {
      router.replace(redirectTo === "/dashboard" ? "/onboarding" : redirectTo);
      router.refresh();
    }
  });

  if (sentTo) {
    return (
      <div role="status" className="border-border bg-surface rounded-2xl border p-6 text-center">
        <div className="bg-accent text-accent-foreground mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
          <MailIcon />
        </div>
        <h2 className="font-semibold">Confirme seu e-mail</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Enviamos um link para <strong className="text-foreground">{sentTo}</strong>. Abra o e-mail
          para ativar sua conta. Não chegou? Confira a caixa de spam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormAlert>{formError}</FormAlert>

      <Field id="fullName" label="Seu nome" error={errors.fullName?.message}>
        <Input
          id="fullName"
          autoComplete="name"
          autoFocus
          aria-invalid={!!errors.fullName}
          aria-describedby={describedBy("fullName", errors.fullName?.message)}
          {...register("fullName")}
        />
      </Field>

      <Field id="email" label="E-mail" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={!!errors.email}
          aria-describedby={describedBy("email", errors.email?.message)}
          {...register("email")}
        />
      </Field>

      <Field
        id="password"
        label="Senha"
        error={errors.password?.message}
        hint="Mínimo de 8 caracteres."
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={describedBy("password", errors.password?.message, "hint")}
          {...register("password")}
        />
      </Field>

      <Button type="submit" size="lg" loading={isSubmitting}>
        Criar conta
      </Button>
    </form>
  );
}
