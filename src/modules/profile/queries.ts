// Leitura do perfil do usuário logado.

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type Profile = {
  fullName: string | null;
  phone: string | null;
  jobTitle: string | null;
};

export const getProfile = cache(async (userId: string): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, phone, job_title")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[profile.get]", error.code);
    return null;
  }
  if (!data) return null;

  return { fullName: data.full_name, phone: data.phone, jobTitle: data.job_title };
});
