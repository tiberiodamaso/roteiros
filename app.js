// Natal na Europa — app estático em JS vanilla.
// Lê o conteúdo de roteiro-data.js (módulo ES) e desenha as oito telas.
// Sem framework, sem build: o navegador carrega este arquivo direto.

import * as D from './roteiro-data.js';

/* ══════════════════════════════════════════════════════════════
   1. Utilitários
   ══════════════════════════════════════════════════════════════ */

const $ = sel => document.querySelector(sel);

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ESC[c]);

const brl = n => 'R$ ' + n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
const mins = hhmm => { const p = String(hhmm).split(':'); return (+p[0]) * 60 + (+p[1]); };
const nightsTxt = n => n + (n === 1 ? ' noite' : ' noites');

const cityOf = k => D.CITIES.find(c => c.k === k) || {};
const colOf = k => cityOf(k).col || '#241f1a';
// Paris aparece duas vezes: ① primeira estadia, ② Réveillon.
const cityLabel = c => c.n + (c.sub ? (c.k === 'paris1' ? ' ①' : ' ②') : '');

const sunTxt = d => (d.sun ? d.sun[0] + ' → ' + d.sun[1] : '');
const travelTxt = d => (d.travel ? '  ·  ' + d.travel.from + ' → ' + d.travel.to + ' (' + d.travel.mode + ')' : '');

const li = arr => (arr || []).map(l => `<li>${esc(l)}</li>`).join('');

/* Fotos reais, por id de espaço. Para publicar uma nova imagem: coloque o
   arquivo em fotos/ e acrescente uma linha aqui. O que não estiver mapeado
   vira um espaço reservado com a legenda. O nome do arquivo não precisa
   bater com a chave — quem manda é este mapa. */
const PHOTOS = {
  'foto-lisboa': 'fotos/lisboa.png',
  // Os dois arquivos de Paris estão trocados em relação ao que cada card
  // mostra: paris1.jpg é a Torre Eiffel e paris2.jpg é o Sacré-Cœur. A
  // primeira estadia é em Montmartre e a segunda é a 15 min da Torre, então
  // o mapa cruza os dois. Renomear os arquivos também resolveria.
  'foto-paris1': 'fotos/paris2.jpg',
  'foto-paris2': 'fotos/paris1.jpg',
  'foto-interlaken': 'fotos/interlaken.jpg',
  'foto-zurique': 'fotos/zurique.webp',
  'foto-viena': 'fotos/viena.jpg',
  'foto-zagreb': 'fotos/zagreb.jpg',
  'foto-salzburgo': 'fotos/salzburg.jpg',
  // Este arquivo é um preview da Alamy e carrega a marca d'água da agência.
  // Publicado assim por decisão do dono do roteiro; trocar por uma versão
  // licenciada é só substituir o arquivo, sem mexer aqui.
  'foto-plitvice': 'fotos/plitvice.jpg',
};

/* Legenda do espaço reservado, quando ainda não há foto. */
const LEGENDAS = {
  lisboa: 'Torre de Belém',
  paris1: 'Sacré-Cœur, Montmartre',
  interlaken: 'Grindelwald-First, nos Alpes',
  zurique: 'O Grossmünster iluminado, no centro de Zurique',
  viena: 'Palácio de Schönbrunn',
  zagreb: 'Advent u Zagrebu, na Praça Ban Jelačić',
  paris2: 'Torre Eiffel',
  salzburgo: 'Cidade velha e a Fortaleza de Hohensalzburg',
  plitvice: 'Lagos Inferiores de Plitvice no inverno',
};

// A legenda serve para os dois casos: vira o alt da foto ou o texto do
// espaço reservado. Uma fonte só para o que a imagem mostra.
function photo(slotId, legenda, cls) {
  const src = PHOTOS[slotId];
  const inner = src
    ? `<img src="${esc(src)}" alt="${esc(legenda)}" loading="lazy">`
    : `<div class="photo__ph">${esc(legenda)}</div>`;
  return `<div class="photo ${cls || ''}">${inner}</div>`;
}

/* Ícones dos links de contato. Inline e monocromáticos: herdam a cor do
   link por currentColor e não dependem de nenhum arquivo externo. */
const SVG = (d, extra) => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"${extra || ''}>${d}</svg>`;
const ICONES = {
  zap: SVG('<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.02c-.24.68-1.2 1.25-1.97 1.41-.53.11-1.22.2-3.54-.76-2.97-1.23-4.88-4.25-5.03-4.45-.14-.2-1.2-1.6-1.2-3.05s.76-2.16 1.03-2.46c.27-.3.59-.37.79-.37h.56c.18.01.42-.07.66.5.24.58.83 2.01.9 2.16.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.36 1.46.3.15.47.12.65-.07.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.35.07.12.07.72-.17 1.4z"/>'),
  tel: SVG('<path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1l-2.3 2.2z"/>'),
  mapa: SVG('<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>'),
  site: SVG('<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM4.6 9h2.9c-.1 1-.2 2-.2 3s.1 2 .2 3H4.6a8 8 0 0 1 0-6zm.9 8h2.3c.3 1.4.8 2.6 1.4 3.5A8 8 0 0 1 5.5 17zm2.3-10H5.5a8 8 0 0 1 3.7-3.5C8.6 4.4 8.1 5.6 7.8 7zM11 20.5c-1-.7-1.9-2-2.4-3.5H11v3.5zM11 15H8.2c-.1-1-.2-2-.2-3s.1-2 .2-3H11v6zm0-8H8.6C9.1 5.5 10 4.2 11 3.5V7zm7.5 0h-2.3c-.3-1.4-.8-2.6-1.4-3.5A8 8 0 0 1 18.5 7zM13 3.5c1 .7 1.9 2 2.4 3.5H13V3.5zM13 9h2.8c.1 1 .2 2 .2 3s-.1 2-.2 3H13V9zm0 11.5V17h2.4c-.5 1.5-1.4 2.8-2.4 3.5zm1.8-.5c.6-.9 1.1-2.1 1.4-3.5h2.3a8 8 0 0 1-3.7 3.5zm1.7-5c.1-1 .2-2 .2-3s-.1-2-.2-3h2.9a8 8 0 0 1 0 6h-2.9z"/>'),
  dia: SVG('<path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 8v10H5V10h14z"/>'),
};

/* Fileira de links de um item. Só entra o que existe: sem telefone não há
   "Ligar", sem celular não há WhatsApp, sem endereço não há Maps. */
function linksHtml(o, extra) {
  const l = [];
  const abrir = (href, icone, rotulo) =>
    `<a class="lnk" href="${href}" target="_blank" rel="noopener">${icone}${rotulo}</a>`;
  if (o.tel && o.zap) l.push(abrir('https://wa.me/' + o.tel.replace(/\D/g, ''), ICONES.zap, 'WhatsApp'));
  if (o.tel) l.push(`<a class="lnk" href="tel:${esc(o.tel.replace(/\s/g, ''))}" data-tel="${esc(o.tel)}">${ICONES.tel}Ligar</a>`);
  if (o.mapa) l.push(abrir('https://www.google.com/maps/search/?api=1&amp;query=' + encodeURIComponent(o.mapa), ICONES.mapa, 'Maps'));
  if (o.url) l.push(abrir(esc(o.url), ICONES.site, 'Site'));
  if (extra) l.push(extra);
  return l.length ? `<div class="lnks">${l.join('')}</div>` : '';
}

/* ══════════════════════════════════════════════════════════════
   2. Estado
   ══════════════════════════════════════════════════════════════ */

const STORE = 'natal-europa:v1';

