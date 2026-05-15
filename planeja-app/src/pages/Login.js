import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import './Login.css';

function Logo() {
  return (
    <div className="login-logo">
      <span className="login-logo-text">
        <span className="logo-planeja">PLANEJA</span>
        <span className="logo-plus">+</span>
      </span>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    if (!email.trim() || !senha.trim()) {
      setErro('Preencha o e-mail e a senha.');
      return;
    }

    setCarregando(true);
    try {
      const { data } = await api.post('/auth/login', { email, senha });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'E-mail ou senha inválidos.';
      setErro(msg);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <Logo />

        <div className="login-welcome">
          <h1>Bem-vindo!</h1>
          <p>Entre na sua conta para continuar</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">EMAIL</label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">SENHA</label>
            <input
              id="senha"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="login-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={lembrar}
                onChange={(e) => setLembrar(e.target.checked)}
              />
              Lembrar de mim
            </label>
            <a
              href="#esqueci"
              className="link-esqueci"
              onClick={(e) => { e.preventDefault(); alert('Funcionalidade em desenvolvimento'); }}
            >
              Esqueceu a senha?
            </a>
          </div>

          {erro && <div className="login-erro">{erro}</div>}

          <button type="submit" className="btn-entrar" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="login-cadastro">
            Não tem uma conta?{' '}
            <Link to="/cadastro" className="link-cadastro">Cadastre-se gratuitamente</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
