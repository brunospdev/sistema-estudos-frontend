import React, { useState, useRef, useEffect } from 'react';
import {
  TIPOS_ITEM,
  CORES_EVENTO,
  nomeTopico,
  formatarDataISO,
  formatarNota,
  isTipoComNota,
  eventoConcluido,
  exigeNotaParaConcluir,
} from '../constants/statusEstudo';
import ListaDescricoes from './ListaDescricoes';
import ModalRecorrencia, { RecorrenciaTrigger } from './ModalRecorrencia';
import { temRecorrencia, resumirRecorrencia, recorrenciaFromApi } from '../constants/recorrencia';
import './EventoItem.css';
import './ListaDescricoes.css';
import './ModalRecorrencia.css';

export default function EventoItem({
  topico,
  disciplinaId,
  modo = 'ativo',
  onAgendaChange,
  onRecorrenciaChange,
  onRecorrenciaRemover,
  onRename,
  onDelete,
  onAvaliacaoChange,
  onDescricaoAdicionar,
  onDescricaoEditar,
  onDescricaoExcluir,
}) {
  const [editando, setEditando] = useState(false);
  const [nomeEdit, setNomeEdit] = useState(nomeTopico(topico));
  const [notaEdit, setNotaEdit] = useState(topico.nota ?? '');
  const [menuAberto, setMenuAberto] = useState(false);
  const [expandido, setExpandido] = useState(modo === 'ativo');
  const [modalRecorrenciaAberto, setModalRecorrenciaAberto] = useState(false);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  const tipo = topico.tipo || 'OUTRO';
  const nome = nomeTopico(topico);
  const concluido = eventoConcluido(topico);
  const comNota = isTipoComNota(tipo);
  const exigeNota = exigeNotaParaConcluir(tipo);
  const corTipo = CORES_EVENTO[tipo] || CORES_EVENTO.OUTRO;
  const dataExibir = topico.dataEntrega || topico.dataProgramada;
  const dataRealizada = topico.dataRealizada;
  const somenteLeitura = modo === 'historico';
  const descricoes = topico.descricoes || [];

  useEffect(() => {
    setNomeEdit(nome);
    setNotaEdit(topico.nota ?? '');
  }, [nome, topico.nota]);

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

  async function salvarNota() {
    const nota = notaEdit === '' ? null : Number(notaEdit);
    await onAvaliacaoChange?.(disciplinaId, topico.id, { nota });
  }

  async function handleConcluir() {
    const notaFinal = notaEdit !== '' ? Number(notaEdit) : topico.nota;
    if (exigeNota && (notaFinal == null || notaFinal === '')) return;
    await onAvaliacaoChange?.(disciplinaId, topico.id, {
      nota: notaFinal,
      entregaConcluida: true,
    });
  }

  async function handleReabrir() {
    await onAvaliacaoChange?.(disciplinaId, topico.id, { entregaConcluida: false });
  }

  const podeConcluir = !concluido && (!exigeNota || notaEdit !== '' || topico.nota != null);

  return (
    <article
      className={`evento-item${concluido ? ' concluido' : ''}${modo === 'historico' ? ' historico' : ''}`}
      style={{ '--evento-cor': corTipo }}
    >
      <div className="evento-item-header">
        <button
          type="button"
          className="evento-item-toggle"
          onClick={() => setExpandido((v) => !v)}
          aria-expanded={expandido}
        >
          <span className="evento-tipo-badge">{TIPOS_ITEM[tipo] || tipo}</span>
          {concluido && <span className="evento-status-badge">Concluído</span>}
          {temRecorrencia(topico) && (
            <span className="recorrencia-badge" title={resumirRecorrencia(recorrenciaFromApi(topico.recorrencia, dataExibir))}>
              ↻ Recorrente
            </span>
          )}
        </button>

        <div className="evento-item-titulo-wrap">
          {editando && !somenteLeitura ? (
            <input
              ref={inputRef}
              className="evento-nome-input"
              value={nomeEdit}
              onChange={(e) => setNomeEdit(e.target.value)}
              onBlur={salvarNome}
              onKeyDown={(e) => {
                if (e.key === 'Enter') salvarNome();
                if (e.key === 'Escape') { setNomeEdit(nome); setEditando(false); }
              }}
              maxLength={80}
            />
          ) : (
            <h4 className="evento-nome" onDoubleClick={() => !somenteLeitura && setEditando(true)}>
              {nome}
            </h4>
          )}
          <span className="evento-meta">
            {dataExibir && (
              <span className="evento-data">
                {concluido && dataRealizada
                  ? `Realizado ${formatarDataISO(dataRealizada)}`
                  : formatarDataISO(dataExibir)}
              </span>
            )}
            {comNota && (topico.nota != null || notaEdit !== '') && (
              <span className="evento-nota-destaque">
                {formatarNota(notaEdit !== '' ? notaEdit : topico.nota, topico.notaMaxima)}
              </span>
            )}
          </span>
        </div>

        {!somenteLeitura && (
          <div className="evento-menu-wrap" ref={menuRef}>
            <button
              type="button"
              className="evento-menu-btn"
              onClick={() => setMenuAberto((v) => !v)}
              aria-label="Ações"
            >
              ⋮
            </button>
            {menuAberto && (
              <div className="evento-menu-dropdown">
                <button type="button" onClick={() => { setEditando(true); setMenuAberto(false); }}>
                  Renomear
                </button>
                <button
                  type="button"
                  className="evento-menu-excluir"
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
        )}
      </div>

      {expandido && (
        <div className="evento-item-body">
          {!somenteLeitura && (
            <div className="evento-campos">
              <label className="evento-campo">
                <span>Data</span>
                <input
                  type="date"
                  value={dataExibir || ''}
                  onChange={(e) => onAgendaChange?.(disciplinaId, topico.id, e.target.value || null)}
                />
              </label>

              <div className="evento-campo evento-campo-recorrencia">
                <RecorrenciaTrigger
                  recorrencia={topico.recorrencia}
                  dataReferencia={dataExibir}
                  onClick={() => setModalRecorrenciaAberto(true)}
                />
              </div>

              {comNota && (
                <label className="evento-campo evento-campo-nota">
                  <span>Nota{topico.notaMaxima != null ? ` / ${topico.notaMaxima}` : ''}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={notaEdit}
                    onChange={(e) => setNotaEdit(e.target.value)}
                    onBlur={salvarNota}
                    placeholder="—"
                  />
                </label>
              )}
            </div>
          )}

          {!somenteLeitura && (
            <div className="evento-acoes">
              <button
                type="button"
                className="evento-btn-concluir"
                disabled={!podeConcluir}
                onClick={handleConcluir}
                title={exigeNota && !podeConcluir ? 'Informe a nota para concluir' : 'Marcar como concluído'}
              >
                Concluir evento
              </button>
              {exigeNota && !podeConcluir && (
                <span className="evento-hint">Informe a nota para concluir</span>
              )}
            </div>
          )}

          {concluido && !somenteLeitura && (
            <button type="button" className="evento-btn-reabrir" onClick={handleReabrir}>
              Reabrir evento
            </button>
          )}
        </div>
      )}

      <ListaDescricoes
        descricoes={descricoes}
        somenteLeitura={somenteLeitura}
        placeholder="Observações, conteúdo cobrado, local..."
        onAdicionar={(texto) => onDescricaoAdicionar?.(disciplinaId, topico.id, texto)}
        onEditar={(descricaoId, texto) => onDescricaoEditar?.(disciplinaId, topico.id, descricaoId, texto)}
        onExcluir={(descricaoId) => onDescricaoExcluir?.(disciplinaId, topico.id, descricaoId)}
      />

      <ModalRecorrencia
        aberto={modalRecorrenciaAberto}
        onFechar={() => setModalRecorrenciaAberto(false)}
        dataReferencia={dataExibir}
        recorrenciaInicial={topico.recorrencia}
        titulo="Repetir evento"
        onConfirmar={(payload) => onRecorrenciaChange?.(disciplinaId, topico.id, payload)}
        onRemover={topico.recorrencia ? () => onRecorrenciaRemover?.(disciplinaId, topico.id) : undefined}
      />
    </article>
  );
}
