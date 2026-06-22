import React, { useState, useEffect } from 'react';
import {
  FREQUENCIAS_RECORRENCIA,
  DIAS_SEMANA_RECORRENCIA,
  recorrenciaPadrao,
  resumirRecorrencia,
  recorrenciaFromApi,
  recorrenciaToPayload,
  normalizarIntervalo,
  normalizarOcorrencias,
} from '../constants/recorrencia';
import './ModalDisciplina.css';
import './ModalRecorrencia.css';

export default function ModalRecorrencia({
  aberto,
  onFechar,
  onConfirmar,
  onRemover,
  dataReferencia,
  recorrenciaInicial = null,
  titulo = 'Repetir evento',
}) {
  const [config, setConfig] = useState(recorrenciaPadrao(dataReferencia));
  const [tipoFim, setTipoFim] = useState('semFim');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!aberto) return;

    if (recorrenciaInicial) {
      const parsed = recorrenciaFromApi(recorrenciaInicial, dataReferencia);
      setConfig(parsed);
      if (parsed.maxOcorrencias) setTipoFim('ocorrencias');
      else if (parsed.dataFim) setTipoFim('data');
      else setTipoFim('semFim');
    } else {
      setConfig(recorrenciaPadrao(dataReferencia));
      setTipoFim('semFim');
    }
    setCarregando(false);
  }, [aberto, recorrenciaInicial, dataReferencia]);

  function handleIntervaloChange(valor) {
    if (valor === '' || /^\d+$/.test(valor)) {
      setConfig((prev) => ({ ...prev, intervalo: valor }));
    }
  }

  function handleIntervaloBlur() {
    setConfig((prev) => ({
      ...prev,
      intervalo: normalizarIntervalo(prev.intervalo),
    }));
  }

  function handleOcorrenciasChange(valor) {
    if (valor === '' || /^\d+$/.test(valor)) {
      setConfig((prev) => ({ ...prev, maxOcorrencias: valor }));
    }
  }

  function handleOcorrenciasBlur() {
    setConfig((prev) => ({
      ...prev,
      maxOcorrencias: normalizarOcorrencias(prev.maxOcorrencias),
    }));
  }

  function toggleDiaSemana(dia) {
    setConfig((prev) => {
      const dias = prev.diasSemana.includes(dia)
        ? prev.diasSemana.filter((d) => d !== dia)
        : [...prev.diasSemana, dia].sort((a, b) => a - b);
      return { ...prev, diasSemana: dias.length ? dias : [dia] };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!dataReferencia) return;
    setCarregando(true);
    try {
      const payload = recorrenciaToPayload(config, dataReferencia, tipoFim);
      await onConfirmar?.(payload);
      onFechar();
    } finally {
      setCarregando(false);
    }
  }

  async function handleRemover() {
    if (!onRemover) return;
    setCarregando(true);
    try {
      await onRemover();
      onFechar();
    } finally {
      setCarregando(false);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onFechar();
  }

  if (!aberto) return null;

  const resumo = resumirRecorrencia(config);
  const intervaloInvalido = config.intervalo === '' || Number(config.intervalo) < 1;
  const ocorrenciasInvalidas = tipoFim === 'ocorrencias'
    && (config.maxOcorrencias === '' || Number(config.maxOcorrencias) < 2);

  return (
    <div className="modal-overlay modal-recorrencia-overlay" onClick={handleOverlayClick}>
      <div className="modal-box modal-recorrencia-box" role="dialog" aria-modal="true">
        <button className="modal-fechar" onClick={onFechar} aria-label="Fechar">×</button>
        <h2 className="modal-titulo">{titulo}</h2>
        <p className="modal-subtitulo">
          Configure com que frequência este item deve se repetir.
        </p>

        {!dataReferencia && (
          <p className="modal-recorrencia-resumo" style={{ color: '#c0392b' }}>
            Informe uma data antes de configurar a recorrência.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-recorrencia-campo">
            <label className="modal-label" htmlFor="rec-frequencia">Frequência</label>
            <select
              id="rec-frequencia"
              className="modal-input"
              value={config.frequencia}
              onChange={(e) => setConfig((prev) => ({ ...prev, frequencia: e.target.value }))}
            >
              {Object.entries(FREQUENCIAS_RECORRENCIA).map(([valor, label]) => (
                <option key={valor} value={valor}>{label}</option>
              ))}
            </select>
          </div>

          {(config.frequencia === 'PERSONALIZADA' || config.frequencia === 'SEMANAL' || config.frequencia === 'MENSAL') && (
            <div className="modal-recorrencia-campo">
              <label className="modal-label" htmlFor="rec-intervalo">
                {config.frequencia === 'PERSONALIZADA' && 'Repetir a cada (dias)'}
                {config.frequencia === 'SEMANAL' && 'A cada quantas semanas'}
                {config.frequencia === 'MENSAL' && 'A cada quantos meses'}
              </label>
              <input
                id="rec-intervalo"
                className="modal-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={config.intervalo}
                onChange={(e) => handleIntervaloChange(e.target.value)}
                onBlur={handleIntervaloBlur}
              />
            </div>
          )}

          {config.frequencia === 'SEMANAL' && (
            <div className="modal-recorrencia-campo">
              <span className="modal-label">Dias da semana</span>
              <div className="modal-recorrencia-dias">
                {DIAS_SEMANA_RECORRENCIA.map(({ valor, label }) => (
                  <button
                    key={valor}
                    type="button"
                    className={`modal-recorrencia-dia${config.diasSemana.includes(valor) ? ' ativo' : ''}`}
                    onClick={() => toggleDiaSemana(valor)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="modal-recorrencia-campo">
            <span className="modal-label">Terminar</span>
            <div className="modal-recorrencia-fim-opcoes">
              <label className="modal-recorrencia-fim-opcao">
                <input
                  type="radio"
                  name="tipoFim"
                  value="semFim"
                  checked={tipoFim === 'semFim'}
                  onChange={() => setTipoFim('semFim')}
                />
                Sem data final (próximo ano)
              </label>
              <label className="modal-recorrencia-fim-opcao">
                <input
                  type="radio"
                  name="tipoFim"
                  value="data"
                  checked={tipoFim === 'data'}
                  onChange={() => setTipoFim('data')}
                />
                Em
                <input
                  className="modal-input"
                  type="date"
                  value={config.dataFim || ''}
                  disabled={tipoFim !== 'data'}
                  onChange={(e) => setConfig((prev) => ({ ...prev, dataFim: e.target.value }))}
                />
              </label>
              <label className="modal-recorrencia-fim-opcao">
                <input
                  type="radio"
                  name="tipoFim"
                  value="ocorrencias"
                  checked={tipoFim === 'ocorrencias'}
                  onChange={() => setTipoFim('ocorrencias')}
                />
                Após
                <input
                  className="modal-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={config.maxOcorrencias ?? 10}
                  disabled={tipoFim !== 'ocorrencias'}
                  onChange={(e) => handleOcorrenciasChange(e.target.value)}
                  onBlur={handleOcorrenciasBlur}
                />
                ocorrências
              </label>
            </div>
          </div>

          {dataReferencia && (
            <p className="modal-recorrencia-resumo">Prévia: {resumo}</p>
          )}

          <div className="modal-recorrencia-acoes">
            {recorrenciaInicial && onRemover && (
              <button
                type="button"
                className="modal-recorrencia-btn-secundario modal-recorrencia-btn-remover"
                onClick={handleRemover}
                disabled={carregando}
              >
                Remover
              </button>
            )}
            <button
              type="button"
              className="modal-recorrencia-btn-secundario"
              onClick={onFechar}
              disabled={carregando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="modal-btn-adicionar"
              disabled={carregando || !dataReferencia || intervaloInvalido || ocorrenciasInvalidas}
            >
              {carregando ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RecorrenciaTrigger({ recorrencia, dataReferencia, onClick, label = 'Repetir' }) {
  const ativo = Boolean(recorrencia);
  const resumo = ativo ? resumirRecorrencia(recorrenciaFromApi(recorrencia, dataReferencia)) : 'Configurar repetição';

  return (
    <button
      type="button"
      className={`recorrencia-trigger${ativo ? ' ativo' : ''}`}
      onClick={onClick}
      disabled={!dataReferencia}
      title={!dataReferencia ? 'Informe uma data primeiro' : undefined}
    >
      <span>
        <span className="recorrencia-trigger-label">{label}</span>
        <span className="recorrencia-trigger-resumo"> · {resumo}</span>
      </span>
      <span aria-hidden="true">↻</span>
    </button>
  );
}
