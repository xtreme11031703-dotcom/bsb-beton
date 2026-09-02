// Очень простой markdown → HTML рендер для статей блога — без внешней
// библиотеки (не хотим тянуть в проект новую зависимость и раздувать
// package.json ради текста, который пишет только админ). Поддерживает
// немногое, что реально нужно для статьи: заголовки (## и ###), абзацы,
// **жирный**, *курсив*, [ссылки](url) и простые списки ("- пункт"). Это не
// полноценный CommonMark-парсер — не годится для сложных вложенных структур,
// но для статьи блога этого достаточно.
//
// Экранируем HTML-спецсимволы из исходного текста ДО применения разметки —
// это не защита от постороннего пользовательского ввода (статьи пишет
// только администратор, у которого и так есть полный доступ к сайту и базе
// данных — это тот же уровень доверия, что и в любой обычной CMS), а просто
// подстраховка, чтобы случайный "<" или "&" в тексте статьи не сломал вёрстку
// страницы.
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderInline(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return html;
}

/** Рендерит markdown-текст статьи в HTML-строку — предполагается вывод через
 * dangerouslySetInnerHTML внутри контейнера с классом .blog-content (стили —
 * см. app/globals.css). */
export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const htmlBlocks: string[] = [];

  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];

  function flushParagraph() {
    if (paragraphBuffer.length > 0) {
      htmlBlocks.push(`<p>${renderInline(paragraphBuffer.join(' '))}</p>`);
      paragraphBuffer = [];
    }
  }

  function flushList() {
    if (listBuffer.length > 0) {
      htmlBlocks.push(`<ul>${listBuffer.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`);
      listBuffer = [];
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{2,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      htmlBlocks.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const listMatch = line.match(/^[-*]\s+(.*)$/);
    if (listMatch) {
      flushParagraph();
      listBuffer.push(listMatch[1]);
      continue;
    }

    flushList();
    paragraphBuffer.push(line);
  }

  flushParagraph();
  flushList();

  return htmlBlocks.join('\n');
}
