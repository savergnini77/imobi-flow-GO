"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { type Resolver, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Sheet } from "@/components/ui/dialog";
import { describedBy, Field, FormAlert, Input, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useActionResult } from "@/hooks/use-action-form";
import { createLocation, lookupCep, updateLocation } from "@/modules/locations/actions";
import { formatCep, formatPhone, maskCep, maskPhone } from "@/modules/locations/format";
import { type LocationData, locationInputSchema, UFS } from "@/modules/locations/schema";
import type { Location } from "@/modules/locations/types";

type FormValues = {
  name: string;
  code: string;
  phone: string;
  whatsapp: string;
  email: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

function toFormValues(location?: Location | null): FormValues {
  return {
    name: location?.name ?? "",
    code: location?.code ?? "",
    phone: formatPhone(location?.phone),
    whatsapp: formatPhone(location?.whatsapp),
    email: location?.email ?? "",
    cep: formatCep(location?.cep),
    street: location?.street ?? "",
    number: location?.number ?? "",
    complement: location?.complement ?? "",
    neighborhood: location?.neighborhood ?? "",
    city: location?.city ?? "",
    state: location?.state ?? "",
  };
}

type CepStatus = "idle" | "loading" | "found" | "not-found";

/**
 * Painel lateral de criar/editar filial.
 * Monte com key diferente por filial para reiniciar o formulário.
 */
export function LocationFormSheet({
  open,
  location,
  onClose,
  onCreated,
}: {
  open: boolean;
  /** null/undefined = nova filial. */
  location?: Location | null;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const isEdit = Boolean(location);
  const toast = useToast();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [cepStatus, setCepStatus] = useState<CepStatus>("idle");
  const [, startCepLookup] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    setFocus,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues, unknown, LocationData>({
    // O schema aceita strings vazias e as normaliza (null, só dígitos etc.).
    resolver: zodResolver(locationInputSchema) as unknown as Resolver<
      FormValues,
      unknown,
      LocationData
    >,
    defaultValues: toFormValues(location),
  });
  const { formError, apply } = useActionResult(setError, setFocus);

  const requestClose = () => {
    if (isDirty && !isSubmitting) setConfirmDiscard(true);
    else onClose();
  };

  const runCepLookup = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 8) {
      setCepStatus("idle");
      return;
    }
    setCepStatus("loading");
    startCepLookup(async () => {
      const address = await lookupCep(digits);
      // O usuário pode ter mudado o CEP enquanto a busca rodava.
      if (getValues("cep").replace(/\D/g, "") !== digits) return;
      if (!address) {
        setCepStatus("not-found");
        return;
      }
      setCepStatus("found");
      const fill = { shouldDirty: true, shouldValidate: true } as const;
      if (address.street) setValue("street", address.street, fill);
      if (address.neighborhood) setValue("neighborhood", address.neighborhood, fill);
      if (address.city) setValue("city", address.city, fill);
      if (address.state) setValue("state", address.state, fill);
      setFocus("number");
    });
  };

  const onSubmit = handleSubmit(async (data) => {
    if (location) {
      if (apply(await updateLocation({ ...data, id: location.id }))) {
        toast("Filial atualizada.");
        onClose();
      }
      return;
    }
    const result = await createLocation(data);
    if (apply(result)) {
      toast(`Filial "${data.name}" criada.`);
      onClose();
      onCreated?.(result.data.id);
    }
  });

  const text = (
    name: keyof FormValues,
    label: string,
    props: React.ComponentProps<typeof Input> = {},
  ) => (
    <Field
      id={`loc-${name}`}
      label={label}
      error={errors[name]?.message}
      required={name === "name"}
    >
      <Input
        id={`loc-${name}`}
        aria-invalid={!!errors[name]}
        aria-describedby={describedBy(`loc-${name}`, errors[name]?.message)}
        {...props}
        {...register(name)}
      />
    </Field>
  );

  const phone = (name: "phone" | "whatsapp", label: string) => (
    <Field id={`loc-${name}`} label={label} error={errors[name]?.message}>
      <Input
        id={`loc-${name}`}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="(11) 98765-4321"
        aria-invalid={!!errors[name]}
        aria-describedby={describedBy(`loc-${name}`, errors[name]?.message)}
        {...register(name, {
          onChange: (event) => setValue(name, maskPhone(event.target.value), { shouldDirty: true }),
        })}
      />
    </Field>
  );

  const cepHint =
    cepStatus === "loading"
      ? "Buscando endereço…"
      : cepStatus === "found"
        ? "Endereço preenchido pelo CEP. Confira e informe o número."
        : cepStatus === "not-found"
          ? "CEP não encontrado. Preencha o endereço manualmente."
          : "Digite o CEP e preenchemos o endereço para você.";

  return (
    <>
      <Sheet
        open={open}
        onClose={requestClose}
        title={isEdit ? `Editar ${location?.name}` : "Nova filial"}
        description={
          isEdit
            ? "Atualize os dados de contato e endereço."
            : "Cadastre um escritório para organizar corretores e equipes por região."
        }
        footer={
          <>
            <Button variant="secondary" onClick={requestClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" form="location-form" loading={isSubmitting}>
              {isEdit ? "Salvar alterações" : "Criar filial"}
            </Button>
          </>
        }
      >
        <form id="location-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-7">
          <FormAlert>{formError}</FormAlert>

          <fieldset className="grid gap-4 sm:grid-cols-[1fr_9rem]">
            <legend className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
              Identificação
            </legend>
            {text("name", "Nome da filial", { placeholder: "Ex.: Filial Moema", autoFocus: true })}
            {text("code", "Código", { placeholder: "SP-01", autoCapitalize: "characters" })}
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
              Contato
            </legend>
            {phone("phone", "Telefone")}
            {phone("whatsapp", "WhatsApp")}
            <div className="sm:col-span-2">
              {text("email", "E-mail", {
                type: "email",
                inputMode: "email",
                autoComplete: "email",
                placeholder: "moema@suaimobiliaria.com.br",
              })}
            </div>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-6">
            <legend className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
              Endereço
            </legend>
            <Field
              id="loc-cep"
              label="CEP"
              error={errors.cep?.message}
              hint={cepHint}
              className="sm:col-span-6"
            >
              <Input
                id="loc-cep"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="00000-000"
                className="sm:max-w-40"
                aria-invalid={!!errors.cep}
                aria-describedby={describedBy("loc-cep", errors.cep?.message, cepHint)}
                {...register("cep", {
                  onChange: (event) => {
                    const masked = maskCep(event.target.value);
                    setValue("cep", masked, { shouldDirty: true });
                    runCepLookup(masked);
                  },
                })}
              />
            </Field>
            <div className="sm:col-span-4">
              {text("street", "Rua / Avenida", { autoComplete: "address-line1" })}
            </div>
            <div className="sm:col-span-2">{text("number", "Número")}</div>
            <div className="sm:col-span-3">
              {text("complement", "Complemento", { placeholder: "Sala, andar…" })}
            </div>
            <div className="sm:col-span-3">{text("neighborhood", "Bairro")}</div>
            <div className="sm:col-span-4">
              {text("city", "Cidade", { autoComplete: "address-level2" })}
            </div>
            <Field
              id="loc-state"
              label="UF"
              error={errors.state?.message}
              className="sm:col-span-2"
            >
              <Select
                id="loc-state"
                autoComplete="address-level1"
                aria-invalid={!!errors.state}
                aria-describedby={describedBy("loc-state", errors.state?.message)}
                {...register("state")}
              >
                <option value="">—</option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </Select>
            </Field>
          </fieldset>
        </form>
      </Sheet>

      <ConfirmDialog
        open={confirmDiscard}
        title="Descartar alterações?"
        description="As informações que você digitou não foram salvas."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        tone="danger"
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
        onClose={() => setConfirmDiscard(false)}
      />
    </>
  );
}
