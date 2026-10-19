"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { describedBy, Field, FormAlert, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useActionResult } from "@/hooks/use-action-form";
import { formatPhone, maskPhone } from "@/modules/locations/format";
import { updateProfile } from "@/modules/profile/actions";
import type { Profile } from "@/modules/profile/queries";
import { type ProfileInput, profileSchema } from "@/modules/profile/schema";

export function ProfileForm({ email, defaults }: { email: string; defaults: Profile | null }) {
  const router = useRouter();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: defaults?.fullName ?? "",
      phone: formatPhone(defaults?.phone),
      jobTitle: defaults?.jobTitle ?? "",
    },
  });
  const { formError, apply } = useActionResult(setError, setFocus);

  const onSubmit = handleSubmit(async (values) => {
    if (apply(await updateProfile(values))) {
      toast("Perfil atualizado.");
      router.refresh();
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert>{formError}</FormAlert>

      <Field id="email" label="E-mail" hint="O e-mail de acesso não pode ser alterado aqui.">
        <Input id="email" value={email} disabled readOnly aria-describedby="email-hint" />
      </Field>

      <Field id="fullName" label="Nome completo" error={errors.fullName?.message}>
        <Input
          id="fullName"
          autoComplete="name"
          aria-invalid={!!errors.fullName}
          aria-describedby={describedBy("fullName", errors.fullName?.message)}
          {...register("fullName")}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="phone" label="Celular / WhatsApp" error={errors.phone?.message}>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(11) 98765-4321"
            aria-invalid={!!errors.phone}
            aria-describedby={describedBy("phone", errors.phone?.message)}
            {...register("phone", {
              onChange: (event) =>
                setValue("phone", maskPhone(event.target.value), { shouldDirty: true }),
            })}
          />
        </Field>

        <Field id="jobTitle" label="Cargo" error={errors.jobTitle?.message}>
          <Input
            id="jobTitle"
            autoComplete="organization-title"
            placeholder="Ex.: Corretor"
            aria-invalid={!!errors.jobTitle}
            aria-describedby={describedBy("jobTitle", errors.jobTitle?.message)}
            {...register("jobTitle")}
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Salvar perfil
        </Button>
      </div>
    </form>
  );
}
