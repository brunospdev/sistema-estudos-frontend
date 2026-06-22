import React, { useState } from 'react';
import TopicoItem from './TopicoItem';
import EventoItem from './EventoItem';
import { STATUS_ESTUDO, normalizarStatus, flattenTopicos, particionarTopicos } from '../constants/statusEstudo';
import './CardDisciplina.css';
import './EventoItem.css';

const CORES = [
  '#027A8F',
  '#F38F2B',
  '#9B59B6',
  '#E74C3C',
  '#27AE60',
  '#2980B9',
  '#E67E22',
  '#16A085',
];

function statusBullet(topicos) {
  const estudaveis = topicos.filter((t) => !t.tipo || ['CONTEUDO', 'REVISAO', 'PRATICA'].includes(t.tipo));
  const total = estudaveis.length;
  if (total === 0) return 'pendente';
  const dominados = estudaveis.filter((t) => normalizarStatus(t) === STATUS_ESTUDO.DOMINADO).length;
  if (dominados === total) return 'completo';
  if (dominados > 0 || estudaveis.some((t) => normalizarStatus(t) !== STATUS_ESTUDO.NAO_INICIADO)) {
    return 'parcial';
  }
  return 'pendente';
}

function SecaoTopicos({
  titulo,
  topicos,
  disciplinaId,
  corBullet,
  handlers,
}) {
  if (!topicos.length) return null;
  return (
    <div className="card-secao-conteudo">
      {titulo && <div className="card-secao-titulo">{titulo}</div>}
      {topicos.map((topico) => (
        <TopicoItem
          key={topico.id}
          topico={topico}
          disciplinaId={disciplinaId}
          corAccent={corBullet}
          {...handlers}
        />
      ))}
    </div>
  );
}

function SecaoEventos({
  titulo,
  topicos,
  disciplinaId,
  modo,
  handlers,
}) {
  if (!topicos.length) return null;
  return (
    <div className="card-secao-eventos">
      {titulo && <div className="card-secao-titulo">{titulo}</div>}
      {topicos.map((topico) => (
        <EventoItem
          key={topico.id}
          topico={topico}
          disciplinaId={disciplinaId}
          modo={modo}
          {...handlers}
        />
      ))}
    </div>
  );
}

