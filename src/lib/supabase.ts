import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://lylrvtkufhtrrvwnmwem.supabase.co";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5bHJ2dGt1Zmh0cnJ2d25td2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MzMyMTQsImV4cCI6MjA4OTIwOTIxNH0.kvX8_NkyvTVzvplmWGpNIIt6M6XT6COrzFhiQTG_ocg";

export const supabase = createClient(supabaseUrl, supabaseKey);
