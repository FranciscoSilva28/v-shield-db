import { createClient } from '@supabase/supabase-js';

// 1. Obtenemos las variables de entorno definidas en tu archivo .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 2. Validación de seguridad básica
// Esto evita que la aplicación falle silenciosamente si olvidaste configurar el .env
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno de Supabase. ' +
    'Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY configuradas en tu archivo .env.local'
  );
}

// 3. Inicializamos y exportamos el cliente único
// Este objeto 'supabase' será tu puerta de entrada a la base de datos en toda la app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