// Decisões já fechadas no roteiro. Ficam aqui como constantes porque o app
// original também as forçava a estes valores na montagem.
const PLITVICE = '29';   // '29' | '30'
const ULTIMO = 'orsay';  // 'orsay' | 'louvre'
const REVEILLON = 'ceia';

// Câmbio usado no financeiro (era ajustável pelo editor do Claude Design).
const CAMBIO_EUR = 6.4;
const CAMBIO_CHF = 6.9;

const state = {
  view: 'inicio',
  city: null,
  q: '',
  date: '2026-12-11',
  filter: 'all',
  openDays: {},
  done: {},
};

function load() {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) state.done = JSON.parse(raw).done || {};
  } catch (e) { /* modo privado, cota cheia: segue sem persistência */ }
}

function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify({
      done: state.done, plitvice: PLITVICE, reveillon: REVEILLON, ultimo: ULTIMO,
    }));
  } catch (e) { /* idem */ }
}

/* ══════════════════════════════════════════════════════════════
   3. Dias — o roteiro já resolvido
   ══════════════════════════════════════════════════════════════ */

// Os dois dias de Zagreb são variantes: um deles vira Plitvice e o outro
// junta o dia da cidade com o dia leve.
const DAYS = (() => {
  const plitDate = PLITVICE === '29' ? '2026-12-29' : '2026-12-30';
  const cid = D.DAYS.find(d => d.variant === 'zagreb-cidade');
  const leve = D.DAYS.find(d => d.variant === 'zagreb-leve');
  return D.DAYS.map(d => {
    if (d.variant) {
      const slot = { id: d.id, label: d.label, wd: d.wd, city: d.city, sun: d.sun };
      if (d.id === plitDate) return Object.assign(slot, D.PLITVICE_DAY);
      return Object.assign(slot, {
        title: cid.title,
        blocks: cid.blocks.concat(leve.blocks.slice(1)),
        nota: 'Este é o dia da cidade. Plitvice está marcado para ' + (plitDate === '2026-12-29' ? '29/12' : '30/12') + '.',
      });
    }
    if (d.id === '2026-12-31') {
      return Object.assign({}, d, { nota: 'Sem ceia de Réveillon e sem jantar reservado. Voo Zagreb → Paris já comprado. Compras na Rue Cler até as 18h resolvem a noite e o café da manhã do dia 1º.' });
    }
    if (d.id === '2027-01-02') {
      return Object.assign({}, d, { nota: ULTIMO === 'orsay'
        ? 'Decidido: Musée d’Orsay das 10h às 13h. Ingresso com hora marcada, comprado na véspera.'
        : 'Decidido: Louvre por dentro. Metrô às 09h15, museu das 10h às 13h30, volta ao 7º e malas às 15h. Ingresso com hora marcada, obrigatório.' });
    }
    return d;
  });
})();

const dayOf = id => DAYS.find(d => d.id === id);

// O que precisa ser comprado ou reservado para cada data.
const PENDENCIAS = {
  '2026-12-11': ['Cartões Viva Viagem com Zapping, na máquina do Rossio', 'Almoço na Casa do Alentejo e jantar no Trama — reservados'],
  '2026-12-12': ['Ingresso do Castelo de São Jorge, comprado online na véspera'],
  '2026-12-15': ['Reserva de mesa no app da Disneyland Paris'],
  '2026-12-17': ['Torre Eiffel com hora marcada · Le Son de la Terre 18h50 (o cruzeiro do Sena já está comprado, Beautomux)'],
  '2026-12-18': ['TGV Lyria · reserva de assento no Luzern-Interlaken Express · bilhete Basel → Interlaken via Luzern (na véspera)', 'Pedir a Interlaken Guest Card no check-in'],
  '2026-12-19': ['Bilhete Interlaken Ost → Grindelwald (véspera) · teleférico do First só na bilheteria, depois das webcams'],
  '2026-12-20': ['Bilhete Interlaken Ost → Zürich HB (véspera) · avulso zona 110'],
  '2026-12-21': ['Passe diário com as zonas até Kilchberg, comprado às 9h'],
  '2026-12-22': ['Bilhete Zürich HB → Engelberg (véspera) · teleférico do Titlis só na base · Ice Flyer à parte'],
  '2026-12-23': ['Nightjet Zurique → Viena · jantar reservado perto da estação'],
  '2026-12-26': ['Passagens ÖBB Viena ⇄ Salzburgo, tarifa Sparschiene'],
  '2026-12-27': ['Ingresso de Schönbrunn com hora marcada · jantar final reservado'],
  '2026-12-28': ['Voo VIE → ZAG · transfers dos dois lados · franquia de bagagem'],
  '2026-12-31': ['Transfer CDG → Hotel du Cadran (o voo já está comprado)'],
  '2027-01-02': ['Transfer hotel → ORLY às 16h30 · ingresso do museu escolhido'],
};

function pendFor(id) {
  const p = (PENDENCIAS[id] || []).slice();
  if (id === (PLITVICE === '29' ? '2026-12-29' : '2026-12-30')) {
    p.push('Excursão a Plitvice com busca no hotel + ingresso do parque online');
    p.push('Perguntar se o barco do Kozjak e o trem panorâmico estarão operando');
  }
  return p;
}

/* Condução declarada por trecho (dia + parada de destino).
   Tudo o que não está aqui é a pé. */
