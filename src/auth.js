import { supabase } from "./supabaseClient";

export const signUp = async (email, password) => {
    const { data, error} = await supabase.auth.signUp({
        email,
        password,
    });
    if (error) throw error;
    return data;
};

export const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
}

export const signOut = async () => {
    await supabase.auth.signOut();
}

export const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}