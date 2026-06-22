import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { DIFICULDADES } from '../constants/statusEstudo';
import './ModalPosSessao.css';

export default function ModalPosSessao({
  aberto,
  duracaoMinutos,
  itemSelecionado,
  onFechar,
  onSalvar,
  onPular,
}) {
  const [dificuldade, setDificuldade] = useState('');
  const [anotacao, setAnotacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  if (!aberto) return null;

  const temItem = Boolean(itemSelecionado?.assuntoId);

  async function handleSalvar() {
    if (temItem && !dificuldade) return;
    setSalvando(true);
    try {
      await onSalvar?.({ dificuldade: dificuldade || null, anotacao: anotacao.trim() || null });
      setDificuldade('');
      setAnotacao('');
    } finally {
      setSalvando(false);
    }
  }

  async function handlePular() {
    setSalvando(true);
    try {
      await onPular?.();
      setDificuldade('');
      setAnotacao('');
    } finally {
      setSalvando(false);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onFechar?.();
  }

  return createPortal(
    <div className="modal-pos-sessao-overlay" onClick={handleOverlayClick}>
      <div className="modal-pos-sessao-box" role="dialog" aria-modal="true">
        <h2 className="modal-pos-sessao-titulo">Sessão concluída — {duracaoMinutos} min</h2>
        {itemSelecionado && (
          <p className="modal-pos-sessao-item">
            {itemSelecionado.disciplinaNome && `${itemSelecionado.disciplinaNome} › `}
            {itemSelecionado.nome || 'Sessão livre'}
          </p>
        )}

        {temItem && (
          <div className="modal-pos-sessao-campo">
            <div className="modal-pos-sessao-label">Dificuldade</div>
            <div className="modal-pos-sessao-dificuldades">
              {Object.entries(DIFICULDADES).map(([valor, label]) => (
                <button
                  key={valor}
                  type="button"
                  className={`modal-pos-dif-btn${dificuldade === valor ? ' ativo' : ''}`}
                  onClick={() => setDificuldade(valor)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="modal-pos-sessao-campo">
          <label className="modal-pos-sessao-label" htmlFor="modal-pos-anotacao">
            Anotações (opcional)
          </label>
          <textarea
            id="modal-pos-anotacao"
            className="modal-pos-sessao-textarea"
            placeholder="O que estudou, dúvidas, referências..."
            value={anotacao}
            onChange={(e) => setAnotacao(e.target.value)}
            rows={3}
          />
        </div>

        <div className="modal-pos-sessao-acoes">
          <button
            type="button"
            className="modal-pos-btn-secundario"
            onClick={handlePular}
            disabled={salvando}
          >
            Pular
          </button>
          <button
            type="button"
            className="modal-pos-btn-principal"
            onClick={handleSalvar}
            disabled={salvando || (temItem && !dificuldade)}
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
