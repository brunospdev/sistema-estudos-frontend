import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../auth/AuthContext';
import LogoSvg from '../assets/logo.svg';
import './Perfil.css';

export default function Perfil() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notificacoes, setNotificacoes] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const { data } = await api.get('/usuarios/perfil');
        setNome(data.nome || '');
        setEmail(data.email || '');
      } catch { /* mantém dados do contexto */ }
    }
    carregarPerfil();
  }, []);

  async function handleSair() {
    if (!window.confirm('Deseja mesmo sair da conta?')) return;
    await logout();
    navigate('/login');
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setFeedback(null);
    setCarregando(true);
    try {
      await api.put('/usuarios/perfil', { nome, email });
      setFeedback({ tipo: 'sucesso', msg: 'Perfil salvo com sucesso!' });
    } catch (err) {
      setFeedback({ tipo: 'erro', msg: err.response?.data?.message || 'Erro ao salvar.' });
    } finally {
      setCarregando(false);
    }
  }

  async function handleExcluir() {
    if (!window.confirm('Tem certeza? Esta ação é irreversível.')) return;
    try {
      await api.delete('/usuarios/perfil');
      await logout();
      navigate('/login');
    } catch {
      setFeedback({ tipo: 'erro', msg: 'Não foi possível excluir a conta.' });
    }
  }

  return (
    <div className="perfil-page">
      <div className="perfil-inner">
        <div className="perfil-logo">
          <img src={LogoSvg} alt="Planeja+" />
        </div>

        <button className="perfil-voltar" onClick={() => navigate('/')}>
          ← Voltar
        </button>

        <div className="perfil-topo">
          <span className="perfil-titulo">PERFIL</span>
          <button className="btn-sair" onClick={handleSair}>Sair da Conta</button>
        </div>

        <div className="perfil-card">
          <div className="perfil-avatar-row">
            <div className="avatar-circulo">👤</div>
            <button className="btn-alterar-foto">Alterar Foto</button>
          </div>

          <form className="perfil-form" onSubmit={handleSalvar} noValidate>
            <div className="form-group">
              <label htmlFor="perfil-nome">NOME COMPLETO</label>
              <input
                id="perfil-nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="form-group">
              <label htmlFor="perfil-email">EMAIL</label>
              <input
                id="perfil-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>

            {feedback && (
              <div className={`perfil-feedback ${feedback.tipo}`}>{feedback.msg}</div>
            )}

            <button type="submit" className="btn-salvar" disabled={carregando}>
              {carregando ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
        </div>

        <div className="perfil-secao">
          <div className="perfil-secao-titulo">Notificações</div>
          <div className="notif-row">
            <span className="notif-texto">Receber lembretes de estudo</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificacoes}
                onChange={(e) => setNotificacoes(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        <div className="perfil-secao">
          <div className="perfil-secao-titulo">Privacidade</div>
          <div className="card-privacidade">
            <div className="privacidade-info">
              <div className="privacidade-titulo">Excluir conta</div>
              <div className="privacidade-desc">Remover permanentemente sua conta e dados</div>
            </div>
            <button className="btn-excluir" onClick={handleExcluir}>Excluir</button>
          </div>
        </div>
      </div>
    </div>
  );
}
