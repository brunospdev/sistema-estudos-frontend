import React from 'react';
import './CardDisciplina.css';

function statusBullet(concluidos, total) {
  if (total === 0) return 'pendente';
  if (concluidos === total) return 'completo';
  if (concluidos > 0) return 'parcial';
  return 'pendente';
}

export default function CardDisciplina({ disciplina, onToggleTopico, onAdicionarTopico }) {
  const { id, nome, topicos = [] } = disciplina;
  const total = topicos.length;
  const concluidos = topicos.filter((t) => t.concluido).length;
  const status = statusBullet(concluidos, total);
  const todosConcluidos = total > 0 && concluidos === total;

  return (
    <div className={`card-disciplina${todosConcluidos ? ' completo' : ''}`}>
      <div className="card-header">
        <span className={`card-bullet ${status}`} />
        <span className="card-nome">{nome}</span>
        <span className="card-badge">
          {concluidos}/{total}
        </span>
      </div>

      <hr className="card-divisor" />

      <div className="card-topicos">
        {topicos.map((topico) => (
          <div
            key={topico.id}
            className="topico-item"
            onClick={() => onToggleTopico && onToggleTopico(id, topico.id)}
          >
            <div className={`topico-check${topico.concluido ? ' feito' : ''}`}>
              {topico.concluido && <span className="topico-check-icon">✓</span>}
            </div>
            <span className={`topico-nome${topico.concluido ? ' feito' : ''}`}>
              {topico.nome}
            </span>
          </div>
        ))}

        <button
          className="topico-add"
          onClick={() => onAdicionarTopico && onAdicionarTopico(id)}
        >
          <span className="topico-add-icon">⊞</span>
          Adicionar Tópico
        </button>
      </div>
    </div>
  );
}
