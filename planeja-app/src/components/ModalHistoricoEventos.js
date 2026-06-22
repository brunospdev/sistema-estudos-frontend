import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import {
  TIPOS_ITEM,
  CORES_EVENTO,
  formatarDataISO,
  formatarNota,
} from '../constants/statusEstudo';
import './ModalHistoricoEventos.css';

const FILTROS = [
  { id: 'nota', label: 'Com nota' },
  { id: 'concluidos', label: 'Concluídos' },
  { id: 'todos', label: 'Todos' },
];

export default function ModalHistoricoEventos({ aberto, onFechar }) {
  const [filtro, setFiltro] = useState('nota');
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    async function carregar() {
      setCarregando(true);
      try {
        const { data } = await api.get('/eventos', { params: { filtro } });
        setEventos(Array.isArray(data) ? data : []);
      } catch {
        setEventos([]);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [aberto, filtro]);

  if (!aberto) return null;

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onFechar();
  }

  return createPortal(
    <div className="historico-overlay" onClick={handleOverlayClick}>
      <div className="historico-box" role="dialog" aria-modal="true">
        <button className="historico-fechar" onClick={onFechar} aria-label="Fechar">×</button>
        <h2 className="historico-titulo">Histórico de eventos</h2>
        <p className="historico-subtitulo">Provas, simulados, entregas e outros eventos registrados</p>

        <div className="historico-filtros">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`historico-filtro${filtro === f.id ? ' ativo' : ''}`}
              onClick={() => setFiltro(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="historico-lista">
          {carregando ? (
            <p className="historico-vazio">Carregando...</p>
          ) : eventos.length === 0 ? (
            <p className="historico-vazio">Nenhum evento encontrado neste filtro.</p>
          ) : (
            eventos.map((ev) => {
              const cor = CORES_EVENTO[ev.tipo] || CORES_EVENTO.OUTRO;
              return (
                <article
                  key={ev.id}
                  className={`historico-item${ev.concluido ? ' concluido' : ''}`}
                  style={{ '--evento-cor': cor }}
                >
                  <div className="historico-item-topo">
                    <span className="historico-tipo">{TIPOS_ITEM[ev.tipo] || ev.tipo}</span>
                    {ev.concluido && <span className="historico-concluido">Concluído</span>}
                  </div>
                  <div className="historico-item-nome">{ev.nome}</div>
                  <div className="historico-item-meta">
                    <span>{ev.disciplinaNome}</span>
                    {(ev.dataRealizada || ev.dataEntrega) && (
                      <span>
                        {ev.dataRealizada
                          ? formatarDataISO(ev.dataRealizada)
                          : formatarDataISO(ev.dataEntrega)}
                      </span>
                    )}
                    {ev.nota != null && (
                      <span className="historico-nota">{formatarNota(ev.nota, ev.notaMaxima)}</span>
                    )}
                  </div>
                  {ev.descricoes?.length > 0 && (
                    <ul className="historico-descricoes">
                      {ev.descricoes.map((texto, index) => (
                        <li key={index} className="historico-descricao">{texto}</li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
