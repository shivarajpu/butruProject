import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';

// ─── Parser Types ──────────────────────────────────────────────────────────────

export type PolicyRun = { text: string; type: 'plain' | 'link'; url?: string };
export type PolicyBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; runs: PolicyRun[] }
  | { type: 'list'; ordered: boolean; items: PolicyRun[][] };

type HtmlToken =
  | { kind: 'open'; name: string; attrs: Record<string, string> }
  | { kind: 'close'; name: string }
  | { kind: 'text'; value: string }
  | { kind: 'self'; name: string };

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const PARAGRAPH_TAGS = new Set(['p']);
const LIST_TAGS = new Set(['ul', 'ol']);
const VOID_TAGS = new Set(['br', 'hr', 'img', 'input', 'source', 'meta', 'link']);

const decodeEntities = (input: string): string =>
  input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));

const parseAttrs = (raw: string): Record<string, string> => {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z:_-][a-zA-Z0-9:_-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
};

const tokenize = (html: string): HtmlToken[] => {
  const tokens: HtmlToken[] = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(html))) {
    if (m.index > lastIndex) {
      const value = decodeEntities(html.slice(lastIndex, m.index));
      if (value) tokens.push({ kind: 'text', value });
    }

    const closing = m[1] === '/';
    const name = m[2].toLowerCase();
    const selfClosing = m[4] === '/' || VOID_TAGS.has(name);

    if (selfClosing) {
      tokens.push({ kind: 'self', name });
    } else if (closing) {
      tokens.push({ kind: 'close', name });
    } else {
      tokens.push({ kind: 'open', name, attrs: parseAttrs(m[3] ?? '') });
    }

    lastIndex = m.index + m[0].length;
  }

  if (lastIndex < html.length) {
    const value = decodeEntities(html.slice(lastIndex));
    if (value) tokens.push({ kind: 'text', value });
  }

  return tokens;
};

export const htmlToPolicyBlocks = (html: string): PolicyBlock[] => {
  const tokens = tokenize(html);

  const blocks: PolicyBlock[] = [];
  let streamRuns: PolicyRun[] = [];
  let pendingLink: string | null = null;
  let currentBlock: string | null = null;
  let listType: 'ul' | 'ol' | null = null;
  let listItems: PolicyRun[][] = [];
  let inListItem = false;
  let listItemRuns: PolicyRun[] = [];
  let listDepth = 0;

  const collapseWs = (value: string) => value.replace(/[\t\r\n\f]+/g, ' ').replace(/ {2,}/g, ' ');

  const appendText = (value: string) => {
    const text = collapseWs(value);
    if (!text) return;

    if (pendingLink) {
      const last = streamRuns[streamRuns.length - 1];
      if (last && last.type === 'link' && last.url === pendingLink) {
        last.text += text;
      } else {
        streamRuns.push({ text, type: 'link', url: pendingLink });
      }
    } else {
      const last = streamRuns[streamRuns.length - 1];
      if (last && last.type === 'plain') {
        last.text += text;
      } else {
        streamRuns.push({ text, type: 'plain' });
      }
    }
  };

  const trimRuns = (runs: PolicyRun[]): PolicyRun[] => {
    const kept = runs.filter(r => r.text.length > 0);
    if (kept.length === 0) return kept;
    kept[0] = { ...kept[0], text: kept[0].text.replace(/^\s+/, '') };
    kept[kept.length - 1] = {
      ...kept[kept.length - 1],
      text: kept[kept.length - 1].text.replace(/\s+$/, ''),
    };
    return kept.filter(r => r.text.length > 0);
  };

  const flush = () => {
    const runs = trimRuns(streamRuns);
    streamRuns = [];
    if (runs.length === 0) return;

    if (inListItem) {
      listItemRuns = listItemRuns.concat(runs);
      return;
    }

    if (currentBlock && HEADING_TAGS.has(currentBlock)) {
      const text = runs.map(r => r.text).join(' ').trim();
      if (text) blocks.push({ type: 'heading', text });
      return;
    }

    blocks.push({ type: 'paragraph', runs });
  };

  for (const token of tokens) {
    switch (token.kind) {
      case 'text':
        appendText(token.value);
        break;

      case 'open':
        if (token.name === 'a') {
          pendingLink = token.attrs.href || null;
        } else if (LIST_TAGS.has(token.name)) {
          listDepth += 1;
          if (listDepth === 1) {
            flush();
            listType = token.name as 'ul' | 'ol';
            listItems = [];
          }
        } else if (token.name === 'li') {
          flush();
          inListItem = true;
          listItemRuns = [];
        } else if (PARAGRAPH_TAGS.has(token.name) || HEADING_TAGS.has(token.name)) {
          flush();
          currentBlock = token.name;
        }
        break;

      case 'self':
        if (token.name === 'br') {
          appendText('\n');
        } else if (token.name === 'hr') {
          flush();
        }
        break;

      case 'close':
        if (token.name === 'a') {
          pendingLink = null;
        } else if (token.name === 'li') {
          flush();
          if (listDepth > 0 && listItemRuns.length) {
            listItems.push(trimRuns(listItemRuns));
          }
          inListItem = false;
          listItemRuns = [];
        } else if (LIST_TAGS.has(token.name)) {
          if (listDepth > 0) listDepth -= 1;
          if (listDepth === 0 && listItems.length) {
            blocks.push({ type: 'list', ordered: listType === 'ol', items: listItems });
            listItems = [];
            listType = null;
          }
        } else if (PARAGRAPH_TAGS.has(token.name) || HEADING_TAGS.has(token.name)) {
          if (currentBlock === token.name) {
            flush();
            currentBlock = null;
          }
        }
        break;
    }
  }

  flush();
  if (listItems.length) {
    blocks.push({ type: 'list', ordered: listType === 'ol', items: listItems });
  }

  return blocks;
};

