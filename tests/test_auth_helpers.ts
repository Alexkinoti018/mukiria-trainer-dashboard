/**
 * Mukiria Technical Training Institute (MTTI)
 * Test Helper: Authenticate via real /auth/login endpoint
 * File: tests/test_auth_helpers.ts
 */

export async function loginAs(
  baseUrl: string,
  role: "trainee" | "trainer" | "hod" | "admin"
): Promise<{ token: string; user: any }> {
  const credentialsList: Record<string, Array<{ identifier: string; password: string }>> = {
    trainee: [
      { identifier: "14179/S2026", password: "TraineePassword@2026!" },
      { identifier: "14179/S2026", password: "Mtti@2026!" },
    ],
    trainer: [
      { identifier: "trainer@mtti.ac.ke", password: "Mtti@2026!" },
    ],
    hod: [
      { identifier: "hod.ci@mtti.ac.ke", password: "Mtti@2026!" },
    ],
    admin: [
      { identifier: "admin@mtti.ac.ke", password: "Mtti@2026!" },
    ],
  };

  const credsList = credentialsList[role];
  if (!credsList) {
    throw new Error(`Unknown role for loginAs: ${role}`);
  }

  let lastRes: Response | null = null;
  let lastText = "";

  for (const creds of credsList) {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds),
    });

    if (res.ok) {
      const data = await res.json();
      return { token: data.token, user: data.user };
    }
    lastRes = res;
    lastText = await res.text();
  }

  throw new Error(`loginAs(${role}) failed: ${lastRes?.status} ${lastText}`);
}
