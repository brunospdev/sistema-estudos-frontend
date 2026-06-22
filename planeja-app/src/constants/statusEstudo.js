export const STATUS_ESTUDO = {
  NAO_INICIADO: 'NAO_INICIADO',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  REVISANDO: 'REVISANDO',
  DOMINADO: 'DOMINADO',
};

export const STATUS_LABELS = {
  NAO_INICIADO: 'Não iniciado',
  EM_ANDAMENTO: 'Em andamento',
  REVISANDO: 'Revisando',
  DOMINADO: 'Dominado',
};

export const STATUS_CORES = {
  NAO_INICIADO: '#848484',
  EM_ANDAMENTO: '#027A8F',
  REVISANDO: '#F38F2B',
  DOMINADO: '#1DC81D',
};

export const TIPOS_ITEM = {
  CONTEUDO: 'Conteúdo',
  REVISAO: 'Revisão',
  PRATICA: 'Prática',
  SIMULADO: 'Simulado',
  PROVA: 'Prova',
  ATIVIDADE: 'Atividade',
  ENTREGA: 'Entrega',
  PRESENCIAL: 'Presencial',
  OUTRO: 'Outro',
};

export const TIPOS_ESTUDAVEIS = ['CONTEUDO', 'REVISAO', 'PRATICA'];
export const TIPOS_COM_NOTA = ['SIMULADO', 'PROVA', 'ATIVIDADE'];
export const TIPOS_COM_ENTREGA = ['SIMULADO', 'PROVA', 'ATIVIDADE', 'ENTREGA', 'PRATICA'];
export const TIPOS_EVENTO = ['SIMULADO', 'PROVA', 'ATIVIDADE', 'ENTREGA', 'PRESENCIAL', 'OUTRO'];

export const CORES_EVENTO = {
  SIMULADO: '#9B59B6',
  PROVA: '#E74C3C',
  ATIVIDADE: '#F38F2B',
  ENTREGA: '#2980B9',
  PRESENCIAL: '#16A085',
  OUTRO: '#848484',
};

export const PRESETS_PERSONA = {
  FACULDADE: {
    label: 'Faculdade',
    labelGrupo: 'Disciplina',
    labelGrupoNivel2: '',
    labelItem: 'Assunto',
    profundidadeGrupos: 1,
    presetPersona: 'FACULDADE',
  },
  ENEM_AREAS: {
    label: 'ENEM — Áreas',
    labelGrupo: 'Área',
    labelGrupoNivel2: 'Matéria',
    labelItem: 'Assunto',
    profundidadeGrupos: 2,
    presetPersona: 'ENEM_AREAS',
  },
  ENEM_MATERIAS: {
    label: 'ENEM — Matérias',
    labelGrupo: 'Matéria',
    labelGrupoNivel2: '',
    labelItem: 'Assunto',
    profundidadeGrupos: 1,
    presetPersona: 'ENEM_MATERIAS',
  },
  LIVRE: {
    label: 'Livre',
    labelGrupo: 'Matéria',
    labelGrupoNivel2: '',
    labelItem: 'Tópico',
    profundidadeGrupos: 1,
    presetPersona: 'LIVRE',
  },
};

export const TIPOS_MARCO = {
  PROVA: 'Prova',
  SIMULADO: 'Simulado',
  ENTREGA: 'Entrega',
  PRAZO: 'Prazo',
  EVENTO: 'Evento',
  OUTRO: 'Outro',
};

export const DIFICULDADES = {
  FACIL: 'Fácil',
  MEDIO: 'Médio',
  DIFICIL: 'Difícil',
};

export function normalizarStatus(topico) {
  if (topico?.status && STATUS_LABELS[topico.status]) return topico.status;
  if (topico?.concluido) return STATUS_ESTUDO.DOMINADO;
  return STATUS_ESTUDO.NAO_INICIADO;
}

export function nomeTopico(topico) {
  return topico?.nome || topico?.titulo || '';
}

export function isTipoEstudavel(tipo) {
  return TIPOS_ESTUDAVEIS.includes(tipo || 'CONTEUDO');
}

export function isTipoComNota(tipo) {
  return TIPOS_COM_NOTA.includes(tipo);
}

export function isTipoComEntrega(tipo) {
  return TIPOS_COM_ENTREGA.includes(tipo);
}

export function isTipoEvento(tipo) {
  return TIPOS_EVENTO.includes(tipo);
}

export function eventoConcluido(topico) {
  return Boolean(topico?.entregaConcluida);
}

export function particionarTopicos(topicos = []) {
  const conteudo = [];
  const eventosPendentes = [];
  const eventosConcluidos = [];

  topicos.forEach((t) => {
    if (isTipoEvento(t.tipo)) {
      if (eventoConcluido(t)) eventosConcluidos.push(t);
      else eventosPendentes.push(t);
    } else {
      conteudo.push(t);
    }
  });

  return { conteudo, eventosPendentes, eventosConcluidos };
}

export function exigeNotaParaConcluir(tipo) {
  return tipo === 'SIMULADO' || tipo === 'PROVA';
}

export function flattenTopicos(disciplina) {
  const result = [];
  function addTopico(t) {
    result.push({
      ...t,
      nome: nomeTopico(t),
      disciplinaId: disciplina.id,
      disciplinaNome: disciplina.nome,
    });
    (t.subitens || []).forEach(addTopico);
  }
  (disciplina.topicos || []).forEach(addTopico);
  return result;
}

export function flattenDisciplinas(disciplinas) {
  const all = [];
  function walk(d) {
    all.push(d);
    (d.subgrupos || []).forEach(walk);
  }
  (disciplinas || []).forEach(walk);
  return all;
}

export function todasDisciplinasComTopicos(disciplinas) {
  return flattenDisciplinas(disciplinas).flatMap((d) => flattenTopicos(d));
}

export function formatarDataISO(data) {
  if (!data) return '';
  const d = new Date(`${data}T12:00:00`);
  if (Number.isNaN(d.getTime())) return data;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function formatarNota(nota, notaMaxima) {
  if (nota == null || nota === '') return '—';
  const max = notaMaxima != null ? `/${notaMaxima}` : '';
  return `${nota}${max}`;
}
