import React, { useState } from 'react';
import './ListaDescricoes.css';

export default function ListaDescricoes({
  descricoes = [],
  somenteLeitura = false,
  placeholder = 'Escreva aqui...',
  onAdicionar,
  onEditar,
  onExcluir,
}) {
  const [rascunho, setRascunho] = useState(null);
  const [editando, setEditando] = useState({});

  function iniciarNova() {
    setRascunho('');
  }

  async function salvarRascunho() {
    const texto = rascunho?.trim();
    setRascunho(null);
    if (!texto) return;
    await onAdicionar?.(texto);
  }

  async function salvarEdicao(id, textoOriginal) {
    const texto = (editando[id] ?? textoOriginal).trim();
    setEditando((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (!texto || texto === textoOriginal) return;
    await onEditar?.(id, texto);
  }

  return (
    <div className="lista-descricoes">
      {descricoes.length > 0 && (
        <ul className="lista-descricoes-itens">
          {descricoes.map((d) => (
            <li key={d.id} className="lista-descricao-item">
              {somenteLeitura ? (
                <p className="lista-descricao-texto">{d.texto}</p>
              ) : (
                <>
                  <textarea
                    className="lista-descricao-input"
                    value={editando[d.id] ?? d.texto}
                    onChange={(e) => setEditando((prev) => ({ ...prev, [d.id]: e.target.value }))}
                    onBlur={() => salvarEdicao(d.id, d.texto)}
                    rows={2}
                    maxLength={2000}
                  />
                  <button
                    type="button"
                    className="lista-descricao-excluir"
                    onClick={() => onExcluir?.(d.id)}
                    aria-label="Excluir descrição"
                    title="Excluir descrição"
                  >
                    ×
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {!somenteLeitura && rascunho !== null && (
        <div className="lista-descricao-item lista-descricao-rascunho">
          <textarea
            className="lista-descricao-input"
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            onBlur={salvarRascunho}
            placeholder={placeholder}
            rows={2}
            maxLength={2000}
            autoFocus
          />
        </div>
      )}

      {!somenteLeitura && rascunho === null && (
        <button type="button" className="lista-descricao-add" onClick={iniciarNova}>
          + Adicionar descrição
        </button>
      )}
    </div>
  );
}
