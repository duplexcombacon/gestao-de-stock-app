import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, LogIn } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Preenche todos os campos');
      return;
    }
    setLoading(true);

    const errorMsg = await signIn(email, password);
    if (errorMsg) {
      setError(errorMsg);
      setLoading(false);
      return;
    }
    
    // Sucesso! A navegação vai depender da role ou apenas mandar para '/'.
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="size-12 rounded-xl bg-accent flex items-center justify-center mb-3">
            <Package size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">StockFlow</h1>
          <p className="text-sm text-text-muted mt-1">Gestão de Stock</p>
        </div>

        {/* Form */}
        <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="nome@empresa.pt"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            error={error}
          />
          <Button
            onClick={handleLogin}
            loading={loading}
            icon={<LogIn size={16} />}
            className="w-full"
          >
            Entrar
          </Button>
        </div>

        {/* Demo hint */}
        <p className="text-xs text-text-muted text-center mt-4">
          Demo: qualquer email/password funciona
        </p>
      </div>
    </div>
  );
}