// ─── Renderer ──────────────────────────────────────────────────────────────────

type Props = {
  blocks: PolicyBlock[];
};

export default function PolicyContentView({ blocks }: Props) {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const openLink = (url?: string) => {
    if (!url) return;
    const target = url.trim();
    if (/^(tel|mailto|sms|https?):/i.test(target)) {
      Linking.openURL(target).catch(() => {});
    } else if (target.startsWith('www.')) {
      Linking.openURL(`https://${target}`).catch(() => {});
    }
  };

  const renderRuns = (runs: PolicyRun[]) => (
    <Text style={styles.bodyText}>
      {runs.map((run, i) =>
        run.type === 'link' ? (
          <Text
            key={i}
            style={styles.linkText}
            onPress={() => openLink(run.url)}>
            {run.text}
          </Text>
        ) : (
          <Text key={i}>{run.text}</Text>
        ),
      )}
    </Text>
  );

  return (
    <View>
      {blocks.map(block => {
        if (block.type === 'heading') {
          return (
            <Text key={block.text} style={styles.heading}>
              {block.text}
            </Text>
          );
        }

        if (block.type === 'list') {
          return (
            <View style={styles.listContainer} key={`list-${block.items.length}`}>
              {block.items.map((itemRuns, i) => (
                <View key={i} style={styles.listRow}>
                  <Text style={styles.bullet}>
                    {block.ordered ? `${i + 1}.` : '•'}
                  </Text>
                  {renderRuns(itemRuns)}
                </View>
              ))}
            </View>
          );
        }

        return <View key={block.runs.length}>{renderRuns(block.runs)}</View>;
      })}
    </View>
  );
}

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;

  return StyleSheet.create({
    heading: {
      fontSize: 15,
      fontFamily: fontFamily.bold,
      color: '#1B1B21',
      lineHeight: 22,
      marginTop: 4,
      marginBottom: 8,
    },
    bodyText: {
      fontSize: 13,
      color: '#5A4044',
      lineHeight: 20,
      fontFamily: fontFamily.regular,
      marginBottom: 6,
    },
    linkText: {
      color: colors.primary,
      fontFamily: fontFamily.bold,
    },
    listContainer: {
      marginBottom: 4,
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    bullet: {
      width: 18,
      fontSize: 13,
      color: colors.primary,
      lineHeight: 20,
      fontFamily: fontFamily.bold,
    },
  });
};