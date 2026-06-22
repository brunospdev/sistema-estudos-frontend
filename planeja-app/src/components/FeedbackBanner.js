import React, { useState } from 'react';
import './FeedbackBanner.css';

export default function FeedbackBanner({ feedback, onAcao }) {
  const [dispensado, setDispensado] = useState(false);

  if (!feedback || dispensado) return null;

  const mensagemPrincipal = feedback.mensagens?.[0];
  const meta = feedback.metaDiaria;
  const streak = feedback.streak;

  if (!mensagemPrincipal && !meta && !streak) return null;

  return (
    <div className="feedback-banner" role="status">
      <div className="feedback-banner-conteudo">
        {mensagemPrincipal && (
          <span className="feedback-banner-texto">{mensagemPrincipal.texto}</span>
        )}
        {meta && (
          <span className="feedback-banner-meta">
            Meta: {meta.realizadoMinutos}/{meta.metaMinutos} min
            <span className="feedback-banner-barra">
              <span
                className="feedback-banner-barra-fill"
                style={{ width: `${Math.min(100, meta.percentual || 0)}%` }}
              />
            </span>
          </span>
        )}
        {streak > 0 && (
          <span className="feedback-banner-streak">{streak} dia{streak === 1 ? '' : 's'} seguidos</span>
        )}
      </div>
      <div className="feedback-banner-acoes">
        {feedback.proximoSugerido && (
          <button
            type="button"
            className="feedback-banner-btn"
            onClick={() => onAcao?.(feedback.proximoSugerido)}
          >
            Estudar agora
          </button>
        )}
        <button
          type="button"
          className="feedback-banner-fechar"
          onClick={() => setDispensado(true)}
          aria-label="Fechar"
        >
          ×
        </button>
      </div>
    </div>
  );
}
