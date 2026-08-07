import React from 'react';

/**
 * Renders admin/teacher authored text exactly as it was written:
 * paragraphs, line breaks, bullet lists, numbered lists, indentation,
 * plus lightweight **bold** / *italic* / `code` markers.
 *
 * No raw HTML is ever injected — every node is built as React elements,
 * so authored content cannot inject scripts.
 */

type Props = { text?: string | null; className?: string };

const inline = (raw: string, keyBase: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(raw))) {
    if (m.index > last) nodes.push(raw.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-i${i++}`;
    if (tok.startsWith('**') || tok.startsWith('__')) nodes.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) nodes.push(<code key={key} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em] dark:bg-slate-800">{tok.slice(1, -1)}</code>);
    else nodes.push(<em key={key}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < raw.length) nodes.push(raw.slice(last));
  return nodes;
};

export const RichText: React.FC<Props> = ({ text, className }) => {
  if (!text || !text.trim()) return null;

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[]; indents: number[] } | null = null;

  const flush = () => {
    if (!list) return;
    const items = list.items.map((it, idx) => (
      <li key={`li-${blocks.length}-${idx}`} style={{ marginInlineStart: `${list!.indents[idx] * 12}px` }}>
        {inline(it, `li-${blocks.length}-${idx}`)}
      </li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={`b${blocks.length}`} className="my-1 list-decimal space-y-0.5 ps-5">{items}</ol>
      ) : (
        <ul key={`b${blocks.length}`} className="my-1 list-disc space-y-0.5 ps-5">{items}</ul>
      ),
    );
    list = null;
  };

  lines.forEach((rawLine, idx) => {
    const indent = Math.floor((rawLine.match(/^[ \t]*/)?.[0].replace(/\t/g, '  ').length ?? 0) / 2);
    const line = rawLine.trim();

    if (!line) { flush(); return; }

    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    const numbered = /^(\d+)[.)]\s+(.*)$/.exec(line);

    if (bullet) {
      if (list && list.ordered) flush();
      list = list ?? { ordered: false, items: [], indents: [] };
      list.items.push(bullet[1]);
      list.indents.push(indent);
      return;
    }
    if (numbered) {
      if (list && !list.ordered) flush();
      list = list ?? { ordered: true, items: [], indents: [] };
      list.items.push(numbered[2]);
      list.indents.push(indent);
      return;
    }

    flush();
    blocks.push(
      <p
        key={`p${idx}`}
        className="whitespace-pre-wrap"
        style={indent ? { marginInlineStart: `${indent * 12}px` } : undefined}
      >
        {inline(line, `p${idx}`)}
      </p>,
    );
  });
  flush();

  return <div className={className ?? 'space-y-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300'}>{blocks}</div>;
};
