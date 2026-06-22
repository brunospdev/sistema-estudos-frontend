import React, { useState, useRef, useEffect } from 'react';
import {
  STATUS_ESTUDO,
  STATUS_LABELS,
  STATUS_CORES,
  normalizarStatus,
  nomeTopico,
  formatarDataISO,
  isTipoEvento,
} from '../constants/statusEstudo';
import EventoItem from './EventoItem';
import ListaDescricoes from './ListaDescricoes';
import ModalRecorrencia from './ModalRecorrencia';
import { temRecorrencia, resumirRecorrencia, recorrenciaFromApi } from '../constants/recorrencia';
import './TopicoItem.css';
import './ListaDescricoes.css';
import './ModalRecorrencia.css';

function TopicoItemInner({
  topico,
  disciplinaId,
  corAccent,
  onStatusChange,
  onAgendaChange,
  onRecorrenciaChange,
  onRecorrenciaRemover,
  onRename,
  onDelete,
  onDescricaoAdicionar,
  onDescricaoEditar,
  onDescricaoExcluir,
  onAvaliacaoChange,
  nivel = 0,
}) {
  const [editando, setEditando] = useState(false);
  const [nomeEdit, setNomeEdit] = useState(nomeTopico(topico));
  const [menuAberto, setMenuAberto] = useState(false);
  const [modalRecorrenciaAberto, setModalRecorrenciaAberto] = useState(false);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  const nome = nomeTopico(topico);
  const status = normalizarStatus(topico);
  const corStatus = STATUS_CORES[status];
  const descricoes = topico.descricoes || [];

  useEffect(() => {
    setNomeEdit(nome);
  }, [nome]);

  useEffect(() => {
    if (editando) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editando]);

  useEffect(() => {
    function handleClickFora(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false);
      }
    }
    if (menuAberto) document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [menuAberto]);

  async function salvarNome() {
    const nomeTrim = nomeEdit.trim();
    if (!nomeTrim || nomeTrim === nome) {
      setEditando(false);
      setNomeEdit(nome);
      return;
    }
    await onRename?.(disciplinaId, topico.id, nomeTrim);
    setEditando(false);
  }

  function handleNomeKeyDown(e) {
    if (e.key === 'Enter') salvarNome();
    if (e.key === 'Escape') {
      setNomeEdit(nome);
      setEditando(false);
    }
  }

  const subitens = topico.subitens || [];
  const subConteudo = subitens.filter((s) => !isTipoEvento(s.tipo));
  const subEventos = subitens.filter((s) => isTipoEvento(s.tipo));

  return (
    <>
      <article
        className="topico-card"
        style={{
          marginLeft: nivel > 0 ? `${nivel * 16}px` : undefined,
          '--topico-cor': corAccent,
        }}
      >
        <div className="topico-item-enhanced topico-item-conteudo">
          <span
            className="topico-status-dot"
            style={{ backgroundColor: corStatus }}
            aria-hidden="true"
          />

          {editando ? (
            <input
              ref={inputRef}
              className="topico-nome-input"
              value={nomeEdit}
              onChange={(e) => setNomeEdit(e.target.value)}
              onBlur={salvarNome}
              onKeyDown={handleNomeKeyDown}
              maxLength={80}
            />
          ) : (
            <span
              className={`topico-nome-enhanced${status === STATUS_ESTUDO.DOMINADO ? ' dominado' : ''}`}
              onDoubleClick={() => setEditando(true)}
            >
              {nome}
            </span>
          )}

          <div className="topico-item-acoes">
            <select
              className="topico-status-select"
              value={status}
              onChange={(e) => onStatusChange?.(disciplinaId, topico.id, e.target.value)}
              aria-label="Status do tópico"
              style={{ borderColor: corStatus, color: corStatus }}
            >
              {Object.entries(STATUS_LABELS).map(([valor, label]) => (
                <option key={valor} value={valor}>{label}</option>
              ))}
            </select>

            <input
              type="date"
              className="topico-data-input"
              value={topico.dataProgramada || ''}
              onChange={(e) => onAgendaChange?.(disciplinaId, topico.id, e.target.value || null)}
              aria-label="Data programada"
              title={topico.dataProgramada ? formatarDataISO(topico.dataProgramada) : 'Agendar'}
            />

            <button
              type="button"
              className={`topico-recorrencia-btn${temRecorrencia(topico) ? ' ativo' : ''}`}
              onClick={() => setModalRecorrenciaAberto(true)}
              disabled={!topico.dataProgramada}
              title={
                topico.dataProgramada
                  ? (temRecorrencia(topico)
                    ? resumirRecorrencia(recorrenciaFromApi(topico.recorrencia, topico.dataProgramada))
                    : 'Configurar repetição')
                  : 'Informe uma data primeiro'
              }
              aria-label="Configurar repetição"
            >
              ↻
            </button>

            {topico.horasAcumuladas > 0 && (
              <span className="topico-horas" title="Horas acumuladas">
                {Number(topico.horasAcumuladas).toFixed(1)}h
              </span>
            )}

            <div className="topico-menu-wrap" ref={menuRef}>
              <button
                type="button"
                className="topico-menu-btn"
                onClick={() => setMenuAberto((v) => !v)}
                aria-label="Ações do tópico"
                style={{ color: corAccent }}
              >
                ⋮
              </button>
              {menuAberto && (
                <div className="topico-menu-dropdown">
                  <button type="button" onClick={() => { setEditando(true); setMenuAberto(false); }}>
                    Renomear
                  </button>
                  <button
                    type="button"
                    className="topico-menu-excluir"
                    onClick={() => {
                      setMenuAberto(false);
                      if (window.confirm(`Excluir "${nome}"?`)) {
                        onDelete?.(disciplinaId, topico.id);
                      }
                    }}
                  >
                    Excluir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <ListaDescricoes
          descricoes={descricoes}
          placeholder="Resumo, referências, links, objetivos de estudo..."
          onAdicionar={(texto) => onDescricaoAdicionar?.(disciplinaId, topico.id, texto)}
          onEditar={(descricaoId, texto) => onDescricaoEditar?.(disciplinaId, topico.id, descricaoId, texto)}
          onExcluir={(descricaoId) => onDescricaoExcluir?.(disciplinaId, topico.id, descricaoId)}
        />
      </article>

      <ModalRecorrencia
        aberto={modalRecorrenciaAberto}
        onFechar={() => setModalRecorrenciaAberto(false)}
        dataReferencia={topico.dataProgramada}
        recorrenciaInicial={topico.recorrencia}
        titulo="Repetir estudo"
        onConfirmar={(payload) => onRecorrenciaChange?.(disciplinaId, topico.id, payload)}
        onRemover={topico.recorrencia ? () => onRecorrenciaRemover?.(disciplinaId, topico.id) : undefined}
      />

      {subEventos.map((sub) => (
        <div key={sub.id} style={nivel > 0 ? { marginLeft: `${(nivel + 1) * 16}px` } : { marginLeft: '16px' }}>
          <EventoItem
            topico={sub}
            disciplinaId={disciplinaId}
            modo={sub.entregaConcluida ? 'historico' : 'ativo'}
            onAgendaChange={onAgendaChange}
            onRecorrenciaChange={onRecorrenciaChange}
            onRecorrenciaRemover={onRecorrenciaRemover}
            onRename={onRename}
            onDelete={onDelete}
            onDescricaoAdicionar={onDescricaoAdicionar}
            onDescricaoEditar={onDescricaoEditar}
            onDescricaoExcluir={onDescricaoExcluir}
            onAvaliacaoChange={onAvaliacaoChange}
          />
        </div>
      ))}

      {subConteudo.map((sub) => (
        <TopicoItemInner
          key={sub.id}
          topico={sub}
          disciplinaId={disciplinaId}
          corAccent={corAccent}
          onStatusChange={onStatusChange}
          onAgendaChange={onAgendaChange}
          onRecorrenciaChange={onRecorrenciaChange}
          onRecorrenciaRemover={onRecorrenciaRemover}
          onRename={onRename}
          onDelete={onDelete}
          onDescricaoAdicionar={onDescricaoAdicionar}
          onDescricaoEditar={onDescricaoEditar}
          onDescricaoExcluir={onDescricaoExcluir}
          onAvaliacaoChange={onAvaliacaoChange}
          nivel={nivel + 1}
        />
      ))}
    </>
  );
}

export default function TopicoItem(props) {
  return <TopicoItemInner {...props} />;
}
