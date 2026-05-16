import React, { useState, useEffect, useRef } from 'react';
import './ModalDisciplina.css';

// Modal reutilizável para disciplina E tópico
export default function ModalDisciplina({ aberto, onFechar, onAdicionar, modo = 'disciplina' }) {
  const [nome, setNome] = useState('');
  const [carregando, setCarregando] = useState(false);
  const inputRef = useRef(null);

  const config = {
    disciplina: {
      titulo: 'Cadastrar Disciplina',
      subtitulo: 'Adicione uma nova disciplina ao seu plano de estudos',
      label: 'Nome da Disciplina',
      placeholder: 'Ex: Física, Álgebra, Redes...',
      btnLabel: 'Adicionar',
      btnCarregando: 'Adicionando...',
    },
    topico: {
      titulo: 'Adicionar Tópico',
      subtitulo: 'Adicione um novo tópico a esta disciplina',
      label: 'Nome do Tópico',
      placeholder: 'Ex: Derivadas, Funções, Vetores...',
      btnLabel: 'Adicionar',
      btnCarregando: 'Adicionando...',
    },
  };

  const c = config[modo] || config.disciplina;

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
        <button className="modal-fechar" onClick={onFechar} aria-label="Fechar">×</button>
        <h2 className="modal-titulo">{c.titulo}</h2>
        <p className="modal-subtitulo">{c.subtitulo}</p>
        <form onSubmit={handleSubmit}>
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
