"use client";

import { useState } from "react";
import type { FieldValues, Path, UseFormSetError, UseFormSetFocus } from "react-hook-form";

import type { ActionResult } from "@/lib/action-result";

/**
 * Aplica o resultado de uma Server Action num formulário react-hook-form:
 * erros por campo vão para o campo (com foco no primeiro); erro geral fica em formError.
 */
export function useActionResult<T extends FieldValues>(
  setError: UseFormSetError<T>,
  setFocus?: UseFormSetFocus<T>,
) {
  const [formError, setFormError] = useState<string | undefined>();

  function apply<D>(result: ActionResult<D>): result is { ok: true; data: D } {
    if (result.ok) {
      setFormError(undefined);
      return true;
    }
    const entries = Object.entries(result.fieldErrors ?? {});
    const fieldEntries = entries.filter(([key]) => key !== "_form");
    for (const [key, messages] of fieldEntries) {
      setError(key as Path<T>, { type: "server", message: messages[0] });
    }
    if (fieldEntries[0] && setFocus) setFocus(fieldEntries[0][0] as Path<T>);
    const formLevel = result.formError ?? result.fieldErrors?._form?.[0];
    setFormError(formLevel);
    return false;
  }

  return { formError, setFormError, apply };
}
