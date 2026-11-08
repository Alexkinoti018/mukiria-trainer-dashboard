import { useState, type FormEvent } from "react";
import { Check, Copy, KeyRound, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreatedStaffAccount {
  name: string;
  email: string;
  role: "trainer" | "hod";
  department: string;
  temporaryPassword: string;
}

const STAFF_DEPARTMENTS = [
  { id: "dept-ci", name: "Computing & Informatics" },
  { id: "dept-ee", name: "Electrical & Electronics" },
];

export function AdminStaffAccountManager() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"trainer" | "hod">("trainer");
  const [departmentId, setDepartmentId] = useState("");
  const [createdAccount, setCreatedAccount] = useState<CreatedStaffAccount | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setCreatedAccount(null);
      setCopied(false);
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, role, department_id: departmentId }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not create the staff account.");
      }

      if (!result.success || !result.user || !result.temporaryPassword) {
        throw new Error("The server returned an incomplete account response.");
      }

      setCreatedAccount({
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        department:
          STAFF_DEPARTMENTS.find((department) => department.id === result.user.department_id)?.name ??
          "Department",
        temporaryPassword: result.temporaryPassword,
      });
      toast.success("Staff login created", {
        description: `Share the temporary password securely with ${result.user.name}.`,
      });
    } catch (error) {
      toast.error("Account creation failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!createdAccount) return;

    try {
      await navigator.clipboard.writeText(
        `Mukiria TTI staff login\nName: ${createdAccount.name}\nRole: ${createdAccount.role.toUpperCase()}\nEmail: ${createdAccount.email}\nTemporary password: ${createdAccount.temporaryPassword}`
      );
      setCopied(true);
      toast.success("Login details copied");
    } catch {
      toast.error("Could not copy login details", {
        description: "Select and copy the credentials manually.",
      });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-blue-300/30 bg-blue-500/15 px-4 py-2.5 text-xs font-bold text-blue-100 transition hover:bg-blue-500/25"
      >
        <UserPlus className="h-4 w-4" />
        <span>Create staff login</span>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          {createdAccount ? (
            <>
              <DialogHeader>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 sm:mx-0">
                  <KeyRound className="h-6 w-6" />
                </div>
                <DialogTitle>Staff login is ready</DialogTitle>
                <DialogDescription>
                  Share these details with {createdAccount.name} using a secure
                  channel. The temporary password is shown only once.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 rounded-xl border bg-muted/40 p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-semibold">{createdAccount.role.toUpperCase()}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Department</span>
                  <span className="text-right font-medium">{createdAccount.department}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Email</span>
                  <span className="break-all text-right font-medium">{createdAccount.email}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Temporary password</span>
                  <code className="block select-all break-all rounded-lg border bg-background px-3 py-2 font-mono text-sm">
                    {createdAccount.temporaryPassword}
                  </code>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                The staff member can now sign in with their email and this
                password. Share it directly through a secure channel.
              </p>

              <DialogFooter>
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy login details"}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Done
                </button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Create a staff login</DialogTitle>
                <DialogDescription>
                  Create a Trainer or HOD account and assign a department. A
                  strong temporary password will be generated for secure sharing.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="staff-name" className="text-sm font-medium">Full name</label>
                  <input
                    id="staff-name"
                    autoComplete="name"
                    required
                    maxLength={120}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    placeholder="e.g. Jane Mwende"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="staff-email" className="text-sm font-medium">Work email</label>
                  <input
                    id="staff-email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    placeholder="name@mtti.ac.ke"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="staff-role" className="text-sm font-medium">Access role</label>
                    <select
                      id="staff-role"
                      value={role}
                      onChange={(event) => {
                        if (event.target.value === "trainer" || event.target.value === "hod") {
                          setRole(event.target.value);
                        }
                      }}
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <option value="trainer">Trainer</option>
                      <option value="hod">Head of Department</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="staff-department" className="text-sm font-medium">Department</label>
                    <select
                      id="staff-department"
                      required
                      value={departmentId}
                      onChange={(event) => setDepartmentId(event.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <option value="" disabled>Select a department</option>
                      {STAFF_DEPARTMENTS.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="staff-phone" className="text-sm font-medium">
                    Phone <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    id="staff-phone"
                    type="tel"
                    autoComplete="tel"
                    maxLength={40}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    placeholder="+254..."
                  />
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
                  The password is only displayed after creation. It is not sent by
                  email; share it directly with the staff member.
                </div>

                <DialogFooter>
                  <button
                    type="button"
                    onClick={() => handleOpenChange(false)}
                    disabled={isSubmitting}
                    className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <UserPlus className="h-4 w-4" />
                    {isSubmitting ? "Creating login..." : "Create login"}
                  </button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
