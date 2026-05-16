import React from 'react';
import './ModalPendentes.css';

export default function ModalPendentes({ aberto, onFechar, disciplinas }) {
  if (!aberto) return null;

  const grupos = disciplinas
    .map((d) => ({
      nome: d.nome,
      topicos: (d.topicos || []).filter((t) => !t.concluido),
    }))
    .filter((g) => g.topicos.length > 0);

  const total = grupos.reduce((acc, g) => acc + g.topicos.length, 0);

  function handleOverlay(e) {
    if (e.target === e.currentTarget) onFechar();
  }

  return (
    <div className="modal-pendentes-overlay" onClick={handleOverlay}>
      <div className="modal-pendentes-box">
        <div className="modal-pendentes-header">
          <span className="modal-pendentes-titulo">Tópicos Pendentes</span>
          <button className="modal-pendentes-fechar" onClick={onFechar}>×</button>
        </div>
        <p className="modal-pendentes-subtitulo">
          {total} {total === 1 ? 'tópico pendente' : 'tópicos pendentes'} no total
        </p>

        {grupos.length === 0 ? (
          <div className="modal-pendentes-vazio">Nenhum tópico pendente 🎉</div>
        ) : (
          grupos.map((grupo) => (
            <div key={grupo.nome} className="modal-pendentes-grupo">
              <div className="modal-pendentes-disciplina">
                <span className="modal-pendentes-bullet" />
                <span className="modal-pendentes-disciplina-nome">{grupo.nome}</span>
              </div>
              {grupo.topicos.map((t) => (
                <div key={t.id} className="modal-pendentes-topico">
                  <span className="modal-pendentes-topico-icone" />
                  <span className="modal-pendentes-topico-nome">{t.nome}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
