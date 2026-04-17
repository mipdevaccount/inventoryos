import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hyydccpsvjijhzbpyarw.supabase.co';
const supabaseKey = 'sb_publishable_o-WoS8eG-ZLN17uhvppuoA_irhHqNDE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing Login...");
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@commander.com',
        password: 'admin123'
    });
    if (error) {
        console.error("Login Failed:");
        console.error(error);
        return;
    }
    console.log("Login Success!");
    console.log("User:", data.user?.email);
}

test();
