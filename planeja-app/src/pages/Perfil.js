import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Perfil.css';

function dadosIniciais() {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return { nome: u.nome || u.name || '', email: u.email || '' };
  } catch {
    return { nome: '', email: '' };
  }
}

export default function Perfil() {
  const navigate = useNavigate();
  const inicial = dadosIniciais();

  const [nome, setNome] = useState(inicial.nome);
  const [email, setEmail] = useState(inicial.email);
  const [notificacoes, setNotificacoes] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const { data } = await api.get('/usuarios/perfil');
        setNome(data.nome || data.name || '');
        setEmail(data.email || '');
        setNotificacoes(data.notificacoes ?? true);
        localStorage.setItem('user', JSON.stringify(data));
      } catch {
        /* usa dados do localStorage */
      }
    }
    carregarPerfil();
  }, []);

  function handleSair() {
    if (!window.confirm('Deseja mesmo sair da conta?')) return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setFeedback(null);
    setCarregando(true);
    try {
      const { data } = await api.put('/usuarios/perfil', { nome, email });
      localStorage.setItem('user', JSON.stringify(data));
      setFeedback({ tipo: 'sucesso', msg: 'Perfil salvo com sucesso!' });
    } catch (err) {
      setFeedback({ tipo: 'erro', msg: err.response?.data?.message || 'Erro ao salvar.' });
    } finally {
      setCarregando(false);
    }
  }

  function handleExcluir() {
    if (!window.confirm('Tem certeza? Esta ação é irreversível.')) return;
    api.delete('/usuarios/perfil').then(() => {
      localStorage.clear();
      navigate('/login');
    });
  }

  return (
    <div className="perfil-page">
      <div className="perfil-inner">
        <button className="perfil-voltar" onClick={() => navigate('/')}>
          ← Voltar
        </button>

        <div className="perfil-topo">
          <span className="perfil-titulo">Perfil</span>
          <button className="btn-sair" onClick={handleSair}>
            Sair da Conta
          </button>
        </div>

        <div className="perfil-card-avatar">
          <div className="avatar-circulo">
            <span>👤</span>
          </div>
          <button className="btn-alterar-foto" onClick={() => {}}>
            Alterar Foto
          </button>
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

        {/* Notificações */}
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

        {/* Privacidade */}
        <div className="perfil-secao">
          <div className="perfil-secao-titulo">Privacidade</div>
          <div className="card-privacidade">
            <div className="privacidade-info">
              <div className="privacidade-titulo">Excluir conta</div>
              <div className="privacidade-desc">
                Remover permanentemente sua conta e dados
              </div>
            </div>
            <button className="btn-excluir" onClick={handleExcluir}>
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
