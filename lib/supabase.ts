import { createClient } from "@supabase/supabase-js"

// Single client that uses service role key (works everywhere)
export const createSupabaseClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}