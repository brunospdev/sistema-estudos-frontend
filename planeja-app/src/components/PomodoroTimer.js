import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
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

function getUsuarioEmail() {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return u.email || '';
  } catch {
    return '';
  }
}

function getTimerStorageKey(email = getUsuarioEmail()) {
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

function coletarHeatmapLocal() {
  const dias = {};

  for (let i = 0; i < localStorage.length; i += 1) {
    const chave = localStorage.key(i);
    if (!chave || !chave.startsWith('planeja-pomodoro')) continue;

    try {
      const salvo = JSON.parse(localStorage.getItem(chave) || 'null');
      Object.assign(dias, normalizarHeatmap(salvo?.heatmapEstudo));
    } catch {
      /* ignora entradas inválidas */
    }
  }

  return dias;
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

export default function PomodoroTimer() {
  const storageKey = useMemo(() => getTimerStorageKey(), []);
  const estadoTimer = useMemo(() => carregarEstadoTimer(storageKey), [storageKey]);
  const sincronizadoRef = useRef(false);

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

  const corAtual = DURACOES_POR_TOM[statusVisual] || DURACOES_POR_TOM.parado;
  const heatmapDados = useMemo(() => prepararHeatmap(heatmapEstudo), [heatmapEstudo]);
  const getDuracaoModo = useCallback(
    (modoAtual) => {
      if (!duracoesPersonalizadas) return MODOS[modoAtual].segundos;
      return duracoesPersonalizadas[modoAtual] * 60;
    },
    [duracoesPersonalizadas]
  );

  useEffect(() => {
    const dados = { modo, segundosRestantes, mensagem };
    localStorage.setItem(storageKey, JSON.stringify(dados));
  }, [storageKey, modo, segundosRestantes, mensagem]);

  useEffect(() => {
    let ativo = true;

    async function carregarRemoto() {
      setCarregandoRemoto(true);
      try {
        const diasLocais = coletarHeatmapLocal();
        if (Object.keys(diasLocais).length > 0 && !sincronizadoRef.current) {
          await api.post('/estudo/heatmap/sync', { dias: diasLocais });
          sincronizadoRef.current = true;
        }

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
          setHeatmapEstudo(normalizarHeatmap(coletarHeatmapLocal()));
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

  async function registrarDiaEstudado() {
    const chaveHoje = chaveData();
    setHeatmapEstudo((atual) => ({
      ...atual,
      [chaveHoje]: (atual[chaveHoje] || 0) + 1,
    }));
    setCiclosConcluidos((valor) => valor + 1);

    try {
      const { data } = await api.post('/estudo/sessao');
      setHeatmapEstudo((atual) => ({
        ...atual,
        [data.data]: data.sessoes,
      }));
      setCiclosConcluidos(Number(data.ciclosConcluidos) || 0);
    } catch {
      /* mantém atualização otimista */
    }
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
            registrarDiaEstudado();
          }

          setRodando(false);
          setFinalizado(true);
          setMensagem('Tempo concluído');
          setStatusVisual('concluido');
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
    setRodando((valor) => {
      const novoValor = !valor;
      if (novoValor && finalizado) {
        setSegundosRestantes(getDuracaoModo(modo));
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

  return (
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
  );
}
