/**
 * Create an admin user in Supabase Auth.
 *
 * Usage:
 *   npx tsx scripts/admin/create-user.ts you@example.com 'your-password'
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  if (!email || !password) {
    console.error(
      "Usage: npx tsx scripts/admin/create-user.ts <email> <password>",
    );
    process.exit(1);
  }
  if (password.length < 6) {
    console.error("Password must be at least 6 characters");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env");
    process.exit(1);
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error("Failed:", error.message);
    process.exit(1);
  }
  console.log("Created user:", data.user?.email, data.user?.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
