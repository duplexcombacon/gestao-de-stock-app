import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddigolduyjcknyjwxvai.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkaWdvbGR1eWpja255and4dmFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTk4NTYsImV4cCI6MjA5NTEzNTg1Nn0.drxmxuWVVNRjxPpXwof_PUf7XWf8-1GinjSGUrwt1x0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- DIAGNÓSTICO PROFUNDO SUPABASE ---');
  console.log('1. A tentar fazer Login direto como admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@admin.com',
    password: 'admin123'
  });
  
  if (authError) {
    console.error('❌ ERRO NO LOGIN:', authError.message);
    return;
  }
  
  console.log('✅ Login Efetuado! UID:', authData.user.id);
  
  console.log('2. A tentar ler o perfil (Role) do utilizador logado...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();
    
  if (profileError) {
    console.error('❌ ERRO AO LER PERFIL:', profileError);
  } else {
    console.log('✅ PERFIL LIDO:', profile);
  }
  
  console.log('3. A testar RLS: Pode este utilizador ler todos os perfis (Permissão de Admin)?');
  const { data: allUsers, error: usersError } = await supabase
    .from('profiles')
    .select('*');
    
  if (usersError) {
    console.error('❌ ERRO DE RLS AO LER TODOS OS UTILIZADORES:', usersError);
  } else {
    console.log(`✅ SUCESSO: Acesso a ${allUsers.length} utilizador(es). Roles encontradas:`, allUsers.map(u => u.role));
  }
}

run();
