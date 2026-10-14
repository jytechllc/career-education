"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/admin-auth";
import { logActivity } from "@/lib/activity";
import { createContract, requestMeta, resendSignRequest, voidContract, type SignerInput } from "@/lib/contracts";

export async function createContractAction(
  _prev: { error: string | null },
  form: FormData,
): Promise<{ error: string | null }> {
  const { email } = await requireStaff("/admin/contracts/new");
  const signers: SignerInput[] = form.getAll("roleLabel").map((roleLabel, i) => ({
    roleLabel: String(roleLabel),
    name: String(form.getAll("name")[i] ?? ""),
    email: String(form.getAll("email")[i] ?? ""),
  }));
  let id: number;

  try {
    id = await createContract(
      {
        title: String(form.get("title") ?? ""),
        bodyMd: String(form.get("bodyMd") ?? ""),
        signers,
        sendEmail: form.get("sendEmail") === "on",
      },
      email,
      requestMeta(await headers()),
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "创建失败" };
  }

  await logActivity({ actorType: "staff", actor: email, action: "contract.create", targetType: "contract", targetId: id });
  redirect(`/admin/contracts/${id}`);
}

export async function resendAction(form: FormData) {
  const { email } = await requireStaff("/admin/contracts");
  const contractId = Number(form.get("contractId"));

  await resendSignRequest(contractId, Number(form.get("signerId")));
  await logActivity({ actorType: "staff", actor: email, action: "contract.resend", targetType: "contract", targetId: contractId });
  revalidatePath(`/admin/contracts/${contractId}`);
}

export async function voidAction(form: FormData) {
  const { email } = await requireStaff("/admin/contracts");
  const contractId = Number(form.get("contractId"));

  await voidContract(contractId, email, String(form.get("reason") ?? ""), requestMeta(await headers()));
  await logActivity({ actorType: "staff", actor: email, action: "contract.void", targetType: "contract", targetId: contractId });
  revalidatePath(`/admin/contracts/${contractId}`);
}
