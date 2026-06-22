export const FREQUENCIAS_RECORRENCIA = {
  DIARIA: 'Diariamente',
  SEMANAL: 'Semanalmente',
  QUINZENAL: 'Quinzenalmente',
  MENSAL: 'Mensalmente',
  PERSONALIZADA: 'Personalizado (dias)',
};

export const DIAS_SEMANA_RECORRENCIA = [
  { valor: 1, label: 'Seg' },
  { valor: 2, label: 'Ter' },
  { valor: 3, label: 'Qua' },
  { valor: 4, label: 'Qui' },
  { valor: 5, label: 'Sex' },
  { valor: 6, label: 'Sáb' },
  { valor: 7, label: 'Dom' },
];

function diaSemanaFromDate(dataReferencia) {
  if (!dataReferencia) return [1];
  const d = new Date(`${dataReferencia}T12:00:00`);
  const jsDay = d.getDay();
  return [jsDay === 0 ? 7 : jsDay];
}

export function recorrenciaPadrao(dataReferencia) {
  return {
    frequencia: 'SEMANAL',
    intervalo: 1,
    diasSemana: diaSemanaFromDate(dataReferencia),
    dataFim: '',
    maxOcorrencias: 10,
  };
}

export function recorrenciaFromApi(recorrencia, dataReferencia) {
  if (!recorrencia) return recorrenciaPadrao(dataReferencia);
  return {
    frequencia: recorrencia.frequencia || 'SEMANAL',
    intervalo: recorrencia.intervalo || 1,
    diasSemana: recorrencia.diasSemana?.length ? recorrencia.diasSemana : diaSemanaFromDate(dataReferencia),
    dataFim: recorrencia.dataFim || '',
    maxOcorrencias: recorrencia.maxOcorrencias || 10,
  };
}

export function normalizarIntervalo(valor, minimo = 1, maximo = 365) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return minimo;
  return Math.min(maximo, Math.max(minimo, Math.trunc(n)));
}

export function normalizarOcorrencias(valor) {
  return normalizarIntervalo(valor, 2, 365);
}

export function recorrenciaToPayload(config, dataReferencia, tipoFim) {
  return {
    frequencia: config.frequencia,
    intervalo: normalizarIntervalo(config.intervalo),
    diasSemana: config.frequencia === 'SEMANAL' ? config.diasSemana : undefined,
    dataInicio: dataReferencia,
    dataFim: tipoFim === 'data' && config.dataFim ? config.dataFim : null,
    maxOcorrencias: tipoFim === 'ocorrencias' ? normalizarOcorrencias(config.maxOcorrencias) : null,
  };
}

export function resumirRecorrencia(config) {
  if (!config) return 'Não repetir';

  const freq = FREQUENCIAS_RECORRENCIA[config.frequencia] || config.frequencia;
  const intervalo = normalizarIntervalo(config.intervalo);

  if (config.frequencia === 'PERSONALIZADA') {
    return `A cada ${intervalo} dia${intervalo > 1 ? 's' : ''}`;
  }

  if (config.frequencia === 'SEMANAL') {
    const dias = (config.diasSemana || [])
      .map((d) => DIAS_SEMANA_RECORRENCIA.find((x) => x.valor === d)?.label)
      .filter(Boolean)
      .join(', ');
    const intervaloLabel = intervalo > 1 ? ` (${intervalo} sem.)` : '';
    return `${freq}${intervaloLabel}${dias ? ` · ${dias}` : ''}`;
  }

  if (config.frequencia === 'MENSAL' && intervalo > 1) {
    return `A cada ${intervalo} meses`;
  }

  return freq;
}

export function temRecorrencia(topico) {
  return Boolean(topico?.recorrencia?.ativa || topico?.recorrencia?.id);
}