const MODO_FIXO = {
  '2026-12-11|Hotel Inn Rossio': 'transfer',
  '2026-12-12|Hotel → Oceanário': 'metrô',
  '2026-12-12|Uber/Bolt até o Castelo': 'transfer',
  '2026-12-13|Hotel → Cais do Sodré': 'metrô',
  '2026-12-13|Cais do Sodré → Alcântara-Mar': 'trem',
  '2026-12-13|Alcântara-Mar → Belém': 'trem',
  '2026-12-13|Belém → Chiado, 25–30 min': 'trem',
  '2026-12-14|Transfer Welcome Pickups → hotel': 'avião',
  '2026-12-14|Linha 4 → Montmartre': 'metrô',
  '2026-12-14|Subida até a Basílica': 'funicular',
  '2026-12-14|Uber ou Bolt até o hotel': 'transfer',
  '2026-12-15|Linha 4 até Châtelet': 'metrô',
  '2026-12-15|A baldeação em Châtelet-Les Halles': 'metrô',
  '2026-12-15|RER A até Chessy': 'trem',
  '2026-12-15|Marne-la-Vallée-Chessy': 'trem',
  '2026-12-15|RER A → Châtelet → Linha 4': 'trem',
  '2026-12-17|Hotel → Trocadéro': 'metrô',
  '2026-12-17|Alma-Marceau → Franklin D. Roosevelt': 'metrô',
  '2026-12-17|Cruzeiro no Sena — Beautomux, já comprado': 'barco',
  '2026-12-17|Píer → jantar de Uber': 'transfer',
  '2026-12-17|Volta ao hotel': 'metrô',
  '2026-12-18|TGV Lyria → Basel SBB': 'transfer',
  '2026-12-18|Basel → Luzern': 'trem',
  '2026-12-18|LUZERN–INTERLAKEN EXPRESS': 'trem',
  '2026-12-18|Chegada em Interlaken Ost': 'trem',
  '2026-12-18|Check-in + Guest Card': 'ônibus',
  '2026-12-19|Interlaken → Grindelwald': 'trem',
  '2026-12-19|Subida ao First': 'teleférico',
  '2026-12-19|Volta a Interlaken': 'trem',
  '2026-12-20|Interlaken Ost → Zürich HB': 'trem',
  '2026-12-20|Chegada e hotel': 'transfer',
  '2026-12-20|Caminhada do centro iluminado': 'tram',
  '2026-12-20|Retorno': 'tram',
  '2026-12-21|Christkindlimarkt, dentro da Zürich HB': 'tram',
  '2026-12-21|Lago de Zurique, Bürkliplatz': 'tram',
  '2026-12-21|Ônibus 165 até Kilchberg': 'ônibus',
  '2026-12-21|Retorno e jantar no Kreis 5': 'tram',
  '2026-12-22|Zurique → Engelberg': 'trem',
  '2026-12-22|No cume, a 3.020 m': 'teleférico',
  '2026-12-22|Trübsee, na descida': 'teleférico',
  '2026-12-22|Descida final': 'teleférico',
  '2026-12-22|Volta e jantar': 'trem',
  '2026-12-23|Guarda-volumes na Zürich HB': 'tram',
  '2026-12-23|Polybahn e a Polyterrasse': 'funicular',
  '2026-12-24|Check-in no apartamento': 'transfer',
  '2026-12-26|Wien Hbf → Salzburg Hbf': 'trem',
  '2026-12-26|Fortaleza Hohensalzburg': 'funicular',
  '2026-12-26|Retorno para Viena': 'trem',
  '2026-12-27|Palácio de Schönbrunn': 'metrô',
  '2026-12-27|Centro histórico completo': 'metrô',
  '2026-12-27|Prater': 'metrô',
  '2026-12-28|Transfer ao aeroporto de Viena': 'transfer',
  '2026-12-28|Chegada em Zagreb': 'avião',
  '2026-12-28|Três coisas para resolver no balcão': 'transfer',
  '2026-12-29|Funicular de Zagreb': 'funicular',
  '2026-12-29|Chegada, Entrada 1': 'ônibus',
  '2026-12-29|Rastoke, no caminho de volta': 'ônibus',
  '2026-12-29|Retorno a Zagreb': 'ônibus',
  '2026-12-30|Museu Técnico Nikola Tesla': 'tram',
  '2026-12-30|Chegada, Entrada 1': 'ônibus',
  '2026-12-30|Rastoke, no caminho de volta': 'ônibus',
  '2026-12-30|Retorno a Zagreb': 'ônibus',
  '2026-12-31|Chegada ao hotel': 'avião',
  '2027-01-01|Hotel → Concorde': 'metrô',
  '2027-01-01|Volta ao hotel': 'metrô',
  '2027-01-02|Saída para Orly': 'transfer',
};

/* ══════════════════════════════════════════════════════════════
   4. Números derivados
   ══════════════════════════════════════════════════════════════ */

const PARTIDA = new Date('2026-12-11T05:15:00');

function countdown() {
  const diff = Math.max(0, PARTIDA - Date.now());
  const pad = n => String(n).padStart(2, '0');
  return {
    dias: Math.ceil(diff / 86400000),
    relogio: pad(Math.floor(diff / 3600000) % 24) + ':' + pad(Math.floor(diff / 60000) % 60) + ':' + pad(Math.floor(diff / 1000) % 60),
  };
}

function progresso() {
  let total = 0, feitos = 0;
  D.CHECKLIST.forEach(b => b.items.forEach(i => {
    total++;
    if (b.k === 'b0' || state.done[i.id]) feitos++;
  }));
  return { total, feitos, pct: Math.round((feitos / total) * 100) };
}

/* Estimativa de custo por grupo de gasto.
 *
 * O que já está pago não aparece em separado: cada valor fechado entra
 * diluído no grupo a que pertence, e o total do grupo é a estimativa
 * completa daquele tipo de despesa — pago e a pagar juntos.
 *
 * `v`   valor por adulto.
 * `fam` total da família quando é um valor fechado e conhecido; quando
 *       ausente, é estimado como v × (2 + kid).
 * `kid` peso da criança de 10 anos naquela linha (0 = não paga,
 *       1 = paga inteiro). Na diluição de um valor fechado ela conta
 *       como 0,75 de um adulto.
 */
function finance() {
  const e = n => n * CAMBIO_EUR, f = n => n * CAMBIO_CHF;
  const share = 1 / 2.75;
  const pago = { voos: 18269.28, hosp: 22022.57, passeios: 7571.17 };

  const G = [
    { titulo: 'Voos', tom: '#3a55a0', kid: 0.9,
      itens: 'Ida do Brasil, Lisboa → Paris, Viena → Zagreb, Zagreb → Paris e a volta de Orly',
      linhas: [
        { v: pago.voos * share, fam: pago.voos },
        { v: e(120), kid: 0.9 },
      ] },
    { titulo: 'Hospedagem', tom: '#7a4577', kid: 0.75,
      itens: '7 bases, 21 noites em cama. A noite no Nightjet está em trens e transfers',
      linhas: [
        { v: pago.hosp * share, fam: pago.hosp },
      ] },
    { titulo: 'Trens e transfers', tom: '#2f6b4f', kid: 0.5,
      itens: 'Swiss Half Fare Card, TGV Lyria, Luzern–Interlaken Express, Nightjet, ÖBB até Salzburgo e os transfers de aeroporto',
      linhas: [
        { v: f(150), kid: 0 },        // Swiss Half Fare Card — criança grátis com o Family Card
        { v: e(80), kid: 0.5 },       // TGV Lyria Paris → Basel
        { v: f(70), kid: 0 },         // Basel → Interlaken + reserva
        { v: e(120), kid: 0.7 },      // Nightjet Zurique → Viena
        { v: e(40), kid: 0.5 },       // ÖBB Viena ⇄ Salzburgo
        { v: e(45), kid: 1 },         // transfers restantes, rateados entre 9
      ] },
    { titulo: 'Passeios e ingressos', tom: '#b4552f', kid: 0.5,
      itens: 'Disney, cruzeiro no Sena, Lindt, teleféricos do First e do Titlis, Torre Eiffel, Schönbrunn, Orsay e Plitvice',
      linhas: [
        { v: pago.passeios * share, fam: pago.passeios },
        { v: f(60), kid: 0.5 },              // Grindelwald–First e trem BOB
        { v: f(60), kid: 0.5 },              // Titlis
        { v: e(30), kid: 0.5 },              // Torre Eiffel até o cume
        { v: e(43) + f(13), kid: 0.3 },      // Schönbrunn, Orsay, Museu Nacional Suíço
        { v: e(10), kid: 0.5 },              // Plitvice no inverno
      ] },
    { titulo: 'Alimentação', tom: '#a2761c', kid: 0.6,
      itens: '23 dias. Lisboa e Paris ~€ 30–35/dia · Suíça ~CHF 45–50/dia · Viena e Zagreb ~€ 25–28/dia',
      linhas: [
        { v: e(550) + f(240), kid: 0.6 },
      ] },
    { titulo: 'Transporte urbano', tom: '#2c3f78', kid: 0.5,
      itens: 'Navigo Semaine, Zapping de Lisboa e as zonas de Zurique, Viena e Zagreb',
      linhas: [
        { v: e(105) + f(60), kid: 0.5 },
      ] },
    { titulo: 'Compras e imprevistos', tom: '#9e2c46', kid: 0.6,
      itens: 'Mercados de Natal, lembranças, cafés e uma reserva para o que não estava no plano',
      linhas: [
        { v: 1300, kid: 0.6 },
        { v: 800, kid: 0.5 },
      ] },
  ];

  let totA = 0, totF = 0;
  const grupos = G.map(g => {
    let a = 0, fam = 0;
    g.linhas.forEach(l => {
      a += l.v;
      fam += (l.fam !== undefined ? l.fam : l.v * (2 + (l.kid !== undefined ? l.kid : g.kid)));
    });
    totA += a; totF += fam;
    return { titulo: g.titulo, tom: g.tom, itens: g.itens, a, fam };
  });

  // Maior primeiro: a página passa a responder "para onde vai o dinheiro".
  grupos.sort((x, y) => y.a - x.a);

  // Arredondamento pelo maior resto, para as fatias fecharem 100% exatos —
  // sete Math.round independentes somavam 101%.
  const pcts = grupos.map(g => Math.floor((g.a / totA) * 100));
  const sobra = 100 - pcts.reduce((s, n) => s + n, 0);
  grupos
    .map((g, i) => ({ i, resto: (g.a / totA) * 100 - pcts[i] }))
    .sort((x, y) => y.resto - x.resto)
    .slice(0, Math.max(0, sobra))
    .forEach(({ i }) => pcts[i]++);

  return {
    grupos: grupos.map((g, i) => ({
      titulo: g.titulo, tom: g.tom, itens: g.itens,
      aTxt: brl(g.a), famTxt: brl(g.fam),
      pct: pcts[i],
    })),
    adulto: brl(totA),
    familia: brl(totF),
    porDia: brl(totA / 23),
    eur: CAMBIO_EUR.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    chf: CAMBIO_CHF.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
  };
}

