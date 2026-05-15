import React, { useState, useEffect, useRef } from 'react';
import './ModalDisciplina.css';

export default function ModalDisciplina({ aberto, onFechar, onAdicionar }) {
  const [nome, setNome] = useState('');
  const [carregando, setCarregando] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (aberto) {
      setNome('');
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
      await onAdicionar(nomeTrimado);
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
        <button className="modal-fechar" onClick={onFechar} aria-label="Fechar">
          ×
        </button>

        <h2 className="modal-titulo">Cadastrar Disciplina</h2>
        <p className="modal-subtitulo">
          Adicione uma nova disciplina ao seu plano de estudos
        </p>

        <form onSubmit={handleSubmit}>
          <label className="modal-label" htmlFor="nome-disciplina">
            Nome da Disciplina
          </label>
          <input
            ref={inputRef}
            id="nome-disciplina"
            className="modal-input"
            type="text"
            placeholder="Ex: Física, Álgebra, Redes..."
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={80}
          />

          <button
            type="submit"
            className="modal-btn-adicionar"
            disabled={carregando || !nome.trim()}
          >
            {carregando ? 'Adicionando...' : 'Adicionar'}
          </button>
        </form>
      </div>
    </div>
  );
}
