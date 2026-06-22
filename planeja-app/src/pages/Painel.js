import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../auth/AuthContext';
import CardDisciplina from '../components/CardDisciplina';
import '../components/CardDisciplina.css';
import TopicoItem from '../components/TopicoItem';
import ModalDisciplina from '../components/ModalDisciplina';
import ModalPendentes from '../components/ModalPendentes';
import ModalHistoricoEventos from '../components/ModalHistoricoEventos';
import BlocoHoje from '../components/BlocoHoje';
import FeedbackBanner from '../components/FeedbackBanner';
import Rodape from '../components/Rodape';
import PomodoroTimer from '../components/PomodoroTimer';
import LogoSvg from '../assets/logo.svg';
import { STATUS_ESTUDO, normalizarStatus, todasDisciplinasComTopicos, nomeTopico, isTipoEvento, isTipoComEntrega } from '../constants/statusEstudo';
import './Painel.css';

const DIAS = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const PREFERENCIAS_PADRAO = {
  layoutMode: 'GRUPO_TOPICO',
  labelGrupo: 'Matéria',
  labelItem: 'Tópico',
  labelGrupoNivel2: '',
  profundidadeGrupos: 1,
  presetPersona: null,
  metaHorasDiarias: null,
};

function dataFormatada() {
  const d = new Date();
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

function nomeUsuario(user) {
  return user?.nome || 'Estudante';
}

function atualizarTopicoNaLista(disciplinas, disciplinaId, topicoId, patch) {
  function patchTopicos(topicos) {
    return (topicos || []).map((t) => {
      if (t.id === topicoId) return { ...t, ...patch };
      if (t.subitens?.length) return { ...t, subitens: patchTopicos(t.subitens) };
      return t;
    });
  }
  function patchDisciplina(d) {
    if (d.id === disciplinaId) {
      return { ...d, topicos: patchTopicos(d.topicos) };
    }
    if (d.subgrupos?.length) {
      return { ...d, subgrupos: d.subgrupos.map(patchDisciplina) };
    }
    return d;
  }
  return disciplinas.map(patchDisciplina);
}

function atualizarDescricoesNaLista(disciplinas, disciplinaId, topicoId, updater) {
  function patchTopicos(topicos) {
    return (topicos || []).map((t) => {
      if (t.id === topicoId) {
        return { ...t, descricoes: updater(t.descricoes || []) };
      }
      if (t.subitens?.length) return { ...t, subitens: patchTopicos(t.subitens) };
      return t;
    });
  }
  function patchDisciplina(d) {
    if (d.id === disciplinaId) {
      return { ...d, topicos: patchTopicos(d.topicos) };
    }
    if (d.subgrupos?.length) {
      return { ...d, subgrupos: d.subgrupos.map(patchDisciplina) };
    }
    return d;
  }
  return disciplinas.map(patchDisciplina);
}

function encontrarTopico(disciplinas, disciplinaId, topicoId) {
  function buscar(topicos) {
    for (const t of topicos || []) {
      if (t.id === topicoId) return t;
      const nested = buscar(t.subitens);
      if (nested) return nested;
    }
    return null;
  }
  function walk(d) {
    if (d.id === disciplinaId) return buscar(d.topicos);
    for (const sub of d.subgrupos || []) {
      const found = walk(sub);
      if (found) return found;
    }
    return null;
  }
  for (const d of disciplinas) {
    const found = walk(d);
    if (found) return found;
  }
  return null;
}

export default function Painel() {
  const { user } = useAuth();
  const [disciplinas, setDisciplinas] = useState([]);
  const [preferencias, setPreferencias] = useState(PREFERENCIAS_PADRAO);
  const [itensHoje, setItensHoje] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [modalDisciplina, setModalDisciplina] = useState(false);
  const [modalTopico, setModalTopico] = useState({ aberto: false, disciplinaId: null });
  const [modalSubgrupo, setModalSubgrupo] = useState({ aberto: false, parentId: null });
  const [modalPendentes, setModalPendentes] = useState(false);
  const [modalHistorico, setModalHistorico] = useState(false);
  const [itemPomodoro, setItemPomodoro] = useState(null);

  const layoutLista = preferencias.layoutMode === 'LISTA';
  const labelGrupo = preferencias.labelGrupo || 'Matéria';
  const labelItem = preferencias.labelItem || 'Tópico';
  const labelGrupoNivel2 = preferencias.labelGrupoNivel2 || 'Subgrupo';
  const profundidadeGrupos = preferencias.profundidadeGrupos ?? 1;

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const [discRes, prefRes, hojeRes, fbRes] = await Promise.allSettled([
        api.get('/disciplinas'),
        api.get('/preferencias'),
        api.get('/painel/hoje'),
        api.get('/feedback'),
      ]);

      if (discRes.status === 'fulfilled') {
        setDisciplinas(discRes.value.data);
      }
      if (prefRes.status === 'fulfilled') {
        setPreferencias({ ...PREFERENCIAS_PADRAO, ...prefRes.value.data });
      }
      if (hojeRes.status === 'fulfilled') {
        const data = hojeRes.value.data;
        setItensHoje(Array.isArray(data) ? data : data?.itens || []);
      }
      if (fbRes.status === 'fulfilled') {
        setFeedback(fbRes.value.data);
      }
    } catch {
      /* mantém estado parcial se API indisponível */
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const disciplinasVisiveis = layoutLista
    ? disciplinas.filter((d) => !d.oculta)
    : disciplinas.filter((d) => !d.oculta);

  const disciplinaLista = layoutLista
    ? disciplinas.find((d) => d.oculta) || disciplinasVisiveis[0]
    : null;

  const topicosLista = layoutLista && disciplinaLista
    ? (disciplinaLista.topicos || [])
    : [];

  async function handleAdicionarDisciplina(nome) {
    try {
      const { data } = await api.post('/disciplinas', { nome });
      setDisciplinas((prev) => [...prev, { ...data, topicos: data.topicos || [], subgrupos: data.subgrupos || [] }]);
    } catch {
      setErro(`Não foi possível adicionar a ${labelGrupo.toLowerCase()}. Tente novamente.`);
    }
  }

  async function handleAdicionarSubgrupo(nome) {
    const { parentId } = modalSubgrupo;
    try {
      await api.post('/disciplinas', { nome, parentId });
      await carregarDados();
    } catch {
      setErro(`Não foi possível adicionar o subgrupo. Tente novamente.`);
    }
  }

  function handleAbrirModalSubgrupo(parentId) {
    setModalSubgrupo({ aberto: true, parentId });
  }

  async function handleRemoverDisciplina(disciplinaId) {
    if (!window.confirm(`Remover esta ${labelGrupo.toLowerCase()} e todos os seus ${labelItem.toLowerCase()}s?`)) return;
    setDisciplinas((prev) => prev.filter((d) => d.id !== disciplinaId));
    try {
      await api.delete(`/disciplinas/${disciplinaId}`);
    } catch { /* já removeu localmente */ }
  }

  function handleAbrirModalTopico(disciplinaId) {
    if (layoutLista && disciplinaLista) {
      setModalTopico({ aberto: true, disciplinaId: disciplinaLista.id });
    } else {
      setModalTopico({ aberto: true, disciplinaId });
    }
  }

  async function handleAdicionarTopico(payload) {
    const { disciplinaId } = modalTopico;
    try {
      await api.post(`/disciplinas/${disciplinaId}/topicos`, payload);
      await carregarDados();
    } catch {
      setErro(`Não foi possível adicionar o ${labelItem.toLowerCase()}. Tente novamente.`);
    }
  }

  async function handleStatusChange(disciplinaId, topicoId, status) {
    setDisciplinas((prev) => atualizarTopicoNaLista(prev, disciplinaId, topicoId, { status }));
    try {
      await api.patch(`/disciplinas/${disciplinaId}/topicos/${topicoId}/status`, { status });
    } catch { /* silencioso */ }
  }

  async function handleAgendaChange(disciplinaId, topicoId, dataProgramada) {
    const patch = { dataProgramada };
    setDisciplinas((prev) => {
      const topico = encontrarTopico(prev, disciplinaId, topicoId);
      if (topico && (isTipoEvento(topico.tipo) || isTipoComEntrega(topico.tipo))) {
        patch.dataEntrega = dataProgramada;
      }
      return atualizarTopicoNaLista(prev, disciplinaId, topicoId, patch);
    });
    try {
      await api.patch(`/disciplinas/${disciplinaId}/topicos/${topicoId}/agenda`, { dataProgramada });
      carregarDados();
    } catch { /* silencioso */ }
  }

  async function handleRenameTopico(disciplinaId, topicoId, nome) {
    setDisciplinas((prev) => atualizarTopicoNaLista(prev, disciplinaId, topicoId, { nome }));
    try {
      await api.put(`/disciplinas/${disciplinaId}/topicos/${topicoId}`, { nome });
    } catch { /* silencioso */ }
  }

  async function handleAvaliacaoChange(disciplinaId, topicoId, patch) {
    setDisciplinas((prev) => atualizarTopicoNaLista(prev, disciplinaId, topicoId, patch));
    try {
      await api.patch(`/disciplinas/${disciplinaId}/topicos/${topicoId}/avaliacao`, patch);
      if (patch.entregaConcluida !== undefined) {
        await carregarDados();
      }
    } catch { /* silencioso */ }
  }

  async function handleDescricaoAdicionar(disciplinaId, topicoId, texto) {
    try {
      const { data } = await api.post(
        `/disciplinas/${disciplinaId}/topicos/${topicoId}/descricoes`,
        { texto }
      );
      setDisciplinas((prev) =>
        atualizarDescricoesNaLista(prev, disciplinaId, topicoId, (list) => [...list, data])
      );
    } catch { /* silencioso */ }
  }

  async function handleDescricaoEditar(disciplinaId, topicoId, descricaoId, texto) {
    setDisciplinas((prev) =>
      atualizarDescricoesNaLista(prev, disciplinaId, topicoId, (list) =>
        list.map((d) => (d.id === descricaoId ? { ...d, texto } : d))
      )
    );
    try {
      await api.put(
        `/disciplinas/${disciplinaId}/topicos/${topicoId}/descricoes/${descricaoId}`,
        { texto }
      );
    } catch { /* silencioso */ }
  }

  async function handleDescricaoExcluir(disciplinaId, topicoId, descricaoId) {
    setDisciplinas((prev) =>
      atualizarDescricoesNaLista(prev, disciplinaId, topicoId, (list) =>
        list.filter((d) => d.id !== descricaoId)
      )
    );
    try {
      await api.delete(
        `/disciplinas/${disciplinaId}/topicos/${topicoId}/descricoes/${descricaoId}`
      );
    } catch { /* silencioso */ }
  }

  async function handleDeleteTopico(disciplinaId, topicoId) {
    try {
      await api.delete(`/disciplinas/${disciplinaId}/topicos/${topicoId}`);
      await carregarDados();
    } catch { /* silencioso */ }
  }

  function handleSelecionarItemHoje(item) {
    setItemPomodoro({
      assuntoId: item.id,
      disciplinaId: item.disciplinaId,
      nome: nomeTopico(item),
      disciplinaNome: item.disciplinaNome,
    });
  }

  function handleFeedbackAcao(sugestao) {
    if (!sugestao?.assuntoId) return;
    const todos = todasDisciplinasComTopicos(disciplinasVisiveis);
    const topico = todos.find((t) => t.id === sugestao.assuntoId);
    setItemPomodoro({
      assuntoId: sugestao.assuntoId,
      disciplinaId: topico?.disciplinaId,
      nome: sugestao.nome || nomeTopico(topico),
      disciplinaNome: topico?.disciplinaNome,
    });
  }

  const pendentes = todasDisciplinasComTopicos(disciplinasVisiveis).filter(
    (t) => normalizarStatus(t) !== STATUS_ESTUDO.DOMINADO
  ).length;

  return (
    <div className="painel-page">
      <div className="painel-inner">
        <div className="painel-coluna-principal">
          <header className="painel-header">
            <div className="painel-header-info">
              <span className="painel-data">{dataFormatada()}</span>
              <span className="painel-saudacao">Olá, {nomeUsuario(user)}</span>
            </div>
            <div className="painel-logo">
              <img src={LogoSvg} alt="Planeja+" />
            </div>
          </header>

          <FeedbackBanner feedback={feedback} onAcao={handleFeedbackAcao} />

          <BlocoHoje
            itens={itensHoje}
            labelItem={labelItem}
            onSelecionarItem={handleSelecionarItemHoje}
          />

          <main className="painel-main">
            <div className="painel-section-header">
              <span className="painel-section-titulo">
                {layoutLista ? 'Meu plano' : `Suas ${labelGrupo}s`}
              </span>
              <span className="painel-section-count">
                {layoutLista
                  ? `${topicosLista.length} ${topicosLista.length === 1 ? labelItem.toLowerCase() : `${labelItem.toLowerCase()}s`}`
                  : `${disciplinasVisiveis.length} ${disciplinasVisiveis.length === 1 ? labelGrupo.toLowerCase() : `${labelGrupo.toLowerCase()}s`}`}
              </span>
            </div>

            {carregando ? (
              <div className="painel-loading">Carregando...</div>
            ) : erro ? (
              <div className="painel-erro">{erro}</div>
            ) : layoutLista ? (
              <div className="painel-lista-flat">
                {topicosLista.length === 0 ? (
                  <div className="painel-vazio">
                    <div className="painel-vazio-icone">📚</div>
                    <div className="painel-vazio-titulo">Nenhum {labelItem.toLowerCase()} ainda</div>
                    <div className="painel-vazio-desc">
                      Toque no botão + para adicionar seu primeiro {labelItem.toLowerCase()}
                    </div>
                  </div>
                ) : (
                  <div className="painel-lista-card">
                    {topicosLista.map((topico) => (
                      <TopicoItem
                        key={topico.id}
                        topico={topico}
                        disciplinaId={disciplinaLista.id}
                        corAccent="#027A8F"
                        onStatusChange={handleStatusChange}
                        onAgendaChange={handleAgendaChange}
                        onRename={handleRenameTopico}
                        onDelete={handleDeleteTopico}
                        onAvaliacaoChange={handleAvaliacaoChange}
                        onDescricaoAdicionar={handleDescricaoAdicionar}
                        onDescricaoEditar={handleDescricaoEditar}
                        onDescricaoExcluir={handleDescricaoExcluir}
                      />
                    ))}
                    <button
                      className="topico-add"
                      onClick={() => handleAbrirModalTopico(disciplinaLista?.id)}
                    >
                      <span className="topico-add-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </span>
                      Adicionar {labelItem}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="painel-grid">
                {disciplinasVisiveis.length === 0 ? (
                  <div className="painel-vazio">
                    <div className="painel-vazio-icone">📚</div>
                    <div className="painel-vazio-titulo">Nenhuma {labelGrupo.toLowerCase()} ainda</div>
                    <div className="painel-vazio-desc">
                      Toque no botão + para adicionar sua primeira {labelGrupo.toLowerCase()}
                    </div>
                  </div>
                ) : (
                  disciplinasVisiveis.map((d, index) => (
                    <CardDisciplina
                      key={d.id}
                      disciplina={d}
                      index={index}
                      labelItem={labelItem}
                      labelGrupoNivel2={labelGrupoNivel2}
                      profundidadeGrupos={profundidadeGrupos}
                      onAdicionarTopico={handleAbrirModalTopico}
                      onAdicionarSubgrupo={handleAbrirModalSubgrupo}
                      onRemoverDisciplina={handleRemoverDisciplina}
                      onStatusChange={handleStatusChange}
                      onAgendaChange={handleAgendaChange}
                      onRenameTopico={handleRenameTopico}
                      onDeleteTopico={handleDeleteTopico}
                      onAvaliacaoChange={handleAvaliacaoChange}
                      onDescricaoAdicionar={handleDescricaoAdicionar}
                      onDescricaoEditar={handleDescricaoEditar}
                      onDescricaoExcluir={handleDescricaoExcluir}
                    />
                  ))
                )}
              </div>
            )}
          </main>
        </div>

        <aside className="painel-sidebar">
          <PomodoroTimer
            userEmail={user?.email}
            disciplinas={disciplinasVisiveis}
            itemSelecionado={itemPomodoro}
            onItemChange={setItemPomodoro}
            metaDiaria={feedback?.metaDiaria}
            streak={feedback?.streak}
            onSessaoSalva={carregarDados}
          />
        </aside>
      </div>

      <ModalDisciplina
        aberto={modalDisciplina}
        onFechar={() => setModalDisciplina(false)}
        onAdicionar={handleAdicionarDisciplina}
        modo="disciplina"
        labelGrupo={labelGrupo}
      />

      <ModalDisciplina
        aberto={modalTopico.aberto}
        onFechar={() => setModalTopico({ aberto: false, disciplinaId: null })}
        onAdicionar={handleAdicionarTopico}
        modo="topico"
        labelGrupo={labelGrupo}
        labelItem={labelItem}
      />

      <ModalDisciplina
        aberto={modalSubgrupo.aberto}
        onFechar={() => setModalSubgrupo({ aberto: false, parentId: null })}
        onAdicionar={handleAdicionarSubgrupo}
        modo="subgrupo"
        labelGrupo={labelGrupoNivel2 || labelGrupo}
      />

      <ModalPendentes
        aberto={modalPendentes}
        onFechar={() => setModalPendentes(false)}
        disciplinas={disciplinasVisiveis}
      />

      <ModalHistoricoEventos
        aberto={modalHistorico}
        onFechar={() => setModalHistorico(false)}
      />

      <Rodape
        pendentes={pendentes}
        onNovaDisciplina={() => (layoutLista ? handleAbrirModalTopico() : setModalDisciplina(true))}
        onVerPendentes={() => setModalPendentes(true)}
        onVerHistorico={() => setModalHistorico(true)}
      />
    </div>
  );
}
