import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import CardDisciplina from '../components/CardDisciplina';
import ModalDisciplina from '../components/ModalDisciplina';
import ModalPendentes from '../components/ModalPendentes';
import Rodape from '../components/Rodape';
import LogoSvg from '../assets/logo.svg';
import './Painel.css';

const DIAS = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function dataFormatada() {
  const d = new Date();
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

function nomeUsuario() {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return u.nome || u.name || 'Estudante';
  } catch {
    return 'Estudante';
  }
}

export default function Painel() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [modalDisciplina, setModalDisciplina] = useState(false);
  const [modalTopico, setModalTopico] = useState({ aberto: false, disciplinaId: null });
  const [modalPendentes, setModalPendentes] = useState(false);

  const carregarDisciplinas = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const { data } = await api.get('/disciplinas');
      setDisciplinas(data);
    } catch {
      /* mantém vazio se API indisponível */
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDisciplinas();
  }, [carregarDisciplinas]);

  async function handleAdicionarDisciplina(nome) {
    try {
      const { data } = await api.post('/disciplinas', { nome });
      setDisciplinas((prev) => [...prev, { ...data, topicos: data.topicos || [] }]);
    } catch {
      setDisciplinas((prev) => [...prev, { id: Date.now(), nome, topicos: [] }]);
    }
  }

  async function handleRemoverDisciplina(disciplinaId) {
    if (!window.confirm('Remover esta disciplina e todos os seus tópicos?')) return;
    setDisciplinas((prev) => prev.filter((d) => d.id !== disciplinaId));
    try {
      await api.delete(`/disciplinas/${disciplinaId}`);
    } catch { /* já removeu localmente */ }
  }

  async function handleToggleTopico(disciplinaId, topicoId) {
    setDisciplinas((prev) =>
      prev.map((d) => {
        if (d.id !== disciplinaId) return d;
        return {
          ...d,
          topicos: (d.topicos || []).map((t) =>
            t.id === topicoId ? { ...t, concluido: !t.concluido } : t
          ),
        };
      })
    );
    try {
      await api.patch(`/disciplinas/${disciplinaId}/topicos/${topicoId}/toggle`);
    } catch { /* silencioso */ }
  }

  function handleAbrirModalTopico(disciplinaId) {
    setModalTopico({ aberto: true, disciplinaId });
  }

  async function handleAdicionarTopico(nome) {
    const { disciplinaId } = modalTopico;
    try {
      const { data } = await api.post(`/disciplinas/${disciplinaId}/topicos`, { nome });
      setDisciplinas((prev) =>
        prev.map((d) =>
          d.id === disciplinaId
            ? { ...d, topicos: [...(d.topicos || []), data] }
            : d
        )
      );
    } catch {
      setDisciplinas((prev) =>
        prev.map((d) =>
          d.id === disciplinaId
            ? { ...d, topicos: [...(d.topicos || []), { id: Date.now(), nome, concluido: false }] }
            : d
        )
      );
    }
  }

  const pendentes = disciplinas.reduce(
    (acc, d) => acc + (d.topicos || []).filter((t) => !t.concluido).length,
    0
  );

  return (
    <div className="painel-page">
      <div className="painel-inner">
        <header className="painel-header">
          <div className="painel-header-info">
            <span className="painel-data">{dataFormatada()}</span>
            <span className="painel-saudacao">Olá, {nomeUsuario()}</span>
          </div>
          <div className="painel-logo">
            <img src={LogoSvg} alt="Planeja+" />
          </div>
        </header>

        <div className="painel-section-header">
          <span className="painel-section-titulo">Suas Disciplinas</span>
          <span className="painel-section-count">
            {disciplinas.length} {disciplinas.length === 1 ? 'disciplina' : 'disciplinas'}
          </span>
        </div>

        {carregando ? (
          <div className="painel-loading">Carregando...</div>
        ) : erro ? (
          <div className="painel-erro">{erro}</div>
        ) : (
          <div className="painel-grid">
            {disciplinas.length === 0 ? (
              <div className="painel-vazio">
                <div className="painel-vazio-icone">📚</div>
                <div className="painel-vazio-titulo">Nenhuma disciplina ainda</div>
                <div className="painel-vazio-desc">
                  Toque no botão + para adicionar sua primeira disciplina
                </div>
              </div>
            ) : (
              disciplinas.map((d, index) => (
                <CardDisciplina
                  key={d.id}
                  disciplina={d}
                  index={index}
                  onToggleTopico={handleToggleTopico}
                  onAdicionarTopico={handleAbrirModalTopico}
                  onRemoverDisciplina={handleRemoverDisciplina}
                />
              ))
            )}
          </div>
        )}
      </div>

      <ModalDisciplina
        aberto={modalDisciplina}
        onFechar={() => setModalDisciplina(false)}
        onAdicionar={handleAdicionarDisciplina}
        modo="disciplina"
      />

      <ModalDisciplina
        aberto={modalTopico.aberto}
        onFechar={() => setModalTopico({ aberto: false, disciplinaId: null })}
        onAdicionar={handleAdicionarTopico}
        modo="topico"
      />

      <ModalPendentes
        aberto={modalPendentes}
        onFechar={() => setModalPendentes(false)}
        disciplinas={disciplinas}
      />

      <Rodape
        pendentes={pendentes}
        onNovaDisciplina={() => setModalDisciplina(true)}
        onVerPendentes={() => setModalPendentes(true)}
      />
    </div>
  );
}