/* ══════════════════════════════════════════════════════════════
   5. Telas
   ══════════════════════════════════════════════════════════════ */

/* — blocos reaproveitados — */

function blocoHtml(b, cls, col) {
  return `<div class="block ${cls || ''}"${col ? ` style="--col:${col}"` : ''}>
    <div class="block__t">${esc(b.t)}</div>
    <div>
      <div class="block__h">${esc(b.h)}</div>
      <ul>${li(b.l)}</ul>
    </div>
  </div>`;
}

function diaCardHtml(d, col) {
  return `<div class="day" style="--col:${col}">
    <div class="day__head">
      <span class="day__label">${esc(d.label)} ${esc(d.wd)}</span>
      <span class="day__title">${esc(d.title)}</span>
    </div>
    <div class="day__meta">sol ${esc(sunTxt(d))}${esc(travelTxt(d))}</div>
    ${d.nota ? `<div class="day__nota">${esc(d.nota)}</div>` : ''}
    <div class="day__blocks">${(d.blocks || []).map(b => blocoHtml(b)).join('')}</div>
    ${(d.avoid && d.avoid.length) ? `<div class="day__avoid">${d.avoid.map(a => `<div>${esc(a)}</div>`).join('')}</div>` : ''}
  </div>`;
}

function selHeadHtml(d) {
  return `<div class="selhead" style="--col:${colOf(d.city)}">
    <div class="eyebrow">${esc(d.label)} · ${esc(d.wd)} · ${esc(cityOf(d.city).n || '')}</div>
    <h2>${esc(d.title)}</h2>
    <div class="selhead__meta">sol ${esc(sunTxt(d))}${esc(travelTxt(d))}</div>
  </div>`;
}

/* — 01 · Visão geral — */

function viewInicio() {
  const { total, feitos } = progresso();
  const kpis = [
    { l: 'bases', v: '7', s: 'em 5 países', c: '#3a55a0' },
    { l: 'noites', v: '21', s: '+ 1 no trem noturno', c: '#2f6b4f' },
    { l: 'a comprar', v: String(total - feitos), s: 'de ' + total + ' itens', c: '#b4552f' },
  ];

  const modos = ['voo Lisboa → Paris (Orly)', 'TGV Lyria + Luzern-Interlaken Express', 'trem direto, 2h',
    'Nightjet, noite de 23 para 24', 'voo VIE → ZAG', 'voo ZAG → CDG', 'voo de volta, 02/01 às 20h35 de Orly'];

  const legs = D.CITIES.map((c, i) => {
    const prox = D.CITIES[i + 1];
    return `<div class="leg" style="--col:${c.col};--col2:${prox ? prox.col : c.col}">
      <div class="leg__date">${esc(c.datas)}</div>
      <div class="leg__rail">
        <div class="leg__dot"></div>
        <div class="leg__line" ${prox ? '' : 'style="min-height:0"'}></div>
      </div>
      <div class="leg__body">
        <div class="leg__name"><span>${esc(c.n)}</span><span class="leg__nights">${esc(nightsTxt(c.noites))}</span></div>
        <div class="leg__hotel">${esc(c.hotel)}</div>
        <div class="leg__mode">${esc(modos[i])}</div>
      </div>
    </div>`;
  }).join('');

  const maxN = Math.max.apply(null, D.CITIES.map(c => c.noites));
  const nights = D.CITIES.map(c => `<div class="mbar" style="--col:${c.col}">
      <div class="mbar__n">${esc(cityLabel(c))}</div>
      <div class="bar"><i style="width:${Math.round((c.noites / maxN) * 100)}%"></i></div>
      <div class="mbar__v">${c.noites}</div>
    </div>`).join('');

  const custos = [['lisboa', 10.5, '≈ 10,50 €'], ['paris1', 32.4, '32,40 €'], ['interlaken', 160, 'CHF 150 +'],
    ['zurique', 40, 'bilhetes'], ['viena', 25.2, '25,20 €'], ['zagreb', 7.5, '5–10 €'], ['paris2', 10, '≈ 10 €']];
  const costs = custos.map(([k, v, txt]) => `<div class="mbar" style="--col:${colOf(k)}">
      <div class="mbar__n">${esc(cityLabel(cityOf(k)))}</div>
      <div class="bar"><i style="width:${Math.max(6, Math.round((v / 160) * 100))}%"></i></div>
      <div class="mbar__v">${esc(txt)}</div>
    </div>`).join('');

  // Um dia por cidade, mais o Natal e o Ano-Novo.
  const vistos = {};
  const luz = DAYS.filter(d => {
    if (d.id === '2026-12-26' || d.id === '2027-01-01') return true;
    if (vistos[d.city]) return false;
    vistos[d.city] = 1;
    return true;
  }).map(d => {
    const a = mins(d.sun[0]), b = mins(d.sun[1]);
    const left = ((a - 360) / 780) * 100, w = ((b - a) / 780) * 100;
    const h = Math.floor((b - a) / 60), m = (b - a) % 60;
    return `<div class="light__row" style="--col:${colOf(d.city)}">
      <div class="mono muted" style="font-size:15.5px">${esc(d.label)}</div>
      <div class="light__track"><div class="light__span" style="left:${left.toFixed(1)}%;width:${w.toFixed(1)}%"></div></div>
      <div class="mono muted" style="font-size:15px;text-align:right">${h}h${String(m).padStart(2, '0')} de luz</div>
    </div>`;
  }).join('');

  return `<section class="rise">
    <div class="eyebrow eyebrow--rust">Roteiro de viagem · dezembro 2026</div>
    <h1 class="hero">Vinte e três dias,<br>sete bases,<br><b>nove pessoas</b>.</h1>
    <p class="lede">Lisboa, Paris, os Alpes, Viena e Zagreb — com Natal num apartamento e Réveillon a quinze minutos a pé da Torre Eiffel. Tudo o que está aqui vem do roteiro completo: horários, bilhetes, reservas e as dicas que evitam multa, fila e dinheiro jogado fora.</p>

    <div class="kpis">
      <div class="kpi kpi--dark">
        <div class="eyebrow eyebrow--gold">faltam</div>
        <div class="kpi__v"><span data-days>—</span><small> dias</small></div>
        <div class="kpi__clock" data-clock>—</div>
      </div>
      ${kpis.map(k => `<div class="kpi" style="--col:${k.c}">
        <div class="eyebrow" style="font-size:14.5px">${esc(k.l)}</div>
        <div class="kpi__v">${esc(k.v)}</div>
        <div class="kpi__s">${esc(k.s)}</div>
      </div>`).join('')}
    </div>

    <h2>O trajeto</h2>
    <div class="sub" style="margin-top:-10px">Sete bases, na ordem. Os trechos entre elas são os que exigem bilhete comprado com antecedência.</div>
    <div style="margin-top:20px">${legs}</div>

    <div class="grid2" style="margin-top:44px">
      <div class="card">
        <h3>Noites por cidade</h3>
        <div class="sub" style="margin:0 0 18px">21 noites em cama + 1 no trem noturno.</div>
        ${nights}
      </div>
      <div class="card">
        <h3>Transporte urbano, por adulto</h3>
        <div class="sub" style="margin:0 0 18px">Fora daqui, o que pesa são os trens entre países, os teleféricos e o Nightjet.</div>
        ${costs}
      </div>
    </div>

    <h2>Luz do dia</h2>
    <div class="sub" style="margin-top:-10px">Dezembro é curto e isso decide o roteiro: o pôr do sol chega às 16h07 em Viena. A barra mostra a faixa de luz de cada dia.</div>
    <div class="card" style="margin-top:20px;padding:22px 24px">
      <div class="light__scale"><span>06h</span><span>09h</span><span>12h</span><span>15h</span><span>18h</span></div>
      <div class="light__cols">${luz}</div>
    </div>
  </section>`;
}