export default function CardDisciplina({
  disciplina,
  index = 0,
  labelItem = 'Tópico',
  labelGrupoNivel2 = 'Subgrupo',
  profundidadeGrupos = 1,
  colapsavel = true,
  nivel = 0,
  onAdicionarTopico,
  onAdicionarSubgrupo,
  onRemoverDisciplina,
  onStatusChange,
  onAgendaChange,
  onRecorrenciaChange,
  onRecorrenciaRemover,
  onRenameTopico,
  onDeleteTopico,
  onAvaliacaoChange,
  onDescricaoAdicionar,
  onDescricaoEditar,
  onDescricaoExcluir,
}) {
  const { id, nome, topicos = [], subgrupos = [] } = disciplina;
  const todosTopicos = flattenTopicos(disciplina);
  const estudaveis = todosTopicos.filter((t) => !t.tipo || ['CONTEUDO', 'REVISAO', 'PRATICA'].includes(t.tipo));
  const total = estudaveis.length;
  const dominados = estudaveis.filter((t) => normalizarStatus(t) === STATUS_ESTUDO.DOMINADO).length;
  const status = statusBullet(todosTopicos);
  const todosDominados = total > 0 && dominados === total;
  const corBullet = CORES[(index + nivel) % CORES.length];
  const [expandido, setExpandido] = useState(true);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const podeSubgrupo = profundidadeGrupos >= 2 && nivel === 0;

  const { conteudo, eventosPendentes, eventosConcluidos } = particionarTopicos(topicos);
  const vazio = topicos.length === 0;

  const handlers = {
    onStatusChange,
    onAgendaChange,
    onRecorrenciaChange,
    onRecorrenciaRemover,
    onRename: onRenameTopico,
    onDelete: onDeleteTopico,
    onAvaliacaoChange,
    onDescricaoAdicionar,
    onDescricaoEditar,
    onDescricaoExcluir,
  };

  function toggleExpandido() {
    if (colapsavel) setExpandido((v) => !v);
  }

  return (
    <div className={`card-disciplina${todosDominados ? ' completo' : ''}${nivel > 0 ? ' card-subgrupo' : ''}`}>
      <div
        className={`card-header${colapsavel ? ' clicavel' : ''}`}
        onClick={colapsavel ? toggleExpandido : undefined}
        role={colapsavel ? 'button' : undefined}
        tabIndex={colapsavel ? 0 : undefined}
        onKeyDown={colapsavel ? (e) => e.key === 'Enter' && toggleExpandido() : undefined}
      >
        {colapsavel && (
          <span className="card-chevron" aria-hidden="true">
            {expandido ? '▼' : '▶'}
          </span>
        )}
        <span className={`card-bullet ${status}`} style={{ backgroundColor: corBullet }} />
        <span className="card-nome">{nome}</span>
        <span className="card-badge">{dominados}/{total || topicos.length}</span>
        {nivel === 0 && (
          <button
            className="card-remover"
            onClick={(e) => {
              e.stopPropagation();
              onRemoverDisciplina?.(id);
            }}
            aria-label="Remover disciplina"
            title="Remover disciplina"
          >
            ×
          </button>
        )}
      </div>

      {expandido && (
        <>
          <hr className="card-divisor" />

          <div className="card-topicos">
            {vazio ? (
              <p className="card-topicos-vazio">Nenhum {labelItem.toLowerCase()} ainda.</p>
            ) : (
              <>
                <SecaoTopicos
                  titulo={conteudo.length && (eventosPendentes.length || eventosConcluidos.length) ? 'Conteúdo de estudo' : null}
                  topicos={conteudo}
                  disciplinaId={id}
                  corBullet={corBullet}
                  handlers={handlers}
                />

                <SecaoEventos
                  titulo={eventosPendentes.length ? 'Eventos' : null}
                  topicos={eventosPendentes}
                  disciplinaId={id}
                  modo="ativo"
                  handlers={handlers}
                />

                {eventosConcluidos.length > 0 && (
                  <>
                    <button
                      type="button"
                      className="card-historico-toggle"
                      onClick={() => setHistoricoAberto((v) => !v)}
                    >
                      <span>{historicoAberto ? '▼' : '▶'}</span>
                      Histórico de eventos
                      <span className="card-historico-count">{eventosConcluidos.length}</span>
                    </button>
                    {historicoAberto && (
                      <SecaoEventos
                        topicos={eventosConcluidos}
                        disciplinaId={id}
                        modo="historico"
                        handlers={handlers}
                      />
                    )}
                  </>
                )}
              </>
            )}

            <button
              className="topico-add"
              onClick={() => onAdicionarTopico?.(id)}
            >
              <span className="topico-add-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              Adicionar {labelItem}
            </button>
          </div>

          {podeSubgrupo && subgrupos.length > 0 && (
            <div className="card-subgrupos">
              {subgrupos.map((sub, subIndex) => (
                <CardDisciplina
                  key={sub.id}
                  disciplina={sub}
                  index={subIndex}
                  labelItem={labelItem}
                  labelGrupoNivel2={labelGrupoNivel2}
                  profundidadeGrupos={profundidadeGrupos}
                  colapsavel
                  nivel={nivel + 1}
                  onAdicionarTopico={onAdicionarTopico}
                  onAdicionarSubgrupo={onAdicionarSubgrupo}
                  onStatusChange={onStatusChange}
                  onAgendaChange={onAgendaChange}
                  onRecorrenciaChange={onRecorrenciaChange}
                  onRecorrenciaRemover={onRecorrenciaRemover}
                  onRenameTopico={onRenameTopico}
                  onDeleteTopico={onDeleteTopico}
                  onAvaliacaoChange={onAvaliacaoChange}
                  onDescricaoAdicionar={onDescricaoAdicionar}
                  onDescricaoEditar={onDescricaoEditar}
                  onDescricaoExcluir={onDescricaoExcluir}
                />
              ))}
            </div>
          )}

          {podeSubgrupo && (
            <button
              className="topico-add card-subgrupo-add"
              onClick={() => onAdicionarSubgrupo?.(id)}
            >
              <span className="topico-add-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              Adicionar {labelGrupoNivel2 || 'Subgrupo'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
