"use server";

import { currentUser } from "@clerk/nextjs/server"
import { createSupabaseClient } from "../supabase" // Your existing function

export const createUser = async () => {
    const user = await currentUser()
    
    if (!user) {
        throw new Error("No user authenticated")
    }

    const supabase = createSupabaseClient() // Use your existing function

    const { data, error } = await supabase
        .from("users")
        .insert({
            clerk_user_id: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            username: user.username,
            full_name: user.fullName,
            avatar_url: user.imageUrl
        })
        .select()

    if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message)
    }
    
    console.log('User created in Supabase:', data[0])
    return data[0]
}