/* — 02 · Cidades — */

function viewCidades() {
  return state.city ? cidadeDetalhe(cityOf(state.city)) : cidadeLista();
}

function cidadeLista() {
  const cards = D.CITIES.map(c => `<div class="citycard hoverable" style="--col:${c.col}">
      ${photo('foto-' + c.k, LEGENDAS[c.k] || c.n)}
      <div class="stamp">${esc(c.pais)}</div>
      <button type="button" class="citycard__body" data-city="${esc(c.k)}">
        <div class="citycard__dates">${esc(c.datas)}</div>
        <div class="citycard__n">${esc(c.n)}</div>
        <div class="citycard__sub">${esc(c.sub || '')}</div>
        <div class="pips">${c.dias.map(() => '<i></i>').join('')}</div>
        <div class="citycard__resumo">${esc(c.resumo)}</div>
        <div class="citycard__hotel">${esc(c.hotel)}</div>
        <div class="citycard__cta">ver os ${c.dias.length} dias →</div>
      </button>
    </div>`).join('');

  const side = D.SIDE_TRIPS.map(s => {
    const dia = s.k === 'plitvice' ? (PLITVICE === '29' ? '2026-12-29' : '2026-12-30') : s.dia;
    return `<div class="citycard citycard--side hoverable" style="--col:${s.col}">
      ${photo('foto-' + s.k, LEGENDAS[s.k] || s.n)}
      <button type="button" class="citycard__body citycard__body--side" data-day="${esc(dia)}">
        <div class="citycard__dates" style="font-size:15px">${esc(s.data)} · a partir de ${esc(s.base)}</div>
        <div class="citycard__n" style="font-size:30px">${esc(s.n)}</div>
        <div class="citycard__resumo" style="margin-top:8px">${esc(s.resumo)}</div>
      </button>
    </div>`;
  }).join('');

  return `<section class="rise">
    <h1>Cidades</h1>
    <div class="sub">Toque num card para abrir o roteiro dia a dia e as dicas daquela cidade.</div>
    <div class="grid2" style="margin-top:28px;gap:24px">${cards}</div>
    <h2 style="font-size:30px">Bate-voltas</h2>
    <div class="grid2" style="gap:20px">${side}</div>
  </section>`;
}

function cidadeDetalhe(c) {
  const dias = DAYS.filter(d => c.dias.indexOf(d.id) >= 0).map(d => diaCardHtml(d, c.col)).join('');
  const dicas = c.dicas.map(([h, b]) => `<div class="tip" style="--col:${c.col}">
      <div class="tip__row">
        <div class="tip__dot"></div>
        <div>
          <div class="tip__h">${esc(h)}</div>
          <div class="tip__b">${esc(b)}</div>
        </div>
      </div>
    </div>`).join('');

  return `<section class="rise">
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:22px" data-print-hide>
      <button type="button" class="btn btn--ghost" data-back-cities>← todas as cidades</button>
      <button type="button" class="btn btn--dark" data-print>Imprimir / salvar em PDF</button>
    </div>
    <div class="cityhead" style="--col:${c.col}">
      <div class="eyebrow">${esc(c.pais)} · ${esc(c.datas)} · ${esc(nightsTxt(c.noites))}</div>
      <h1>${esc(c.n)}</h1>
      ${c.sub ? `<div class="mono" style="font-size:15.5px;opacity:.8">${esc(c.sub)}</div>` : ''}
      <div class="cityhead__resumo">${esc(c.resumo)}</div>
      <div class="cityhead__hotel">${esc(c.hotel)} · entrada ${esc(c.ci)} · saída ${esc(c.co)}</div>
    </div>

    <h2 style="font-size:30px;margin-top:40px">Dia a dia</h2>
    <div class="stack">${dias}</div>

    <h2 style="font-size:30px">Dicas de ${esc(c.n)}</h2>
    <div class="grid2 grid2--tight">${dicas}</div>
  </section>`;
}

/* — 03 · Meu dia — */

function viewDia() {
  const sel = dayOf(state.date) || DAYS[0];
  const pend = pendFor(sel.id);

  return `<section class="rise">
    <h1 data-print-hide>Meu dia</h1>
    <div class="sub" data-print-hide>Escolha a data e veja só o que importa naquele dia.</div>
    <div class="daynav" data-print-hide>
      <button type="button" class="btn" data-step="-1" aria-label="Dia anterior">←</button>
      <input type="date" id="daydate" value="${esc(sel.id)}" min="2026-12-11" max="2027-01-02">
      <button type="button" class="btn" data-step="1" aria-label="Próximo dia">→</button>
      <button type="button" class="btn btn--dark" data-print>Imprimir / salvar em PDF</button>
    </div>
    <div style="margin-top:24px">
      ${selHeadHtml(sel)}
      ${sel.nota ? `<div class="sel__nota">${esc(sel.nota)}</div>` : ''}
      <div class="stack" style="gap:12px;margin-top:18px">
        ${(sel.blocks || []).map(b => blocoHtml(b, 'block--card', colOf(sel.city))).join('')}
      </div>
      ${pend.length ? `<div class="pend">
        <div class="eyebrow eyebrow--gold" style="font-size:15px">comprar ou reservar para este dia</div>
        <ul>${li(pend)}</ul>
      </div>` : ''}
    </div>
  </section>`;
}

/* — 04 · Timeline (calendário + paradas) — */

