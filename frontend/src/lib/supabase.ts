import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hyydccpsvjijhzbpyarw.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_o-WoS8eG-ZLN17uhvppuoA_irhHqNDE';

const customStorage = {
    getItem: (key: string) => {
        return window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
    },
    setItem: (key: string, value: string) => {
        if (window.localStorage.getItem('remember_me') === 'true') {
            window.localStorage.setItem(key, value);
        } else {
            window.sessionStorage.setItem(key, value);
        }
    },
    removeItem: (key: string) => {
        window.localStorage.removeItem(key);
        window.sessionStorage.removeItem(key);
    }
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: customStorage
    }
});
