// Converte as apostilas Markdown em materiais/**/*.md para LaTeX usando o
// template-apostila.tex. Gera um .tex ao lado de cada .md. Sem comentários
// desnecessários; este é um utilitário de build.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = readFileSync(join(ROOT, 'template-apostila.tex'), 'utf8');
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const HOJE = new Date();
const DATA = `${HOJE.getDate()} de ${MESES[HOJE.getMonth()]} de ${HOJE.getFullYear()}`;

function esc(s) {
  const repl = {
    '\\': '\\textbackslash{}',
    '~': '\\textasciitilde{}',
    '^': '\\textasciicircum{}',
    '&': '\\&',
    '%': '\\%',
    '$': '\\$',
    '#': '\\#',
    '_': '\\_',
    '{': '\\{',
    '}': '\\}',
  };
  return s.replace(/[\\~^&%$#_{}]/g, (c) => repl[c]);
}

function inline(md) {
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let out = '';
  let last = 0;
  let m;
  while ((m = re.exec(md))) {
    out += esc(md.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('`')) out += `\\texttt{${esc(tok.slice(1, -1))}}`;
    else if (tok.startsWith('**')) out += `\\textbf{${esc(tok.slice(2, -2))}}`;
    else out += `\\textit{${esc(tok.slice(1, -1))}}`;
    last = m.index + tok.length;
  }
  out += esc(md.slice(last));
  return out;
}

function table(rows) {
  const cells = rows.map((r) => {
    let s = r.trim();
    if (s.startsWith('|')) s = s.slice(1);
    if (s.endsWith('|')) s = s.slice(0, -1);
    return s.split('|').map((c) => c.trim());
  });
  const body = cells.filter((row) => !row.every((c) => /^:?-+:?$/.test(c)));
  const ncol = Math.max(...body.map((r) => r.length));
  const spec = Array.from({ length: ncol - 1 }, () => 'l').join('') + 'X';
  let out = `\\begin{tabularx}{\\linewidth}{${spec}}\n\\toprule\n`;
  body.forEach((row, i) => {
    let c = row.map((x) => inline(x));
    while (c.length < ncol) c.push('');
    if (i === 0) c = c.map((x) => `\\textbf{${x}}`);
    out += ` ${c.join(' & ')} \\\\\n`;
    if (i === 0) out += '\\midrule\n';
  });
  out += '\\bottomrule\n\\end{tabularx}\n';
  return out;
}

function mdToLatex(md) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === '') { i++; continue; }
    if (t === '---') { out.push('\\bigskip\\hrule\\bigskip'); i++; continue; }
    if (t.startsWith('#')) {
      const level = t.match(/^#+/)[0].length;
      const txt = inline(t.replace(/^#+\s*/, ''));
      if (level === 1) out.push(`\\section*{${txt}}`);
      else if (level === 2) out.push(`\\subsection*{${txt}}`);
      else out.push(`\\subsubsection*{${txt}}`);
      i++;
      continue;
    }
    if (t.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i]); i++; }
      out.push(table(rows));
      continue;
    }
    if (t.startsWith('>')) {
      const q = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) { q.push(lines[i].trim().slice(1).trim()); i++; }
      out.push(`\\begin{alerta}\n${inline(q.join(' '))}\n\\end{alerta}`);
      continue;
    }
    if (/^[-*]\s+\[[ xX]\]/.test(t)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+\[[ xX]\]/.test(lines[i].trim())) {
        const item = [lines[i].trim().replace(/^[-*]\s+\[[ xX]\]\s*/, '')];
        i++;
        while (i < lines.length && lines[i].trim() !== '' && !/^(#|\||>|[-*]\s+|\d+\.\s+)/.test(lines[i].trim())) {
          item.push(lines[i].trim());
          i++;
        }
        items.push(inline(item.join(' ')));
      }
      out.push('\\begin{itemize}\n' + items.map((it) => `  \\item[${'$\\square$'}] ${it}`).join('\n') + '\n\\end{itemize}');
      continue;
    }
    if (/^[-*]\s+/.test(t)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        const item = [lines[i].trim().replace(/^[-*]\s+/, '')];
        i++;
        while (i < lines.length && lines[i].trim() !== '' && !/^(#|\||>|[-*]\s+|\d+\.\s+)/.test(lines[i].trim())) {
          item.push(lines[i].trim());
          i++;
        }
        items.push(inline(item.join(' ')));
      }
      out.push('\\begin{itemize}\n' + items.map((it) => `  \\item ${it}`).join('\n') + '\n\\end{itemize}');
      continue;
    }
    if (/^\d+\.\s+/.test(t)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(inline(lines[i].trim().replace(/^\d+\.\s+/, '')));
        i++;
      }
      out.push('\\begin{enumerate}\n' + items.map((it) => `  \\item ${it}`).join('\n') + '\n\\end{enumerate}');
      continue;
    }
    const para = [];
    while (i < lines.length) {
      const l = lines[i];
      if (l.trim() === '' || l.trim() === '---' || /^(#|\||>|[-*]\s+|\d+\.\s+)/.test(l.trim())) break;
      para.push(l);
      i++;
    }
    const BR = '\u0000';
    const texto = para.map((l) => (l.endsWith('  ') ? l.replace(/  $/, BR) : l)).join(' ');
    const joined = inline(texto).replaceAll(BR, ' \\\\');
    const isGabarito = para[0] && para[0].trim().startsWith('**Gabarito:');
    out.push(isGabarito ? `\\begin{alerta}\n${joined}\n\\end{alerta}` : joined);
  }
  return out.join('\n\n');
}