function viewTimeline() {
  const sel = dayOf(state.date) || DAYS[0];

  // O calendário começa na segunda-feira; 11/12/2026 é uma sexta.
  const lead = 4;
  const wds = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
  const cells = wds.map(w => `<div class="cal__wd">${w}</div>`).join('')
    + Array.from({ length: lead }, () => '<div class="cal__cell is-off"></div>').join('')
    + DAYS.map(d => {
      const on = d.id === sel.id;
      return `<button type="button" class="cal__cell${on ? ' is-on' : ''}" style="--col:${colOf(d.city)}" data-date="${esc(d.id)}">
        <div class="cal__d">${esc(String(+d.id.slice(8, 10)))}</div>
        <div class="cal__tag">${esc(cityOf(d.city).n || '')}</div>
      </button>`;
    }).join('');

  const col = colOf(sel.city);
  const stops = (sel.blocks || []).map((b, i) => {
    const nx = sel.blocks[i + 1];
    const slotId = 'ill-' + sel.id + '-' + i;
    // Sem foto real, a moldura é só um lembrete na tela — no papel viraria
    // um retângulo cinza vazio, então a impressão a descarta.
    const semFoto = !PHOTOS[slotId];
    const parada = `<div class="tlstop${semFoto ? ' tlstop--sem-foto' : ''}" style="--col:${col}">
      ${photo(slotId, b.h, 'photo--sm')}
      <div class="tlstop__card">
        <div class="tlstop__t">${esc(b.t)}</div>
        <div class="tlstop__h">${esc(b.h)}</div>
        <ul>${li(b.l)}</ul>
      </div>
    </div>`;
    if (!nx) return parada;
    const modo = MODO_FIXO[sel.id + '|' + nx.h] || 'a pé';
    // A seta corre entre um card e outro; o selo da condução fica por cima
    // do meio dela, cortando o tracejado.
    const ligacao = `<div class="conn" style="--col:${col}">
      <div class="conn__meio">
        <svg class="conn__seta" width="84" height="124" viewBox="0 0 84 124" fill="none" aria-hidden="true">
          <path d="M42 2 C 6 26, 78 62, 42 100" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="9 8" fill="none"></path>
          <path d="M42 112 L 33 94 L 42 99 L 51 94 Z" fill="currentColor"></path>
        </svg>
        <div class="conn__modo">
          <div class="pill"><i></i>${esc(modo)}</div>
          <span class="conn__ate">até ${esc(nx.h)}</span>
        </div>
      </div>
    </div>`;
    return parada + ligacao;
  }).join('');

  return `<section class="rise">
    <h1 data-print-hide>Timeline</h1>
    <div class="sub" data-print-hide>Clique num dia do calendário e o roteiro vira uma linha do tempo: cada parada com sua ilustração e, entre elas, a seta e a condução que liga um ponto ao outro.</div>
    <div class="card" style="margin-top:24px;padding:22px 24px" data-print-hide>
      <div class="cal">${cells}</div>
    </div>
    <div class="daynav" data-print-hide>
      <button type="button" class="btn btn--dark" data-print>Imprimir este dia / salvar em PDF</button>
      <span class="muted" style="font-size:16px">sai só o dia aberto, com as paradas e a condução entre elas</span>
    </div>
    <div style="margin-top:26px">
      ${selHeadHtml(sel)}
      <div style="margin-top:24px">${stops}</div>
    </div>
  </section>`;
}

/* — 05 · Falta comprar — */

function viewChecklist() {
  const { total, feitos, pct } = progresso();

  const blocos = D.CHECKLIST.map(b => {
    const fixo = b.k === 'b0';
    const c = b.items.filter(i => fixo || state.done[i.id]).length;
    const items = b.items.map(i => {
      const on = fixo || !!state.done[i.id];
      return `<div class="clitem${on ? ' is-done' : ''}">
        <button type="button" class="clbox${on ? ' is-on' : ''}" data-check="${esc(i.id)}" ${fixo ? 'disabled' : ''}
                aria-pressed="${on}" aria-label="${esc(i.t)}">${on ? '✓' : ''}</button>
        <div>
          <div class="clitem__t">${esc(i.t)}</div>
          ${i.n ? `<div class="clitem__n">${esc(i.n)}</div>` : ''}
          ${linksHtml(i)}
        </div>
      </div>`;
    }).join('');

    return `<div class="clblock${b.atencao ? ' clblock--alert' : ''}" style="--col:${b.tom}">
      <div class="clblock__top">
        <div>
          <div class="clblock__t">${esc(b.titulo)}</div>
          <div class="clblock__sub">${esc(b.sub)}</div>
        </div>
        <div class="clblock__stat">${c} / ${b.items.length}</div>
      </div>
      <div class="bar bar--slim"><i style="width:${Math.round((c / b.items.length) * 100)}%"></i></div>
      <div style="display:flex;flex-direction:column;gap:2px">${items}</div>
    </div>`;
  }).join('');

  return `<section class="rise">
    <h1>Falta comprar</h1>
    <div class="sub">O que está marcado fica salvo neste navegador.</div>
    <div class="progress">
      <div class="progress__top">
        <div class="eyebrow eyebrow--gold" style="font-size:15px">progresso geral</div>
        <div class="progress__pct">${pct}%</div>
      </div>
      <div class="bar bar--dark"><i style="width:${pct}%"></i></div>
      <div class="progress__foot">${feitos} de ${total} itens · faltam <span data-days>—</span> dias para embarcar</div>
    </div>
    <div class="stack" style="margin-top:24px">${blocos}</div>
    <div class="card card--dashed" style="margin-top:22px;padding:20px 24px">
      <div style="font-family:var(--display);font-size:26px">Decidido</div>
      <ul style="margin:10px 0 0;padding-left:18px;font-size:17.5px;color:var(--body)">
        <li style="margin-bottom:4px">Plitvice em <strong>${PLITVICE === '29' ? '29/12' : '30/12'}</strong>. O dia 30 segue como reserva de clima, mas o roteiro e as compras já contam com o 29.</li>
        <li>02/01 no <strong>${ULTIMO === 'orsay' ? 'Musée d’Orsay' : 'Louvre por dentro'}</strong>, das 10h às 13h, com ingresso de hora marcada comprado na véspera.</li>
      </ul>
    </div>
  </section>`;
}

/* — 06 · Falta reservar — */

function viewReservar() {
  const total = D.RESTAURANTES.length;
  const feitas = D.RESTAURANTES.filter(r => state.done[r.id]).length;
  const pct = Math.round((feitas / total) * 100);

  const linhas = D.RESTAURANTES.map(r => {
    const d = dayOf(r.dia) || {};
    const on = !!state.done[r.id];
    return `<div class="mesa${on ? ' is-done' : ''}" style="--col:${colOf(r.city)}">
      <button type="button" class="clbox${on ? ' is-on' : ''}" data-check="${esc(r.id)}"
              aria-pressed="${on}" aria-label="${esc(r.ref + ' — ' + r.local)}">${on ? '✓' : ''}</button>
      <div class="mesa__quando">
        <div class="mesa__data">${esc(r.quando || d.label || '')}</div>
        <div class="mesa__wd">${esc(r.quando ? '' : (d.wd || ''))}</div>
      </div>
      <div>
        <div class="mesa__top">
          <span class="mesa__ref">${esc(r.ref)}</span>
          <span class="mesa__local">${esc(r.local)}</span>
          ${r.urgente ? '<span class="mesa__tag">esgota</span>' : ''}
        </div>
        ${r.n ? `<div class="mesa__n">${esc(r.n)}</div>` : ''}
        ${linksHtml(r, `<button type="button" class="lnk" data-day="${esc(r.dia)}">${ICONES.dia}ver o dia</button>`)}
      </div>
    </div>`;
  }).join('');

  return `<section class="rise">
    <h1>Falta reservar</h1>
    <div class="sub">Mesas para nove. O que está marcado fica salvo neste navegador.</div>
    <div class="progress">
      <div class="progress__top">
        <div class="eyebrow eyebrow--gold" style="font-size:15px">mesas reservadas</div>
        <div class="progress__pct">${feitas} / ${total}</div>
      </div>
      <div class="bar bar--dark"><i style="width:${pct}%"></i></div>
      <div class="progress__foot">para nove pessoas, restaurante europeu quase nunca aceita quem chega de surpresa</div>
    </div>
    <div class="stack stack--tight" style="margin-top:24px">${linhas}</div>
    <div class="card card--dashed" style="margin-top:22px;padding:20px 24px">
      <div style="font-family:var(--display);font-size:26px">Ao ligar, informem sempre</div>
      <ul style="margin:10px 0 0;padding-left:18px;font-size:17.5px;color:var(--body)">
        <li style="margin-bottom:4px">Nove pessoas, com uma criança de 10 anos e uma pessoa idosa.</li>
        <li style="margin-bottom:4px">Mesa térrea e <strong>mesa única</strong> — o padrão é dividir o grupo em duas mesas distantes.</li>
        <li>Reservem de véspera, à noite, do hotel. Leva cinco minutos por dia.</li>
      </ul>
    </div>
  </section>`;
}

