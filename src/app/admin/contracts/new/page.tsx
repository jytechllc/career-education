import { requireStaff } from "@/lib/admin-auth";

import { NewContractForm } from "./NewContractForm";

export default async function NewContractPage() {
  await requireStaff("/admin/contracts/new");

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-yellow-900">发起签署</h1>
        <p className="text-sm text-gray-500 mt-1">
          从 docs/contracts 导入 .md 合同，填好空白，设置签署方，核对后发起。各方通过邮件（或你转发到微信的链接）+ 邮箱验证码签署。
        </p>
      </div>
      <NewContractForm />
    </div>
  );
}
