import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ndbifgrohptognvmusax.supabase.co';
const supabaseAnonKey = 'sb_publishable_tU6BllFNXeXpBLGkSOheDg_bRcqdCIB';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
