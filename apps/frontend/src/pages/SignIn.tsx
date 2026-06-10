import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Field, Logo } from '../ui/primitives.tsx';
import { useLogin } from '../api/hooks.ts';

export function SignIn() {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState('rh@solipse.com.br');
  const [password, setPassword] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate(
      { email, password },
      { onSuccess: () => navigate('/') },
    );
  }

  return (
    <div className="grid min-h-full place-items-center p-6">
      <Card className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo />
          <h1 className="text-2xl font-semibold text-navy">Bem-vindo</h1>
          <p className="text-sm text-muted">Entre para ver os benchmarks da sua empresa.</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com.br"
          />
          <Field
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {login.isError && (
            <p className="text-sm text-bad">{(login.error as Error).message}</p>
          )}

          <Button type="submit" disabled={login.isPending}>
            {login.isPending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          Contas são pré-cadastradas pela sua organização.
        </p>
      </Card>
    </div>
  );
}
