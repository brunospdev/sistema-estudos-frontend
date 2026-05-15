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

export default function Cadastro() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    if (!nome.trim() || !email.trim() || !senha.trim()) {
      setErro('Preencha todos os campos.');
      return;
    }

    setCarregando(true);
    try {
      await api.post('/auth/register', { nome, email, senha });
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao criar conta. Tente novamente.';
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
          <h1>Criar conta</h1>
          <p>Preencha os dados para se cadastrar</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="nome">NOME</label>
            <input
              id="nome"
              type="text"
              placeholder="Seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="name"
            />
          </div>

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
              autoComplete="new-password"
            />
          </div>

          {erro && <div className="login-erro">{erro}</div>}

          <button type="submit" className="btn-entrar" disabled={carregando}>
            {carregando ? 'Cadastrando...' : 'Cadastrar'}
          </button>

          <p className="login-cadastro">
            Já tem uma conta?{' '}
            <Link to="/login" className="link-cadastro">Entrar</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