/* — 07 · Financeiro — */

function viewFinanceiro() {
  const f = finance();

  const grupos = f.grupos.map(g => `<div class="fingrupo" style="--col:${g.tom}">
    <div class="fingrupo__top">
      <div>
        <div class="fingrupo__t">${esc(g.titulo)}</div>
        <div class="fingrupo__itens">${esc(g.itens)}</div>
      </div>
      <div class="fin__total">
        <div class="eyebrow">adulto · família</div>
        <div>${esc(g.aTxt)} · ${esc(g.famTxt)}</div>
      </div>
    </div>
    <div class="bar bar--slim"><i style="width:${g.pct}%"></i></div>
    <div class="fingrupo__pct">${g.pct}% do total por adulto</div>
  </div>`).join('');

  return `<section class="rise">
    <h1>Financeiro</h1>
    <div class="sub" style="max-width:760px">Estimativa da viagem inteira, por grupo de gasto. Cada grupo já inclui o que está pago e o que ainda falta comprar. Valores por adulto e para uma família de dois adultos e uma criança de 10 anos.</div>

    <div class="gridfit" style="margin-top:26px">
      <div class="card card--dark">
        <div class="eyebrow" style="font-size:14.5px">total por adulto</div>
        <div class="fin__v">${esc(f.adulto)}</div>
        <div class="kpi__s">a viagem inteira, do embarque à volta</div>
      </div>
      <div class="card card--dark">
        <div class="eyebrow" style="font-size:14.5px">2 adultos + 1 criança</div>
        <div class="fin__v">${esc(f.familia)}</div>
        <div class="kpi__s">criança de 10 anos, com meia-entrada e Swiss Family Card</div>
      </div>
      <div class="card" style="--col:#2f6b4f">
        <div class="eyebrow eyebrow--col" style="font-size:14.5px">por dia, por adulto</div>
        <div class="fin__v" style="color:#2f6b4f">${esc(f.porDia)}</div>
        <div class="kpi__s">média dos 23 dias, com tudo diluído</div>
      </div>
    </div>

    <div class="stack" style="margin-top:24px">${grupos}</div>

    <div class="card card--dark fin__notes" style="margin-top:22px">
      <div style="font-family:var(--display);font-size:26px">Como ler estes números</div>
      <ul>
        <li>Tudo aqui é estimativa da viagem completa. O que já foi pago não aparece à parte: está somado dentro do grupo a que pertence.</li>
        <li>Câmbio usado: 1 € = R$ ${esc(f.eur)} e 1 CHF = R$ ${esc(f.chf)}.</li>
        <li>A coluna por adulto considera a criança como 0,75 de um adulto no que é rateado, e como meia-entrada ou gratuidade onde a tarifa prevê.</li>
        <li>Alimentação estimada por base: mais barata em Viena e Zagreb (apartamento e mercado), mais cara na Suíça. Café da manhã de hotel não entra onde já está incluso.</li>
        <li>Compras e imprevistos carrega uma reserva. Se nada der errado, ela volta para casa com vocês.</li>
      </ul>
    </div>
  </section>`;
}

/* — 07 · Prático — */

function viewPratico() {
  const reservas = D.RESERVAS.map(r => `<div class="res" style="--col:${r.col}">
      <div>
        <div class="res__n">${esc(r.n)} <span>${esc(r.sub || '')}</span></div>
        <div class="res__hotel">${esc(r.hotel)}</div>
      </div>
      <div class="res__dates">entrada ${esc(r.ci)}<br>saída ${esc(r.co)} · ${esc(nightsTxt(r.noites))}</div>
    </div>`).join('');

  const transporte = D.TRANSPORTE.map(t => `<div class="trans" style="--col:${colOf(t.city)}">
      <div class="trans__top">
        <div class="trans__n">${esc(cityLabel(cityOf(t.city)))}</div>
        <div class="trans__custo">${esc(t.custo)}</div>
      </div>
      <div class="trans__comprar">${esc(t.comprar)}</div>
      <div class="trans__app">app: ${esc(t.app)}</div>
      <ul>${li(t.notas)}</ul>
    </div>`).join('');

  const apps = D.APPS.map(([pais, txt]) => `<div class="app"><div class="app__pais">${esc(pais)}</div><div>${esc(txt)}</div></div>`).join('');
  const uber = D.UBER_GANHA.map(([quando, txt]) => `<div class="uber"><div class="uber__q">${esc(quando)}</div><div>${esc(txt)}</div></div>`).join('');
  const regras = D.REGRAS_MESA.map(([h, b]) => `<div class="rule"><div class="rule__h">${esc(h)}</div><div class="rule__b">${esc(b)}</div></div>`).join('');

  return `<section class="rise">
    <h1>Prático</h1>
    <div class="sub">Reservas, bilhetes, apps e as regras de mesa para nove pessoas.</div>

    <h2 style="font-size:30px;margin-top:38px">Reservas e hospedagens</h2>
    <div class="stack stack--tight">
      ${reservas}
      <div class="res res--night">Trem noturno Nightjet · Zurique → Viena · noite de 23 para 24/12 · compartimento privativo comfort</div>
    </div>

    <h2 style="font-size:30px">Transporte, cidade por cidade</h2>
    <div class="sub" style="margin-top:-10px">Regra que vale nas seis cidades: comprem sempre ANTES de embarcar. Não há catraca de entrada em tram ou ônibus — a fiscalização é aleatória e posterior, e a multa é alta.</div>
    <div class="grid2 grid2--tight" style="margin-top:20px">${transporte}</div>

    <div class="grid2" style="margin-top:40px">
      <div>
        <h2 style="font-size:28px;margin:0 0 12px">Apps para instalar no Brasil</h2>
        <div class="sub" style="margin-bottom:14px">Criar conta antes de embarcar. Fazer isso num aeroporto europeu, com nove pessoas e wi-fi ruim, é o pior momento possível.</div>
        <div style="display:flex;flex-direction:column;gap:6px">${apps}</div>

        <h2 style="font-size:28px;margin:34px 0 12px">Onde o carro ganha do metrô</h2>
        <div class="sub" style="margin-bottom:14px">Com nove pessoas, dois carros custam pouco mais que nove bilhetes — e às vezes menos.</div>
        <div style="display:flex;flex-direction:column;gap:5px">${uber}</div>
      </div>
      <div>
        <h2 style="font-size:28px;margin:0 0 12px">Mesa para nove</h2>
        <div style="display:flex;flex-direction:column;gap:10px">${regras}</div>
      </div>
    </div>
  </section>`;
}

/* — 08 · Roteiro completo — */

