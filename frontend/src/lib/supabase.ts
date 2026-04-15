import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hyydccpsvjijhzbpyarw.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_o-WoS8eG-ZLN17uhvppuoA_irhHqNDE';

export const supabase = createClient(supabaseUrl, supabaseKey);
