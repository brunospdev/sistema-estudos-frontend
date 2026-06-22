import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { PRESETS_PERSONA } from '../constants/statusEstudo';
import LogoSvg from '../assets/logo.svg';
import './Perfil.css';

const PREFERENCIAS_PADRAO = {
  layoutMode: 'GRUPO_TOPICO',
  labelGrupo: 'Matéria',
  labelItem: 'Tópico',
  labelGrupoNivel2: '',
  profundidadeGrupos: 1,
  presetPersona: '',
  metaHorasDiarias: '',
};

export default function Perfil() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notificacoes, setNotificacoes] = useState(true);
  const [preferencias, setPreferencias] = useState(PREFERENCIAS_PADRAO);
  const [marcoPrincipal, setMarcoPrincipal] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [salvandoPrefs, setSalvandoPrefs] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [feedbackPrefs, setFeedbackPrefs] = useState(null);

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const { data } = await api.get('/usuarios/perfil');
        setNome(data.nome || '');
        setEmail(data.email || '');
      } catch { /* mantém dados do contexto */ }
    }

    async function carregarPreferencias() {
      try {
        const { data } = await api.get('/preferencias');
        setPreferencias({
          layoutMode: data.layoutMode || 'GRUPO_TOPICO',
          labelGrupo: data.labelGrupo || 'Matéria',
          labelItem: data.labelItem || 'Tópico',
          labelGrupoNivel2: data.labelGrupoNivel2 || '',
          profundidadeGrupos: data.profundidadeGrupos ?? 1,
          presetPersona: data.presetPersona || '',
          metaHorasDiarias: data.metaHorasDiarias ?? '',
        });
        setMarcoPrincipal(data.marcoPrincipal || null);
      } catch { /* mantém padrão */ }
    }

    carregarPerfil();
    carregarPreferencias();
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

  function handlePresetChange(presetKey) {
    if (!presetKey || !PRESETS_PERSONA[presetKey]) {
      setPreferencias((p) => ({ ...p, presetPersona: presetKey || '' }));
      return;
    }
    const preset = PRESETS_PERSONA[presetKey];
    setPreferencias((p) => ({
      ...p,
      labelGrupo: preset.labelGrupo,
      labelGrupoNivel2: preset.labelGrupoNivel2,
      labelItem: preset.labelItem,
      profundidadeGrupos: preset.profundidadeGrupos,
      presetPersona: preset.presetPersona,
      layoutMode: 'GRUPO_TOPICO',
    }));
  }

  async function handleSalvarPreferencias(e) {
    e.preventDefault();
    setFeedbackPrefs(null);
    setSalvandoPrefs(true);
    try {
      const payload = {
        layoutMode: preferencias.layoutMode,
        labelGrupo: preferencias.labelGrupo.trim() || 'Matéria',
        labelItem: preferencias.labelItem.trim() || 'Tópico',
        labelGrupoNivel2: preferencias.labelGrupoNivel2?.trim() || null,
        profundidadeGrupos: Number(preferencias.profundidadeGrupos) || 1,
        presetPersona: preferencias.presetPersona || null,
        metaHorasDiarias: preferencias.metaHorasDiarias
          ? Number(preferencias.metaHorasDiarias)
          : null,
      };
      const { data } = await api.put('/preferencias', payload);
      setPreferencias({
        layoutMode: data.layoutMode,
        labelGrupo: data.labelGrupo,
        labelItem: data.labelItem,
        labelGrupoNivel2: data.labelGrupoNivel2 || '',
        profundidadeGrupos: data.profundidadeGrupos ?? 1,
        presetPersona: data.presetPersona || '',
        metaHorasDiarias: data.metaHorasDiarias ?? '',
      });
      setMarcoPrincipal(data.marcoPrincipal || null);
      setFeedbackPrefs({ tipo: 'sucesso', msg: 'Preferências salvas!' });
    } catch (err) {
      setFeedbackPrefs({ tipo: 'erro', msg: err.response?.data?.message || 'Erro ao salvar preferências.' });
    } finally {
      setSalvandoPrefs(false);
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
          <div className="perfil-secao-titulo">Estudo</div>
          <form className="perfil-prefs-form" onSubmit={handleSalvarPreferencias}>
            <div className="form-group">
              <label htmlFor="pref-preset">Modelo de organização</label>
              <select
                id="pref-preset"
                value={preferencias.presetPersona || ''}
                onChange={(e) => handlePresetChange(e.target.value)}
              >
                <option value="">Personalizado</option>
                {Object.entries(PRESETS_PERSONA).map(([key, preset]) => (
                  <option key={key} value={key}>{preset.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="pref-layout">Modo de organização</label>
              <select
                id="pref-layout"
                value={preferencias.layoutMode}
                onChange={(e) => setPreferencias((p) => ({ ...p, layoutMode: e.target.value }))}
              >
                <option value="GRUPO_TOPICO">Matéria + Tópico</option>
                <option value="LISTA">Lista simples</option>
              </select>
            </div>

            <div className="perfil-prefs-row">
              <div className="form-group">
                <label htmlFor="pref-label-grupo">Rótulo do grupo</label>
                <input
                  id="pref-label-grupo"
                  type="text"
                  value={preferencias.labelGrupo}
                  onChange={(e) => setPreferencias((p) => ({ ...p, labelGrupo: e.target.value }))}
                  maxLength={40}
                  disabled={preferencias.layoutMode === 'LISTA'}
                />
              </div>
              <div className="form-group">
                <label htmlFor="pref-label-item">Rótulo do item</label>
                <input
                  id="pref-label-item"
                  type="text"
                  value={preferencias.labelItem}
                  onChange={(e) => setPreferencias((p) => ({ ...p, labelItem: e.target.value }))}
                  maxLength={40}
                />
              </div>
            </div>

            {preferencias.profundidadeGrupos >= 2 && preferencias.layoutMode !== 'LISTA' && (
              <div className="form-group">
                <label htmlFor="pref-label-grupo-n2">Rótulo do subgrupo</label>
                <input
                  id="pref-label-grupo-n2"
                  type="text"
                  value={preferencias.labelGrupoNivel2}
                  onChange={(e) => setPreferencias((p) => ({ ...p, labelGrupoNivel2: e.target.value }))}
                  maxLength={40}
                  placeholder="Ex: Matéria"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="pref-meta">Meta diária (horas)</label>
              <input
                id="pref-meta"
                type="number"
                min="0"
                step="0.5"
                value={preferencias.metaHorasDiarias}
                onChange={(e) => setPreferencias((p) => ({ ...p, metaHorasDiarias: e.target.value }))}
                placeholder="Ex: 2"
              />
            </div>

            {marcoPrincipal && (
              <div className="perfil-marco-principal">
                <span className="perfil-marco-label">Prova-alvo:</span>
                <span>{marcoPrincipal.titulo}</span>
                <span className="perfil-marco-dias">({marcoPrincipal.diasRestantes} dias)</span>
              </div>
            )}

            <button type="button" className="btn-link-marcos" onClick={() => navigate('/marcos')}>
              Gerenciar marcos →
            </button>

            {feedbackPrefs && (
              <div className={`perfil-feedback ${feedbackPrefs.tipo}`}>{feedbackPrefs.msg}</div>
            )}

            <button type="submit" className="btn-salvar" disabled={salvandoPrefs}>
              {salvandoPrefs ? 'Salvando...' : 'Salvar preferências'}
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
