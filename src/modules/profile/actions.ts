"use server";

// Server Actions do perfil do usuário logado. A RLS só permite editar o
// próprio perfil (profiles_update_self) e só as colunas liberadas na 0004.

import { revalidatePath } from "next/cache";

import {
  type ActionResult,
  failFields,
  failForm,
  succeed,
  zodToFieldErrors,
} from "@/lib/action-result";
import { getUser } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/modules/profile/schema";

export async function updateProfile(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return failFields(zodToFieldErrors(parsed.error));

  const user = await getUser();
  if (!user) return failForm("Sua sessão expirou. Entre novamente.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      job_title: parsed.data.jobTitle,
    })
    .eq("id", user.id)
    .select("id");

  if (error) {
    console.error("[profile.update]", error.code);
    return failForm("Não foi possível salvar seu perfil. Tente novamente.");
  }
  if (!data?.length) return failForm("Não foi possível salvar seu perfil. Entre novamente.");

  revalidatePath("/", "layout");
  return succeed(undefined);
}
