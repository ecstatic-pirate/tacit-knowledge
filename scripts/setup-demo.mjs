import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ Error: Missing required environment variables");
  console.error("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createDemoUser() {
  try {
    console.log("Creating demo user...");

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: "demo@tacit.local",
      password: "DemoPass123!",
      email_confirm: true,
      user_metadata: {
        full_name: "Demo User",
      },
    });

    if (authError) {
      if (authError.message?.includes("already registered")) {
        console.log("✓ Demo user already exists");
        return;
      }
      console.error("❌ Auth error:", authError.message);
      process.exit(1);
    }

    console.log("✓ Auth user created:", authUser?.user?.id);

    const { error: userError } = await supabase
      .from("users")
      .insert({
        id: authUser?.user?.id,
        email: "demo@tacit.local",
        org_id: "2c9fccfa-8bd7-4a89-be64-d92c3d205622",
        full_name: "Demo User",
        role: "owner",
      });

    if (userError && !userError.message?.includes("duplicate")) {
      console.error("❌ User record error:", userError.message);
      process.exit(1);
    }

    console.log("✓ App user record created");
    console.log("\n✅ Demo user created successfully!");
    console.log("━".repeat(50));
    console.log("Email:    demo@tacit.local");
    console.log("Password: DemoPass123!");
    console.log("━".repeat(50));
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createDemoUser();
