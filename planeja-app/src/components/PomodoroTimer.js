import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import ModalPosSessao from './ModalPosSessao';
import {
  todasDisciplinasComTopicos,
  flattenDisciplinas,
  isTipoEstudavel,
  nomeTopico,
  TIPOS_ITEM,
} from '../constants/statusEstudo';
import './PomodoroTimer.css';

const TIMER_STORAGE_PREFIX = 'planeja-pomodoro-timer';
const HEATMAP_DIAS = 84;

const MODOS = {
  foco: { label: 'Foco', segundos: 25 * 60, proximo: 'curto', tom: 'foco' },
  curto: { label: 'Pausa curta', segundos: 5 * 60, proximo: 'foco', tom: 'pausa-curta' },
  longo: { label: 'Pausa longa', segundos: 15 * 60, proximo: 'foco', tom: 'pausa-longa' },
};

const DURACOES_PADRAO = {
  foco: 25,
  curto: 5,
  longo: 15,
};

const DURACOES_POR_TOM = {
  foco: '#027A8F',
  'pausa-curta': '#F38F2B',
  'pausa-longa': '#1DC81D',
  concluido: '#1DC81D',
  parado: '#5C6067',
};

function formatarTempo(segundos) {
  const minutos = Math.floor(segundos / 60);
  const restante = segundos % 60;
  return `${String(minutos).padStart(2, '0')}:${String(restante).padStart(2, '0')}`;
}

