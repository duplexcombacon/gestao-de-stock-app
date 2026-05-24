// Importar o cliente do Supabase
import { createClient } from '@supabase/supabase-js';

// Obter as chaves a partir das variáveis de ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Inicializar a ligação ao Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  // Chamar a função RPC para apagar um utilizador específico de teste
  const { data, error } = await supabase.rpc('delete_user', { p_user_id: '00000000-0000-0000-0000-000000000000' });
  console.log('Result:', { data, error });
}

// Executar a função de teste
test();
