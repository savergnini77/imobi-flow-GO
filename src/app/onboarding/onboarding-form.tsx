"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { describedBy, Field, FormAlert, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useActionResult } from "@/hooks/use-action-form";
import { createCompany } from "@/modules/companies/actions";
import { type CreateCompanyInput, createCompanySchema } from "@/modules/companies/schema";

export function OnboardingForm() {
  const router = useRouter();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<CreateCompanyInput>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: { name: "" },
  });
  const { formError, apply } = useActionResult(setError, setFocus);

  const onSubmit = handleSubmit(async (values) => {
    if (apply(await createCompany(values))) {
      toast("Imobiliária criada! Seu teste grátis de 14 dias começou.");
      router.replace("/dashboard");
      router.refresh();
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormAlert>{formError}</FormAlert>

      <Field
        id="name"
        label="Nome da imobiliária"
        error={errors.name?.message}
        hint="Como seus clientes conhecem você. Dá para mudar depois."
      >
        <Input
          id="name"
          autoFocus
          autoComplete="organization"
          placeholder="Ex.: Prime Imóveis"
          aria-invalid={!!errors.name}
          aria-describedby={describedBy("name", errors.name?.message, "hint")}
          {...register("name")}
        />
      </Field>

      <Button type="submit" size="lg" loading={isSubmitting}>
        Criar imobiliária
      </Button>
    </form>
  );
}
