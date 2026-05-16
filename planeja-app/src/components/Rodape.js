import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Rodape.css';

export default function Rodape({ pendentes, onNovaDisciplina, onVerPendentes }) {
  const navigate = useNavigate();

  return (
    <div className="rodape-wrapper">
      {pendentes > 0 && (
        <button className="pill-pendentes" onClick={onVerPendentes}>
          <span className="pill-pendentes-icon">⚙</span>
          <span className="pill-pendentes-texto">
            {pendentes} {pendentes === 1 ? 'pendente' : 'pendentes'}
          </span>
        </button>
      )}

      <div className="pill-acoes">
        <button
          className="pill-btn-mais"
          onClick={onNovaDisciplina}
          aria-label="Nova disciplina"
          title="Nova disciplina"
        >
          +
        </button>
        <button
          className="pill-btn pill-btn-engrenagem"
          onClick={() => navigate('/perfil')}
          aria-label="Configurações / Perfil"
          title="Perfil"
        >
          ⚙
        </button>
      </div>
    </div>
  );
}
