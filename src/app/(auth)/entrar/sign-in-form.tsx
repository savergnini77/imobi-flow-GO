"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { describedBy, Field, FormAlert, Input } from "@/components/ui/field";
import { useActionResult } from "@/hooks/use-action-form";
import { signIn } from "@/modules/auth/actions";
import { signInSchema } from "@/modules/auth/schema";

type Values = z.input<typeof signInSchema>;

export function SignInForm({
  initialError,
  redirectTo = "/dashboard",
}: {
  initialError?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(signInSchema) });
  const { formError, apply } = useActionResult(setError, setFocus);

  const onSubmit = handleSubmit(async (values) => {
    if (apply(await signIn(values))) {
      router.replace(redirectTo);
      router.refresh();
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormAlert>{formError ?? initialError}</FormAlert>

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

      <Field id="password" label="Senha" error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={describedBy("password", errors.password?.message)}
          {...register("password")}
        />
      </Field>

      <div className="-mt-1 text-right">
        <Link href="/recuperar-senha" className="text-primary text-sm font-medium hover:underline">
          Esqueci minha senha
        </Link>
      </div>

      <Button type="submit" size="lg" loading={isSubmitting}>
        Entrar
      </Button>
    </form>
  );
}