function chaveData(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function dataComOffset(offsetDias) {
  const data = new Date();
  data.setDate(data.getDate() - offsetDias);
  return data;
}

function normalizarHeatmap(heatmap) {
  if (!heatmap || typeof heatmap !== 'object') return {};
  return Object.entries(heatmap).reduce((acc, [data, valor]) => {
    const quantidade = Number(valor);
    if (Number.isFinite(quantidade) && quantidade > 0) {
      acc[data] = quantidade;
    }
    return acc;
  }, {});
}

function prepararHeatmap(heatmap) {
  return Array.from({ length: HEATMAP_DIAS }, (_, index) => {
    const offset = HEATMAP_DIAS - 1 - index;
    const data = dataComOffset(offset);
    const chave = chaveData(data);
    const quantidade = heatmap[chave] || 0;
    return {
      chave,
      quantidade,
      titulo: `${data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} - ${quantidade} sessão(ões)`,
    };
  });
}

function nivelHeatmap(quantidade) {
  if (quantidade >= 5) return 4;
  if (quantidade >= 3) return 3;
  if (quantidade >= 2) return 2;
  if (quantidade >= 1) return 1;
  return 0;
}

function getTimerStorageKey(email = '') {
  return email ? `${TIMER_STORAGE_PREFIX}-${email}` : `${TIMER_STORAGE_PREFIX}-anon`;
}

function carregarEstadoTimer(storageKey) {
  try {
    const salvo = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (!salvo) return null;

    return {
      modo: MODOS[salvo.modo] ? salvo.modo : 'foco',
      segundosRestantes:
        Number.isFinite(salvo.segundosRestantes) && salvo.segundosRestantes > 0
          ? salvo.segundosRestantes
          : MODOS[salvo.modo] ? MODOS[salvo.modo].segundos : MODOS.foco.segundos,
      rodando: false,
      mensagem: typeof salvo.mensagem === 'string' ? salvo.mensagem : 'Pronto para começar',
    };
  } catch {
    return null;
  }
}

function normalizarDuracoes(duracoes) {
  return {
    foco:
      Number.isFinite(duracoes?.foco) && duracoes.foco > 0
        ? duracoes.foco
        : DURACOES_PADRAO.foco,
    curto:
      Number.isFinite(duracoes?.curto) && duracoes.curto > 0
        ? duracoes.curto
        : DURACOES_PADRAO.curto,
    longo:
      Number.isFinite(duracoes?.longo) && duracoes.longo > 0
        ? duracoes.longo
        : DURACOES_PADRAO.longo,
  };
}

export default function PomodoroTimer({
  userEmail = '',
  disciplinas = [],
  itemSelecionado = null,
  onItemChange,
  metaDiaria = null,
  streak = 0,
  onSessaoSalva,
}) {
  const storageKey = useMemo(() => getTimerStorageKey(userEmail), [userEmail]);
  const estadoTimer = useMemo(() => carregarEstadoTimer(storageKey), [storageKey]);

  const [modo, setModo] = useState(estadoTimer?.modo || 'foco');
  const [segundosRestantes, setSegundosRestantes] = useState(
    estadoTimer?.segundosRestantes || MODOS.foco.segundos
  );
  const [rodando, setRodando] = useState(false);
  const [ciclosConcluidos, setCiclosConcluidos] = useState(0);
  const [mensagem, setMensagem] = useState(estadoTimer?.mensagem || 'Pronto para começar');
  const [duracoesPersonalizadas, setDuracoesPersonalizadas] = useState(DURACOES_PADRAO);
  const [formDuracoes, setFormDuracoes] = useState(DURACOES_PADRAO);
  const [statusVisual, setStatusVisual] = useState('parado');
  const [finalizado, setFinalizado] = useState(false);
  const [heatmapEstudo, setHeatmapEstudo] = useState({});
  const [carregandoRemoto, setCarregandoRemoto] = useState(true);
  const [modalPosSessao, setModalPosSessao] = useState(false);
  const [sessaoInicio, setSessaoInicio] = useState(null);
  const [disciplinaPicker, setDisciplinaPicker] = useState('');
  const [topicoPicker, setTopicoPicker] = useState('');

  const corAtual = DURACOES_POR_TOM[statusVisual] || DURACOES_POR_TOM.parado;
  const heatmapDados = useMemo(() => prepararHeatmap(heatmapEstudo), [heatmapEstudo]);
  const getDuracaoModo = useCallback(
    (modoAtual) => {
      if (!duracoesPersonalizadas) return MODOS[modoAtual].segundos;
      return duracoesPersonalizadas[modoAtual] * 60;
    },
    [duracoesPersonalizadas]
  );

  const disciplinasFlat = useMemo(() => flattenDisciplinas(disciplinas), [disciplinas]);

  const topicosEstudaveis = useMemo(
    () => todasDisciplinasComTopicos(disciplinas).filter((t) => isTipoEstudavel(t.tipo)),
    [disciplinas]
  );

  const disciplinasComTopicos = useMemo(
    () => disciplinasFlat.filter((d) =>
      topicosEstudaveis.some((t) => t.disciplinaId === d.id)
    ),
    [disciplinasFlat, topicosEstudaveis]
  );

  const topicosDaDisciplina = useMemo(() => {
    return topicosEstudaveis.filter((t) => String(t.disciplinaId) === String(disciplinaPicker));
  }, [topicosEstudaveis, disciplinaPicker]);

  useEffect(() => {
    if (itemSelecionado?.disciplinaId) {
      setDisciplinaPicker(String(itemSelecionado.disciplinaId));
      setTopicoPicker(String(itemSelecionado.assuntoId || ''));
    }
  }, [itemSelecionado]);

  useEffect(() => {
    const dados = { modo, segundosRestantes, mensagem };
    localStorage.setItem(storageKey, JSON.stringify(dados));
  }, [storageKey, modo, segundosRestantes, mensagem]);

  useEffect(() => {
    let ativo = true;

    async function carregarRemoto() {
      setCarregandoRemoto(true);
      try {
        const { data } = await api.get('/estudo/pomodoro');
        if (!ativo) return;

        setHeatmapEstudo(normalizarHeatmap(data.heatmap));
        setCiclosConcluidos(Number(data.ciclosConcluidos) || 0);

        const duracoes = normalizarDuracoes(data.duracoes);
        setDuracoesPersonalizadas(duracoes);
        setFormDuracoes(duracoes);
        if (!estadoTimer) {
          setSegundosRestantes(duracoes.foco * 60);
        }
      } catch {
        if (ativo) {
          setMensagem('Não foi possível carregar o histórico da conta.');
        }
      } finally {
        if (ativo) setCarregandoRemoto(false);
      }
    }

    carregarRemoto();
    return () => {
      ativo = false;
    };
  }, [estadoTimer]);

  const duracaoFocoMinutos = useMemo(
    () => Math.round(getDuracaoModo('foco') / 60),
    [getDuracaoModo]
  );

  async function registrarSessao(payloadExtra = {}) {
    const fimEm = new Date();
    const inicioEm = sessaoInicio || new Date(fimEm.getTime() - getDuracaoModo('foco') * 1000);
    const assuntoId = topicoPicker ? Number(topicoPicker) : itemSelecionado?.assuntoId || null;
    const disciplinaId = disciplinaPicker
      ? Number(disciplinaPicker)
      : itemSelecionado?.disciplinaId || null;

    const body = {
      assuntoId,
      disciplinaId,
      inicioEm: inicioEm.toISOString(),
      fimEm: fimEm.toISOString(),
      ...payloadExtra,
    };

    const chaveHoje = chaveData();
    setHeatmapEstudo((atual) => ({
      ...atual,
      [chaveHoje]: (atual[chaveHoje] || 0) + 1,
    }));
    setCiclosConcluidos((valor) => valor + 1);

    try {
      const { data } = await api.post('/estudo/sessao', body);
      if (data?.data) {
        setHeatmapEstudo((atual) => ({
          ...atual,
          [data.data]: data.sessoes,
        }));
      }
      if (data?.ciclosConcluidos != null) {
        setCiclosConcluidos(Number(data.ciclosConcluidos));
      }
      onSessaoSalva?.();
    } catch {
      /* mantém atualização otimista */
    }
  }

  function concluirCicloFoco() {
    setRodando(false);
    setFinalizado(true);
    setMensagem('Tempo concluído');
    setStatusVisual('concluido');
    setSessaoInicio(new Date(Date.now() - getDuracaoModo('foco') * 1000));
    setModalPosSessao(true);
  }

  useEffect(() => {
    if (finalizado) {
      setStatusVisual('concluido');
      return;
    }

    if (rodando) {
      setStatusVisual(MODOS[modo]?.tom || 'parado');
      return;
    }

    setStatusVisual('parado');
  }, [rodando, modo, finalizado]);

  useEffect(() => {
    if (!rodando) return undefined;

    const intervalo = window.setInterval(() => {
      setSegundosRestantes((atual) => {
        if (atual <= 1) {
          if (modo === 'foco') {
            concluirCicloFoco();
          } else {
            setRodando(false);
            setFinalizado(true);
            setMensagem('Tempo concluído');
            setStatusVisual('concluido');
          }
          return 0;
        }

        return atual - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalo);
  }, [rodando, modo, getDuracaoModo]);

  function selecionarModo(novoModo) {
    setModo(novoModo);
    setSegundosRestantes(getDuracaoModo(novoModo));
    setRodando(false);
    setFinalizado(false);
    setStatusVisual('parado');
    setMensagem(`Modo ${MODOS[novoModo].label.toLowerCase()} selecionado`);
  }

  function alternarExecucao() {
    if (!rodando && modo === 'foco' && !finalizado) {
      setSessaoInicio(new Date());
    }
    setRodando((valor) => {
      const novoValor = !valor;
      if (novoValor && finalizado) {
        setSegundosRestantes(getDuracaoModo(modo));
        setSessaoInicio(new Date());
      }
      if (novoValor) setFinalizado(false);
      setStatusVisual(novoValor ? MODOS[modo]?.tom || 'parado' : 'parado');
      setMensagem(novoValor ? 'Cronômetro em execução' : 'Cronômetro pausado');
      return novoValor;
    });
  }

  function reiniciar() {
    setRodando(false);
    setFinalizado(false);
    setModo('foco');
    setSegundosRestantes(getDuracaoModo('foco'));
    setMensagem('Pronto para começar');
    setStatusVisual('parado');
    setSessaoInicio(null);
  }

  async function aplicarPersonalizacao() {
    const normalizado = {
      foco: Math.max(1, Number(formDuracoes.foco) || DURACOES_PADRAO.foco),
      curto: Math.max(1, Number(formDuracoes.curto) || DURACOES_PADRAO.curto),
      longo: Math.max(1, Number(formDuracoes.longo) || DURACOES_PADRAO.longo),
    };

    setDuracoesPersonalizadas(normalizado);
    setFormDuracoes(normalizado);
    setSegundosRestantes(normalizado[modo] * 60);
    setMensagem('Tempos personalizados aplicados');
    setFinalizado(false);
    setStatusVisual('parado');
    setRodando(false);

    try {
      const { data } = await api.put('/estudo/pomodoro/config', normalizado);
      const duracoes = normalizarDuracoes(data.duracoes);
      setDuracoesPersonalizadas(duracoes);
      setFormDuracoes(duracoes);
      setHeatmapEstudo(normalizarHeatmap(data.heatmap));
      setCiclosConcluidos(Number(data.ciclosConcluidos) || 0);
    } catch {
      setMensagem('Tempos aplicados localmente; falha ao sincronizar com a conta');
    }
  }

  function handleDisciplinaChange(e) {
    setDisciplinaPicker(e.target.value);
    setTopicoPicker('');
    onItemChange?.(null);
  }

  function handleTopicoChange(e) {
    const topicoId = e.target.value;
    setTopicoPicker(topicoId);
    const topico = topicosEstudaveis.find((t) => String(t.id) === topicoId);
    if (topico) {
      onItemChange?.({
        assuntoId: topico.id,
        disciplinaId: topico.disciplinaId,
        nome: nomeTopico(topico),
        disciplinaNome: topico.disciplinaNome,
      });
    }
  }

  const itemModal = useMemo(() => {
    if (itemSelecionado) return itemSelecionado;
    const topico = topicosEstudaveis.find((t) => String(t.id) === topicoPicker);
    if (topico) {
      return {
        assuntoId: topico.id,
        disciplinaId: topico.disciplinaId,
        nome: nomeTopico(topico),
        disciplinaNome: topico.disciplinaNome,
      };
    }
    return null;
  }, [itemSelecionado, topicosEstudaveis, topicoPicker]);

  async function fecharModalPosSessao() {
    setModalPosSessao(false);
    setSegundosRestantes(getDuracaoModo(modo));
    setFinalizado(false);
    setMensagem('Pronto para o próximo ciclo');
    setStatusVisual('parado');
  }

  return (
    <>
      <section className={`pomodoro-card pomodoro-${statusVisual}`} aria-label="Cronômetro pomodoro">
        <div className="pomodoro-topo">
          <div>
            <div className="pomodoro-tag">Pomodoro</div>
            <div className="pomodoro-dica">
              {carregandoRemoto
                ? 'Sincronizando histórico da sua conta...'
                : 'Foco por blocos curtos e pausas automáticas.'}
            </div>
          </div>
          <div className="pomodoro-status">
            <div>{rodando ? 'Executando' : 'Pausado'}</div>
            <div>{ciclosConcluidos} foco{ciclosConcluidos === 1 ? '' : 's'} concluído{ciclosConcluidos === 1 ? '' : 's'}</div>
          </div>
        </div>

        <div className="pomodoro-picker">
          <label className="pomodoro-picker-campo">
            <span>Matéria</span>
            <select value={disciplinaPicker} onChange={handleDisciplinaChange} disabled={rodando}>
              <option value="">Sessão livre</option>
              {disciplinasComTopicos.map((d) => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </label>
          {disciplinaPicker && (
            <label className="pomodoro-picker-campo">
              <span>Tópico</span>
              <select value={topicoPicker} onChange={handleTopicoChange} disabled={rodando}>
                <option value="">Selecione...</option>
                {topicosDaDisciplina.map((t) => (
                  <option key={t.id} value={t.id}>
                    {nomeTopico(t)}{t.tipo && t.tipo !== 'CONTEUDO' ? ` (${TIPOS_ITEM[t.tipo] || t.tipo})` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {(metaDiaria || streak > 0) && (
          <div className="pomodoro-meta-streak">
            {metaDiaria && (
              <div className="pomodoro-meta">
                Meta hoje: {metaDiaria.realizadoMinutos}/{metaDiaria.metaMinutos} min
                <span className="pomodoro-meta-barra">
                  <span
                    className="pomodoro-meta-fill"
                    style={{ width: `${Math.min(100, metaDiaria.percentual || 0)}%` }}
                  />
                </span>
              </div>
            )}
            {streak > 0 && (
              <div className="pomodoro-streak">{streak} dia{streak === 1 ? '' : 's'} seguidos</div>
            )}
          </div>
        )}

        <div className="pomodoro-conteudo">
          <div className="pomodoro-relogio">
            <div>
              <div className="pomodoro-tempo" style={{ color: corAtual }}>{formatarTempo(segundosRestantes)}</div>
              <div className="pomodoro-subtitulo">{MODOS[modo].label}</div>
              <div className="pomodoro-minutos">{Math.ceil(segundosRestantes / 60)} minuto{Math.ceil(segundosRestantes / 60) === 1 ? '' : 's'} restantes</div>
            </div>
          </div>

          <div className="pomodoro-info">
            <div className="pomodoro-modo" role="tablist" aria-label="Modos do pomodoro">
              {Object.entries(MODOS).map(([chave, valor]) => (
                <button
                  key={chave}
                  type="button"
                  className={`pomodoro-modo-btn ${modo === chave ? 'ativo' : ''}`}
                  onClick={() => selecionarModo(chave)}
                >
                  {valor.label}
                </button>
              ))}
            </div>

            <div className="pomodoro-personalizacao">
              <div className="pomodoro-personalizacao-titulo">Tempos personalizados</div>
              <div className="pomodoro-campos">
                <label className="pomodoro-campo">
                  <span>Foco (min)</span>
                  <input
                    type="number"
                    min="1"
                    value={formDuracoes.foco}
                    onChange={(e) =>
                      setFormDuracoes((prev) => ({ ...prev, foco: e.target.value }))
                    }
                  />
                </label>
                <label className="pomodoro-campo">
                  <span>Pausa curta</span>
                  <input
                    type="number"
                    min="1"
                    value={formDuracoes.curto}
                    onChange={(e) =>
                      setFormDuracoes((prev) => ({ ...prev, curto: e.target.value }))
                    }
                  />
                </label>
                <label className="pomodoro-campo">
                  <span>Pausa longa</span>
                  <input
                    type="number"
                    min="1"
                    value={formDuracoes.longo}
                    onChange={(e) =>
                      setFormDuracoes((prev) => ({ ...prev, longo: e.target.value }))
                    }
                  />
                </label>
              </div>

              <button type="button" className="pomodoro-aplicar" onClick={aplicarPersonalizacao}>
                Aplicar tempos
              </button>
            </div>

            <div className="pomodoro-acoes">
              <button
                type="button"
                className="pomodoro-acao pomodoro-acao-principal"
                onClick={alternarExecucao}
              >
                {rodando ? 'Pausar' : 'Iniciar'}
              </button>
              <button
                type="button"
                className="pomodoro-acao pomodoro-acao-secundaria"
                onClick={reiniciar}
              >
                Reiniciar
              </button>
            </div>

            <div className="pomodoro-dica" style={{ color: corAtual }}>{mensagem}</div>
          </div>
        </div>

        <div className="pomodoro-heatmap">
          <div className="pomodoro-heatmap-topo">
            <div className="pomodoro-heatmap-titulo">Heatmap de estudo</div>
            <div className="pomodoro-heatmap-legenda">
              <span>Menos</span>
              <span className="heatmap-legenda-swatch nivel-0" />
              <span className="heatmap-legenda-swatch nivel-1" />
              <span className="heatmap-legenda-swatch nivel-2" />
              <span className="heatmap-legenda-swatch nivel-3" />
              <span className="heatmap-legenda-swatch nivel-4" />
              <span>Mais</span>
            </div>
          </div>

          <div className="pomodoro-heatmap-grid" aria-label="Dias de estudo dos últimos 84 dias">
            {heatmapDados.map((dia) => {
              const nivel = nivelHeatmap(dia.quantidade);
              return (
                <span
                  key={dia.chave}
                  className={`heatmap-cell nivel-${nivel}`}
                  title={dia.titulo}
                  aria-label={dia.titulo}
                />
              );
            })}
          </div>
        </div>
      </section>

      <ModalPosSessao
        aberto={modalPosSessao}
        duracaoMinutos={duracaoFocoMinutos}
        itemSelecionado={itemModal}
        onFechar={fecharModalPosSessao}
        onSalvar={async (payload) => {
          await registrarSessao(payload);
          await fecharModalPosSessao();
        }}
        onPular={async () => {
          await registrarSessao({});
          await fecharModalPosSessao();
        }}
      />
    </>
  );
}
