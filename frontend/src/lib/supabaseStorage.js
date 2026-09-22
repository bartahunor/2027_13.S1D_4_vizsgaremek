import { supabase } from './supabaseClient';

export async function getForrasKepUrl(path, expiresInSec = 7200) {
    if (!path) return null;

    const { data, error } = await supabase.storage
        .from('forras-kepek')
        .createSignedUrl(path, expiresInSec);

    if (error) {
        console.error(`Nem sikerült signed URL-t generálni (${path}):`, error.message);
        return null;
    }

    return data.signedUrl;
}