function viewCompleto() {
  const chips = [['all', 'todos os dias']].concat(D.CITIES.map(c => [c.k, cityLabel(c)]))
    .map(([k, label]) => `<button type="button" class="chip${state.filter === k ? ' is-on' : ''}"
        style="--col:${k === 'all' ? '#241f1a' : colOf(k)}" data-filter="${esc(k)}">${esc(label)}</button>`).join('');

  const itens = DAYS.filter(d => state.filter === 'all' || d.city === state.filter).map(d => {
    const aberto = !!state.openDays[d.id];
    return `<div class="tl__item" style="--col:${colOf(d.city)}">
      <div class="tl__dot"></div>
      ${d.travel ? `<div class="tl__travel">↳ ${esc(d.travel.from + ' → ' + d.travel.to + ' · ' + d.travel.mode)}</div>` : ''}
      <button type="button" class="tl__head${aberto ? ' is-open' : ''}" data-toggle="${esc(d.id)}" aria-expanded="${aberto}">
        <span class="day__head">
          <span class="day__label">${esc(d.label)}</span>
          <span class="day__title" style="font-size:24px">${esc(d.title)}</span>
          <span class="mono muted" style="font-size:15px">${esc(cityOf(d.city).n || '')} · ${esc(d.wd)}</span>
        </span>
        <span class="tl__sign">${aberto ? '−' : '+'}</span>
      </button>
      ${aberto ? `<div class="tl__body">${(d.blocks || []).map(b => blocoHtml(b)).join('')}</div>` : ''}
    </div>`;
  }).join('');

  return `<section class="rise">
    <h1>Roteiro completo</h1>
    <div class="sub">Os 23 dias em ordem. Toque num dia para expandir.</div>
    <div class="chips" data-print-hide>${chips}</div>
    <div class="tl">
      <div class="tl__rail"></div>
      <div class="tl__list">${itens}</div>
    </div>
  </section>`;
}

/* — busca — */

function renderResults() {
  const q = state.q.trim().toLowerCase();
  const out = [];
  DAYS.forEach(d => {
    const hay = [];
    (d.blocks || []).forEach(b => { hay.push(b.h); (b.l || []).forEach(l => hay.push(l)); });
    const hit = hay.find(h => String(h).toLowerCase().includes(q));
    const titleHit = String(d.title).toLowerCase().includes(q);
    if (hit || titleHit) out.push({ d, snippet: (hit || d.title).slice(0, 210) });
  });

  const label = out.length + (out.length === 1 ? ' dia encontrado' : ' dias encontrados');
  return `<section class="rise">
    <div class="eyebrow">${label}</div>
    <div class="results">
      ${out.map(({ d, snippet }) => `<button type="button" class="result hoverable" style="--col:${colOf(d.city)}" data-day="${esc(d.id)}">
        <div class="result__head">
          <span class="result__label">${esc(d.label)}</span>
          <span class="result__title">${esc(d.title)}</span>
        </div>
        <div class="result__snippet">${esc(snippet)}</div>
      </button>`).join('')}
    </div>
  </section>`;
}

/* ══════════════════════════════════════════════════════════════
   6. Roteamento e render
   ══════════════════════════════════════════════════════════════ */

const TELAS = {
  inicio: viewInicio,
  cidades: viewCidades,
  dia: viewDia,
  timeline: viewTimeline,
  checklist: viewChecklist,
  reservar: viewReservar,
  financeiro: viewFinanceiro,
  pratico: viewPratico,
  completo: viewCompleto,
};

const elView = $('#view');
const elResults = $('#results');
const elQ = $('#q');
const elClear = $('#clearq');

// Endereço: #/tela ou #/tela/parametro — cada tela é linkável.
function aplicarHash() {
  const partes = location.hash.replace(/^#\/?/, '').split('/');
  const tela = TELAS[partes[0]] ? partes[0] : 'inicio';
  let p = '';
  try { p = decodeURIComponent(partes[1] || ''); } catch (e) { p = ''; }

  state.view = tela;
  if (tela === 'cidades') state.city = D.CITIES.some(c => c.k === p) ? p : null;
  if (tela === 'dia' || tela === 'timeline') { if (dayOf(p)) state.date = p; }
  if (tela === 'completo') state.filter = (p === 'all' || D.CITIES.some(c => c.k === p)) ? p : 'all';

  render();
}

function ir(tela, param, opts) {
  const alvo = '#/' + tela + (param ? '/' + encodeURIComponent(param) : '');
  if (!(opts && opts.keepScroll)) window.scrollTo(0, 0);
  if (location.hash === alvo) aplicarHash();
  else location.hash = alvo;
}

function render() {
  const busca = state.q.trim().length > 1;

  document.querySelectorAll('#navlist button').forEach(b => {
    b.classList.toggle('is-on', !busca && b.dataset.go === state.view);
  });

  elClear.hidden = !busca;
  elResults.innerHTML = busca ? renderResults() : '';
  elView.hidden = busca;
  elView.innerHTML = busca ? '' : TELAS[state.view]();

  atualizarContadores();
}

// Contador e progresso aparecem em vários lugares; atualizados sem re-render.
function atualizarContadores() {
  const c = countdown();
  const pct = progresso().pct;
  document.querySelectorAll('[data-days]').forEach(el => { el.textContent = c.dias; });
  document.querySelectorAll('[data-clock]').forEach(el => { el.textContent = c.relogio; });
  document.querySelectorAll('[data-pct]').forEach(el => { el.textContent = pct; });
}

/* ══════════════════════════════════════════════════════════════
   7. Eventos
   ══════════════════════════════════════════════════════════════ */

document.addEventListener('click', ev => {
  const alvo = sel => ev.target.closest(sel);
  let el;

  // Navegar sai da busca: caso contrário a tela escolhida ficaria escondida
  // atrás dos resultados.
  if ((el = alvo('[data-go]'))) { state.q = ''; elQ.value = ''; return ir(el.dataset.go); }
  if ((el = alvo('[data-city]'))) return ir('cidades', el.dataset.city);
  if (alvo('[data-back-cities]')) return ir('cidades');
  if ((el = alvo('[data-day]'))) { state.q = ''; elQ.value = ''; return ir('dia', el.dataset.day); }
  if ((el = alvo('[data-date]'))) return ir(state.view, el.dataset.date, { keepScroll: true });
  if ((el = alvo('[data-filter]'))) return ir('completo', el.dataset.filter, { keepScroll: true });
  if (alvo('[data-print]')) return window.print();

  if ((el = alvo('[data-step]'))) {
    const i = DAYS.findIndex(d => d.id === state.date);
    const alvoDia = DAYS[Math.min(DAYS.length - 1, Math.max(0, i + (+el.dataset.step)))];
    return ir('dia', alvoDia.id, { keepScroll: true });
  }

  if ((el = alvo('[data-toggle]'))) {
    const id = el.dataset.toggle;
    state.openDays[id] = !state.openDays[id];
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
    return;
  }

  if ((el = alvo('[data-check]'))) {
    const id = el.dataset.check;
    state.done[id] = !state.done[id];
    save();
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }
});

document.addEventListener('change', ev => {
  if (ev.target.id === 'daydate' && dayOf(ev.target.value)) ir('dia', ev.target.value, { keepScroll: true });
});

let debounce;
elQ.addEventListener('input', () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => { state.q = elQ.value; render(); }, 120);
});

elClear.addEventListener('click', () => { elQ.value = ''; state.q = ''; render(); elQ.focus(); });

window.addEventListener('hashchange', aplicarHash);

/* ══════════════════════════════════════════════════════════════
   8. Boot
   ══════════════════════════════════════════════════════════════ */

load();
aplicarHash();
setInterval(atualizarContadores, 1000);

const boot = document.getElementById('boot');
if (boot) boot.remove();
