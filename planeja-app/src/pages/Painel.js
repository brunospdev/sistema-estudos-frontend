import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import CardDisciplina from '../components/CardDisciplina';
import ModalDisciplina from '../components/ModalDisciplina';
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

const DEMO = [];

export default function Painel() {
  const [disciplinas, setDisciplinas] = useState(DEMO);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [modalAberto, setModalAberto] = useState(false);

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
      const novaId = Date.now();
      setDisciplinas((prev) => [...prev, { id: novaId, nome, topicos: [] }]);
    }
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
    } catch {
      /* rollback se necessário */
    }
  }

  async function handleAdicionarTopico(disciplinaId) {
    const nome = window.prompt('Nome do tópico:');
    if (!nome?.trim()) return;
    try {
      const { data } = await api.post(`/disciplinas/${disciplinaId}/topicos`, { nome: nome.trim() });
      setDisciplinas((prev) =>
        prev.map((d) =>
          d.id === disciplinaId
            ? { ...d, topicos: [...(d.topicos || []), data] }
            : d
        )
      );
    } catch {
      const novoId = Date.now();
      setDisciplinas((prev) =>
        prev.map((d) =>
          d.id === disciplinaId
            ? { ...d, topicos: [...(d.topicos || []), { id: novoId, nome: nome.trim(), concluido: false }] }
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
              disciplinas.map((d) => (
                <CardDisciplina
                  key={d.id}
                  disciplina={d}
                  onToggleTopico={handleToggleTopico}
                  onAdicionarTopico={handleAdicionarTopico}
                />
              ))
            )}
          </div>
        )}
      </div>

      <ModalDisciplina
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onAdicionar={handleAdicionarDisciplina}
      />

      <Rodape pendentes={pendentes} onNovaDisciplina={() => setModalAberto(true)} />
    </div>
  );
}
