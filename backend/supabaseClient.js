const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false, // 🚀 Crucial: Disables storage checks in Node.js
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

module.exports = supabase;
