"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { describedBy, Field, FormAlert, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useActionResult } from "@/hooks/use-action-form";
import { updateCompanySettings } from "@/modules/companies/actions";
import type { CompanySettings } from "@/modules/companies/queries";
import { type CompanySettingsInput, companySettingsSchema } from "@/modules/companies/schema";
import { formatPhone, maskPhone } from "@/modules/locations/format";

type TextField = "name" | "legalName" | "document" | "creci" | "email" | "website";

/** "12345678000190" -> "12.345.678/0001-90"; CPF -> "123.456.789-01". */
function formatDocument(digits: string | null | undefined): string {
  if (!digits) return "";
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  return digits;
}

export function CompanySettingsForm({
  defaults,
  canEdit,
  canRename,
}: {
  defaults: CompanySettings | null;
  canEdit: boolean;
  canRename: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CompanySettingsInput>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      name: defaults?.name ?? "",
      legalName: defaults?.legalName ?? "",
      document: formatDocument(defaults?.document),
      creci: defaults?.creci ?? "",
      email: defaults?.email ?? "",
      phone: formatPhone(defaults?.phone),
      whatsapp: formatPhone(defaults?.whatsapp),
      website: defaults?.website ?? "",
    },
  });
  const { formError, apply } = useActionResult(setError, setFocus);

  const onSubmit = handleSubmit(async (values) => {
    if (apply(await updateCompanySettings(values))) {
      toast("Dados da imobiliária salvos.");
      router.refresh();
    }
  });

  const text = (
    name: TextField,
    label: string,
    options: { hint?: string; disabled?: boolean; type?: string; autoComplete?: string } = {},
  ) => (
    <Field id={name} label={label} error={errors[name]?.message} hint={options.hint}>
      <Input
        id={name}
        type={options.type ?? "text"}
        autoComplete={options.autoComplete}
        disabled={!canEdit || options.disabled}
        aria-invalid={!!errors[name]}
        aria-describedby={describedBy(name, errors[name]?.message, options.hint)}
        {...register(name)}
      />
    </Field>
  );

  const phone = (name: "phone" | "whatsapp", label: string) => (
    <Field id={name} label={label} error={errors[name]?.message}>
      <Input
        id={name}
        type="tel"
        inputMode="tel"
        placeholder="(11) 98765-4321"
        disabled={!canEdit}
        aria-invalid={!!errors[name]}
        aria-describedby={describedBy(name, errors[name]?.message)}
        {...register(name, {
          onChange: (event) => setValue(name, maskPhone(event.target.value), { shouldDirty: true }),
        })}
      />
    </Field>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {!canEdit && (
        <p className="bg-muted text-muted-foreground rounded-lg px-3 py-2.5 text-sm">
          Somente proprietários e administradores podem editar estes dados.
        </p>
      )}
      <FormAlert>{formError}</FormAlert>

      {text("name", "Nome da imobiliária", { disabled: !canRename, autoComplete: "organization" })}
      <div className="grid gap-5 sm:grid-cols-2">
        {text("legalName", "Razão social")}
        {text("document", "CNPJ ou CPF", { hint: "Corretor autônomo pode usar o CPF." })}
        {text("creci", "CRECI", { hint: "Ex.: 12345-J" })}
        {text("email", "E-mail de contato", { type: "email", autoComplete: "email" })}
        {phone("phone", "Telefone")}
        {phone("whatsapp", "WhatsApp")}
      </div>
      {text("website", "Site", { hint: "Ex.: primeimoveis.com.br", autoComplete: "url" })}

      {canEdit && (
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Salvar alterações
          </Button>
        </div>
      )}
    </form>
  );
}