function capturarParagrafo(md, inicio) {
  const idx = md.indexOf(inicio);
  if (idx < 0) return '';
  const restante = md.slice(idx + inicio.length);
  const linhas = [];
  for (const l of restante.split('\n')) {
    if (l.trim() === '') break;
    linhas.push(l.trim());
  }
  return linhas.join(' ');
}

function parseMeta(md) {
  const meta = {};
  const keys = {
    'Matéria': 'materia',
    'Tema': 'tema',
    'Concursos-alvo': 'concursos',
    'Banca de referência': 'banca',
    'Bancas de referência': 'banca',
    'Base normativa': 'base',
  };
  for (const [k, field] of Object.entries(keys)) {
    const m = md.match(new RegExp(`^\\*\\*${k}:\\*\\*\\s*(.+)$`, 'm'));
    if (m) meta[field] = m[1].replace(/\s+$/, '');
  }
  meta.foco = capturarParagrafo(md, '**Regra de prova:**');
  return meta;
}

function buildApostila(mdPath) {
  const md = readFileSync(mdPath, 'utf8');
  const meta = parseMeta(md);
  const body = md.replace(/^\*\*(Matéria|Tema|Concursos-alvo|Banca de referência|Bancas de referência|Base normativa):\*\*[^\n]*\n/gm, '');
  const titulo = `Apostila — ${meta.materia || ''}: ${meta.tema || ''}`;
  const tex = TEMPLATE
    .replace('\\TITULO', titulo)
    .replace('\\SUBTITULO', meta.concursos || '')
    .replace('\\FOCO', inline(meta.foco))
    .replace('\\DATA', DATA)
    .replace('\\BANCA', meta.banca || '')
    .replace('\\CONTEUDO', mdToLatex(body));
  return tex;
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (name.endsWith('.md')) acc.push(p);
  }
  return acc;
}

const files = walk(ROOT);
for (const f of files) {
  const tex = buildApostila(f);
  const out = join(dirname(f), basename(f, '.md') + '.tex');
  writeFileSync(out, tex);
  console.log(`gerado: ${out}`);
}
console.log(`total: ${files.length} apostilas`);