require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws'); // <-- Importamos la librería que acabas de instalar

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: { persistSession: false },
    realtime: { transport: ws } // <-- Aquí le pasamos el "transporte" que pedía
  }
);

async function check() {
  const { data, error } = await supabase.from('empleados').select('*');
  if (error) console.log('❌ Error:', error.message);
  else console.log('✅ Conexión exitosa. Datos encontrados:', data);
}

check();
