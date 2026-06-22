import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LogoSvg from '../assets/logo.svg';
import { TIPOS_MARCO } from '../constants/statusEstudo';
import './Marcos.css';

const FORM_VAZIO = {
  tipo: 'PROVA',
  titulo: '',
  data: '',
  notas: '',
  disciplinaId: '',
  ehPrincipal: false,
};

export default function Marcos() {
  const navigate = useNavigate();
  const [marcos, setMarcos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [passadosAbertos, setPassadosAbertos] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [marcosRes, discRes] = await Promise.allSettled([
        api.get('/marcos'),
        api.get('/disciplinas'),
      ]);
      if (marcosRes.status === 'fulfilled') setMarcos(marcosRes.value.data);
      if (discRes.status === 'fulfilled') {
        setDisciplinas((discRes.value.data || []).filter((d) => !d.oculta));
      }
    } catch {
      /* mantém vazio */
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const hoje = new Date().toISOString().slice(0, 10);
  const proximos = marcos.filter((m) => m.data >= hoje).sort((a, b) => a.data.localeCompare(b.data));
  const passados = marcos.filter((m) => m.data < hoje).sort((a, b) => b.data.localeCompare(a.data));

  function resetForm() {
    setForm(FORM_VAZIO);
    setEditandoId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.data) return;

    const payload = {
      tipo: form.tipo,
      titulo: form.titulo.trim(),
      data: form.data,
      notas: form.notas.trim() || null,
      disciplinaId: form.disciplinaId ? Number(form.disciplinaId) : null,
      ehPrincipal: form.ehPrincipal,
    };

    setCarregando(true);
    setFeedback(null);
    try {
      if (editandoId) {
        const { data } = await api.put(`/marcos/${editandoId}`, payload);
        setMarcos((prev) => prev.map((m) => (m.id === editandoId ? data : m)));
        setFeedback({ tipo: 'sucesso', msg: 'Marco atualizado.' });
      } else {
        const { data } = await api.post('/marcos', payload);
        setMarcos((prev) => [...prev, data]);
        setFeedback({ tipo: 'sucesso', msg: 'Marco criado.' });
      }
      resetForm();
    } catch (err) {
      setFeedback({ tipo: 'erro', msg: err.response?.data?.message || 'Erro ao salvar marco.' });
    } finally {
      setCarregando(false);
    }
  }

  function handleEditar(marco) {
    setEditandoId(marco.id);
    setForm({
      tipo: marco.tipo,
      titulo: marco.titulo,
      data: marco.data,
      notas: marco.notas || '',
      disciplinaId: marco.disciplinaId ? String(marco.disciplinaId) : '',
      ehPrincipal: marco.ehPrincipal || false,
    });
  }

  async function handleExcluir(id) {
    if (!window.confirm('Excluir este marco?')) return;
    setMarcos((prev) => prev.filter((m) => m.id !== id));
    try {
      await api.delete(`/marcos/${id}`);
      if (editandoId === id) resetForm();
    } catch {
      setFeedback({ tipo: 'erro', msg: 'Não foi possível excluir.' });
      carregar();
    }
  }

  function renderMarco(marco) {
    return (
      <div key={marco.id} className="marco-item">
        <div className="marco-item-info">
          <span className="marco-tipo">{TIPOS_MARCO[marco.tipo] || marco.tipo}</span>
          <span className="marco-titulo">{marco.titulo}</span>
          <span className="marco-data">
            {new Date(`${marco.data}T12:00:00`).toLocaleDateString('pt-BR')}
          </span>
          {marco.ehPrincipal && <span className="marco-principal-badge">Prova-alvo</span>}
        </div>
        <div className="marco-acoes">
          <button type="button" onClick={() => handleEditar(marco)}>Editar</button>
          <button type="button" className="marco-excluir" onClick={() => handleExcluir(marco.id)}>Excluir</button>
        </div>
      </div>
    );
  }

  return (
    <div className="marcos-page">
      <div className="marcos-inner">
        <div className="marcos-logo">
          <img src={LogoSvg} alt="Planeja+" />
        </div>

        <button type="button" className="marcos-voltar" onClick={() => navigate('/perfil')}>
          ← Voltar
        </button>

        <h1 className="marcos-titulo">Marcos</h1>

        <form className="marcos-form" onSubmit={handleSubmit}>
          <div className="marcos-form-row">
            <label className="marcos-campo">
              <span>Tipo</span>
              <select
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
              >
                {Object.entries(TIPOS_MARCO).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
            </label>
            <label className="marcos-campo">
              <span>Data</span>
              <input
                type="date"
                value={form.data}
                onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                required
              />
            </label>
          </div>

          <label className="marcos-campo">
            <span>Título</span>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              placeholder="Ex: ENEM 2026, Prova de Física..."
              maxLength={255}
              required
            />
          </label>

          <label className="marcos-campo">
            <span>Vincular a matéria (opcional)</span>
            <select
              value={form.disciplinaId}
              onChange={(e) => setForm((f) => ({ ...f, disciplinaId: e.target.value }))}
            >
              <option value="">Nenhuma</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </label>

          <label className="marcos-campo">
            <span>Notas (opcional)</span>
            <textarea
              value={form.notas}
              onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
              rows={2}
              placeholder="Observações..."
            />
          </label>

          <label className="marcos-checkbox">
            <input
              type="checkbox"
              checked={form.ehPrincipal}
              onChange={(e) => setForm((f) => ({ ...f, ehPrincipal: e.target.checked }))}
            />
            <span>Prova-alvo principal</span>
          </label>

          {feedback && (
            <div className={`marcos-feedback ${feedback.tipo}`}>{feedback.msg}</div>
          )}

          <div className="marcos-form-acoes">
            {editandoId && (
              <button type="button" className="marcos-btn-secundario" onClick={resetForm}>
                Cancelar
              </button>
            )}
            <button type="submit" className="marcos-btn-principal" disabled={carregando}>
              {carregando ? 'Salvando...' : editandoId ? 'Atualizar' : 'Criar marco'}
            </button>
          </div>
        </form>

        <section className="marcos-lista-secao">
          <h2 className="marcos-secao-titulo">Próximos</h2>
          {carregando && marcos.length === 0 ? (
            <p className="marcos-vazio">Carregando...</p>
          ) : proximos.length === 0 ? (
            <p className="marcos-vazio">Nenhum marco futuro.</p>
          ) : (
            proximos.map(renderMarco)
          )}
        </section>

        {passados.length > 0 && (
          <section className="marcos-lista-secao">
            <button
              type="button"
              className="marcos-secao-toggle"
              onClick={() => setPassadosAbertos((v) => !v)}
            >
              Concluídos ({passados.length}) {passadosAbertos ? '▼' : '▶'}
            </button>
            {passadosAbertos && passados.map(renderMarco)}
          </section>
        )}
      </div>
    </div>
  );
}
