require('dotenv').config();
const supabase = require('./config/supabaseClient');

async function test() {
  const { data, error } = await supabase.from('users').select('*');
  console.log(data, error);
}

test();
