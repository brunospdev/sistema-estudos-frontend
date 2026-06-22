import React, { useState, useEffect, useRef } from 'react';
import {
  TIPOS_ITEM,
  isTipoComNota,
  isTipoComEntrega,
  isTipoEvento,
} from '../constants/statusEstudo';
import './ModalDisciplina.css';

export default function ModalDisciplina({
  aberto,
  onFechar,
  onAdicionar,
  modo = 'disciplina',
  labelGrupo = 'Matéria',
  labelItem = 'Tópico',
}) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('CONTEUDO');
  const [dataProgramada, setDataProgramada] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [notaMaxima, setNotaMaxima] = useState('');
  const [descricao, setDescricao] = useState('');
  const [carregando, setCarregando] = useState(false);
  const inputRef = useRef(null);

  const config = {
    disciplina: {
      titulo: `Cadastrar ${labelGrupo}`,
      subtitulo: `Adicione uma nova ${labelGrupo.toLowerCase()} ao seu plano de estudos`,
      label: `Nome da ${labelGrupo}`,
      placeholder: 'Ex: Física, Álgebra, Redes...',
      btnLabel: 'Adicionar',
      btnCarregando: 'Adicionando...',
    },
    topico: {
      titulo: `Adicionar ${labelItem}`,
      subtitulo: `Adicione um novo ${labelItem.toLowerCase()} a esta ${labelGrupo.toLowerCase()}`,
      label: `Nome do ${labelItem}`,
      placeholder: 'Ex: Derivadas, Simulado #1, P2...',
      btnLabel: 'Adicionar',
      btnCarregando: 'Adicionando...',
    },
    subgrupo: {
      titulo: `Adicionar subgrupo`,
      subtitulo: `Adicione um subgrupo dentro desta ${labelGrupo.toLowerCase()}`,
      label: 'Nome do subgrupo',
      placeholder: 'Ex: Português, Matemática...',
      btnLabel: 'Adicionar',
      btnCarregando: 'Adicionando...',
    },
  };

  const c = config[modo] || config.disciplina;
  const mostrarTipo = modo === 'topico';
  const isEvento = mostrarTipo && isTipoEvento(tipo);
  const mostrarProgramada = mostrarTipo && !isEvento;
  const mostrarDataEvento = isEvento;
  const mostrarNotaMax = mostrarTipo && isTipoComNota(tipo);
  const mostrarDescricao = mostrarTipo;

  function labelDataEvento() {
    if (tipo === 'PROVA') return 'Data da prova';
    if (tipo === 'SIMULADO') return 'Data do simulado';
    if (tipo === 'ENTREGA') return 'Prazo de entrega';
    return 'Data do evento';
  }

  useEffect(() => {
    if (aberto) {
      setNome('');
      setTipo('CONTEUDO');
      setDataProgramada('');
      setDataEntrega('');
      setNotaMaxima('');
      setDescricao('');
      setCarregando(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [aberto]);

  async function handleSubmit(e) {
    e.preventDefault();
    const nomeTrimado = nome.trim();
    if (!nomeTrimado) return;
    setCarregando(true);
    try {
      if (modo === 'topico') {
        await onAdicionar({
          nome: nomeTrimado,
          tipo,
          dataProgramada: isEvento ? null : (dataProgramada || null),
          dataEntrega: isEvento ? (dataEntrega || null) : null,
          notaMaxima: notaMaxima ? Number(notaMaxima) : null,
          descricao: descricao.trim() || null,
        });
      } else {
        await onAdicionar(nomeTrimado);
      }
      onFechar();
    } finally {
      setCarregando(false);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onFechar();
  }

  if (!aberto) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-box" role="dialog" aria-modal="true">
        <button className="modal-fechar" onClick={onFechar} aria-label="Fechar">×</button>
        <h2 className="modal-titulo">{c.titulo}</h2>
        <p className="modal-subtitulo">{c.subtitulo}</p>
        <form onSubmit={handleSubmit}>
          {mostrarTipo && (
            <div className="form-group modal-field">
              <label className="modal-label" htmlFor="modal-input-tipo">Tipo</label>
              <select
                id="modal-input-tipo"
                className="modal-input"
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value);
                  setDataProgramada('');
                  setDataEntrega('');
                }}
              >
                {Object.entries(TIPOS_ITEM).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
            </div>
          )}

          <label className="modal-label" htmlFor="modal-input-nome">{c.label}</label>
          <input
            ref={inputRef}
            id="modal-input-nome"
            className="modal-input"
            type="text"
            placeholder={c.placeholder}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={80}
          />

          {mostrarProgramada && (
            <div className="modal-field">
              <label className="modal-label" htmlFor="modal-input-data">Data programada</label>
              <input
                id="modal-input-data"
                className="modal-input"
                type="date"
                value={dataProgramada}
                onChange={(e) => setDataProgramada(e.target.value)}
              />
            </div>
          )}

          {mostrarDataEvento && (
            <div className="modal-field">
              <label className="modal-label" htmlFor="modal-input-entrega">
                {labelDataEvento()}
              </label>
              <input
                id="modal-input-entrega"
                className="modal-input"
                type="date"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
              />
            </div>
          )}

            />
          )}

          {mostrarNotaMax && (
            <div className="modal-field">
              <label className="modal-label" htmlFor="modal-input-nota-max">Nota máxima</label>
              <input
                id="modal-input-nota-max"
                className="modal-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 1000, 10"
                value={notaMaxima}
                onChange={(e) => setNotaMaxima(e.target.value)}
              />
            </div>
          )}

          {mostrarDescricao && (
            <div className="modal-field">
              <label className="modal-label" htmlFor="modal-input-descricao">
                Descrição <span className="evento-opcional">(opcional)</span>
              </label>
              <textarea
                id="modal-input-descricao"
                className="modal-input modal-textarea"
                placeholder={isTipoComNota(tipo) || isTipoComEntrega(tipo)
                  ? 'Observações, conteúdo cobrado, local...'
                  : 'Resumo, referências, links, objetivos...'}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={2}
                maxLength={500}
              />
            </div>
          )}

          <button
            type="submit"
            className="modal-btn-adicionar"
            disabled={carregando || !nome.trim()}
          >
            {carregando ? c.btnCarregando : c.btnLabel}
          </button>
        </form>
      </div>

    </div>
  );
}
