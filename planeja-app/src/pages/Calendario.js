import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LogoSvg from '../assets/logo.svg';
import { STATUS_LABELS, normalizarStatus } from '../constants/statusEstudo';
import './Calendario.css';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatarISO(ano, mes, dia) {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function diasDoMes(ano, mes) {
  return new Date(ano, mes + 1, 0).getDate();
}

function primeiroDiaSemana(ano, mes) {
  return new Date(ano, mes, 1).getDay();
}

export default function Calendario() {
  const navigate = useNavigate();
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [dados, setDados] = useState({ dias: [], marcoPrincipal: null });
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const carregarCalendario = useCallback(async () => {
    setCarregando(true);
    const de = formatarISO(ano, mes, 1);
    const ate = formatarISO(ano, mes, diasDoMes(ano, mes));
    try {
      const { data } = await api.get('/calendario', { params: { de, ate } });
      setDados(data);
    } catch {
      setDados({ dias: [], marcoPrincipal: null });
    } finally {
      setCarregando(false);
    }
  }, [ano, mes]);

  useEffect(() => {
    carregarCalendario();
  }, [carregarCalendario]);

  function mesAnterior() {
    if (mes === 0) {
      setMes(11);
      setAno((a) => a - 1);
    } else {
      setMes((m) => m - 1);
    }
    setDiaSelecionado(null);
  }

  function mesProximo() {
    if (mes === 11) {
      setMes(0);
      setAno((a) => a + 1);
    } else {
      setMes((m) => m + 1);
    }
    setDiaSelecionado(null);
  }

  const mapaDias = (dados.dias || []).reduce((acc, d) => {
    acc[d.data] = d;
    return acc;
  }, {});

  const totalDias = diasDoMes(ano, mes);
  const offset = primeiroDiaSemana(ano, mes);
  const celulas = [];

  for (let i = 0; i < offset; i += 1) {
    celulas.push(<div key={`empty-${i}`} className="cal-celula cal-vazia" />);
  }
  for (let dia = 1; dia <= totalDias; dia += 1) {
    const chave = formatarISO(ano, mes, dia);
    const info = mapaDias[chave];
    const temItens = info?.itens?.length > 0;
    const temMarcos = info?.marcos?.length > 0;
    const ehHoje = chave === formatarISO(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const selecionado = diaSelecionado === chave;

    celulas.push(
      <button
        key={chave}
        type="button"
        className={`cal-celula${ehHoje ? ' hoje' : ''}${selecionado ? ' selecionado' : ''}`}
        onClick={() => setDiaSelecionado(chave)}
      >
        <span className="cal-dia-num">{dia}</span>
        <span className="cal-indicadores">
          {temItens && <span className="cal-bolinha" title="Itens agendados" />}
          {temMarcos && <span className="cal-diamante" title="Marcos" />}
        </span>
      </button>
    );
  }

  const diaDetalhe = diaSelecionado ? mapaDias[diaSelecionado] : null;

  return (
    <div className="cal-page">
      <div className="cal-inner">
        <div className="cal-logo">
          <img src={LogoSvg} alt="Planeja+" />
        </div>

        <button type="button" className="cal-voltar" onClick={() => navigate('/')}>
          ← Voltar
        </button>

        <div className="cal-topo">
          <h1 className="cal-titulo">Calendário</h1>
          {dados.marcoPrincipal && (
            <div className="cal-marco-principal">
              {dados.marcoPrincipal.titulo} — {dados.marcoPrincipal.diasRestantes} dias
            </div>
          )}
        </div>

        <div className="cal-navegacao">
          <button type="button" className="cal-nav-btn" onClick={mesAnterior}>‹</button>
          <span className="cal-mes-label">{MESES[mes]} {ano}</span>
          <button type="button" className="cal-nav-btn" onClick={mesProximo}>›</button>
        </div>

        <div className="cal-legenda">
          <span><span className="cal-bolinha" /> Estudo</span>
          <span><span className="cal-diamante" /> Marco</span>
        </div>

        {carregando ? (
          <div className="cal-loading">Carregando...</div>
        ) : (
          <div className="cal-grid-wrap">
            <div className="cal-semana-header">
              {DIAS_SEMANA.map((d) => (
                <span key={d} className="cal-semana-dia">{d}</span>
              ))}
            </div>
            <div className="cal-grid">{celulas}</div>
          </div>
        )}

        {diaSelecionado && (
          <aside className="cal-drawer">
            <div className="cal-drawer-header">
              <h2 className="cal-drawer-titulo">
                {new Date(`${diaSelecionado}T12:00:00`).toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <button type="button" className="cal-drawer-fechar" onClick={() => setDiaSelecionado(null)}>×</button>
            </div>

            <div className="cal-drawer-secao">
              <div className="cal-drawer-secao-titulo">Estudo planejado</div>
              {diaDetalhe?.itens?.length > 0 ? (
                diaDetalhe.itens.map((item) => (
                  <div key={item.id} className="cal-drawer-item">
                    <span className="cal-drawer-item-nome">{item.nome}</span>
                    {item.disciplinaNome && (
                      <span className="cal-drawer-item-disc">{item.disciplinaNome}</span>
                    )}
                    <span className="cal-drawer-item-status">
                      {STATUS_LABELS[normalizarStatus(item)]}
                    </span>
                  </div>
                ))
              ) : (
                <p className="cal-drawer-vazio">Nenhum item agendado.</p>
              )}
            </div>

            <div className="cal-drawer-secao">
              <div className="cal-drawer-secao-titulo">Marcos</div>
              {diaDetalhe?.marcos?.length > 0 ? (
                diaDetalhe.marcos.map((marco) => (
                  <div key={marco.id} className="cal-drawer-marco">
                    <span className="cal-diamante" />
                    <span>{marco.titulo}</span>
                    {marco.ehPrincipal && <span className="cal-marco-badge">Principal</span>}
                  </div>
                ))
              ) : (
                <p className="cal-drawer-vazio">Nenhum marco neste dia.</p>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
