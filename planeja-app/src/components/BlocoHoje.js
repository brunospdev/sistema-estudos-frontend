import React from 'react';
import { STATUS_LABELS, normalizarStatus, nomeTopico, TIPOS_ITEM } from '../constants/statusEstudo';
import './BlocoHoje.css';

export default function BlocoHoje({ itens = [], labelItem = 'Tópico', onSelecionarItem }) {
  if (!itens.length) return null;

  const hoje = itens.filter((i) => !i.atrasado);
  const atrasados = itens.filter((i) => i.atrasado);

  function renderItem(item) {
    const status = normalizarStatus(item);
    const nome = nomeTopico(item);
    return (
      <button
        key={`${item.disciplinaId}-${item.id}`}
        type="button"
        className={`bloco-hoje-item${item.atrasado ? ' atrasado' : ''}`}
        onClick={() => onSelecionarItem?.({ ...item, nome })}
      >
        <span className="bloco-hoje-nome">{nome}</span>
        {item.disciplinaNome && (
          <span className="bloco-hoje-disciplina">{item.disciplinaNome}</span>
        )}
        {item.tipo && item.tipo !== 'CONTEUDO' && (
          <span className="bloco-hoje-tipo">{TIPOS_ITEM[item.tipo] || item.tipo}</span>
        )}
        {estudavel(item) && (
          <span className={`bloco-hoje-status status-${status.toLowerCase()}`}>
            {STATUS_LABELS[status]}
          </span>
        )}
        {item.atrasado && <span className="bloco-hoje-badge-atrasado">Atrasado</span>}
        {item.entrega && !item.atrasado && (
          <span className="bloco-hoje-badge-entrega">Entrega hoje</span>
        )}
      </button>
    );
  }

  function estudavel(item) {
    return !item.entrega && (!item.tipo || ['CONTEUDO', 'REVISAO', 'PRATICA'].includes(item.tipo));
  }

  return (
    <section className="bloco-hoje" aria-label="Estudo de hoje">
      <div className="bloco-hoje-header">
        <span className="bloco-hoje-titulo">Hoje</span>
        <span className="bloco-hoje-count">{itens.length}</span>
      </div>

      {hoje.length > 0 && (
        <div className="bloco-hoje-grupo">
          <div className="bloco-hoje-grupo-label">Programados</div>
          {hoje.map(renderItem)}
        </div>
      )}

      {atrasados.length > 0 && (
        <div className="bloco-hoje-grupo">
          <div className="bloco-hoje-grupo-label atrasado">Atrasados</div>
          {atrasados.map(renderItem)}
        </div>
      )}

      {itens.length === 0 && (
        <p className="bloco-hoje-vazio">Nenhum {labelItem.toLowerCase()} para hoje.</p>
      )}
    </section>
  );
}
