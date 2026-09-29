const fs = require('fs');
const docx = require('docx');
const {
  Document, Paragraph, TextRun, Table, TableCell, TableRow,
  HeadingLevel, AlignmentType, WidthType, BorderStyle,
  Header, Footer, PageNumber, convertInchesToTwip, LevelFormat
} = docx;

const mdPath = 'c:\\Users\\Administrator\\Desktop\\酒店ERP\\酒店供应链ERP-PRD.md';
const outPath = 'c:\\Users\\Administrator\\Desktop\\酒店ERP\\酒店供应链ERP-PRD.docx';

const raw = fs.readFileSync(mdPath, 'utf-8');
const lines = raw.replace(/\r\n/g, '\n').split('\n');

function makeFont(size, bold = false, italic = false, font = 'Arial', eastAsia = 'Microsoft YaHei') {
  return {
    size,
    bold,
    italics: italic,
    font,
    eastAsia,
  };
}

function makeParagraph(opts) {
  return new Paragraph({
    spacing: { before: 100, after: 100, line: 276 },
    keepNext: false,
    keepLines: false,
    ...opts,
  });
}

function parseInline(text) {
  const runs = [];
  let remaining = text;
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)/g;
  let lastIndex = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      runs.push(new TextRun({
        text: text.slice(lastIndex, m.index),
        ...makeFont(24),
      }));
    }
    if (m[1]) {
      runs.push(new TextRun({
        text: m[2],
        ...makeFont(24, true),
      }));
    } else if (m[3]) {
      runs.push(new TextRun({
        text: m[4],
        ...makeFont(24, false, true),
      }));
    } else if (m[5]) {
      runs.push(new TextRun({
        text: m[6],
        font: 'Courier New',
        eastAsia: 'Courier New',
        size: 22,
      }));
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    runs.push(new TextRun({
      text: text.slice(lastIndex),
      ...makeFont(24),
    }));
  }
  if (runs.length === 0) {
    runs.push(new TextRun({ text: text || '', ...makeFont(24) }));
  }
  return runs;
}

const borders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
};

const headerFill = { fill: 'D5E8F0' };

function makeTable(rows) {
  if (!rows || rows.length === 0) return null;
  const colCount = rows[0].length;
  const totalWidth = convertInchesToTwip(6.5);
  const colWidth = Math.floor(totalWidth / colCount);
  const columnWidths = Array(colCount).fill(colWidth);

  const tableRows = rows.map((row, ri) => {
    const isHeader = ri === 0;
    const cells = row.map(cellText => {
      const runs = parseInline(cellText);
      return new TableCell({
        width: { size: colWidth, type: WidthType.DXA },
        shading: isHeader ? headerFill : undefined,
        children: [new Paragraph({
          spacing: { before: 60, after: 60 },
          children: runs.map(r => {
            const opts = { ...r };
            if (isHeader) {
              opts.bold = true;
              opts.font = 'Arial';
              opts.eastAsia = 'Microsoft YaHei';
              opts.size = 24;
            }
            return new TextRun(opts);
          }),
        })],
        borders,
      });
    });
    return new TableRow({
      children: cells,
      cantSplit: true,
      tableHeader: isHeader,
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths,
    rows: tableRows,
  });
}

const children = [];
let i = 0;
let inCodeBlock = false;
let codeLines = [];
let inTable = false;
let tableRows = [];

while (i < lines.length) {
  let line = lines[i];

  if (line.trim().startsWith('```')) {
    if (inCodeBlock) {
      const codeText = codeLines.join('\n');
      children.push(makeParagraph({
        shading: { fill: 'F5F5F5' },
        spacing: { before: 120, after: 120 },
        children: [new TextRun({
          text: codeText,
          font: 'Courier New',
          eastAsia: 'Courier New',
          size: 20,
        })],
      }));
      codeLines = [];
      inCodeBlock = false;
    } else {
      inCodeBlock = true;
    }
    i++;
    continue;
  }

  if (inCodeBlock) {
    codeLines.push(line);
    i++;
    continue;
  }

  if (line.trim().startsWith('|')) {
    const parts = line.trim().split('|').map(s => s.trim()).filter(s => s !== '');
    if (parts.every(p => /^[-:]+$/.test(p))) {
      i++;
      continue;
    }
    tableRows.push(parts);
    inTable = true;
    i++;
    continue;
  } else if (inTable) {
    const tbl = makeTable(tableRows);
    if (tbl) children.push(tbl);
    tableRows = [];
    inTable = false;
  }

  if (line.trim() === '---') {
    children.push(makeParagraph({ children: [] }));
    i++;
    continue;
  }

  if (line.trim().startsWith('#### ')) {
    const text = line.trim().slice(5);
    children.push(makeParagraph({
      heading: HeadingLevel.HEADING_4,
      children: parseInline(text).map(r => {
        const opts = { ...r, bold: true, size: 24 };
        return new TextRun(opts);
      }),
    }));
    i++;
    continue;
  }

  if (line.trim().startsWith('### ')) {
    const text = line.trim().slice(4);
    children.push(makeParagraph({
      heading: HeadingLevel.HEADING_3,
      children: parseInline(text).map(r => {
        const opts = { ...r, bold: true, size: 24 };
        return new TextRun(opts);
      }),
    }));
    i++;
    continue;
  }

  if (line.trim().startsWith('## ')) {
    const text = line.trim().slice(3);
    children.push(makeParagraph({
      heading: HeadingLevel.HEADING_2,
      children: parseInline(text).map(r => {
        const opts = { ...r, bold: true, size: 28 };
        return new TextRun(opts);
      }),
    }));
    i++;
    continue;
  }

  if (line.trim().startsWith('# ')) {
    const text = line.trim().slice(2);
    children.push(makeParagraph({
      heading: HeadingLevel.HEADING_1,
      children: parseInline(text).map(r => {
        const opts = { ...r, bold: true, size: 32 };
        return new TextRun(opts);
      }),
    }));
    i++;
    continue;
  }

  if (line.trim().startsWith('> ')) {
    const text = line.trim().slice(2);
    children.push(makeParagraph({
      shading: { fill: 'EEEEEE' },
      indent: { left: convertInchesToTwip(0.3) },
      children: parseInline(text),
    }));
    i++;
    continue;
  }

  const unorderedMatch = line.match(/^(\s*)([-*])\s+(.*)$/);
  const orderedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);

  if (unorderedMatch) {
    const indentLevel = Math.floor(unorderedMatch[1].length / 2);
    const text = unorderedMatch[3];
    children.push(makeParagraph({
      bullet: { level: Math.min(indentLevel, 8) },
      children: parseInline(text),
    }));
    i++;
    continue;
  }

  if (orderedMatch) {
    const indentLevel = Math.floor(orderedMatch[1].length / 2);
    const text = orderedMatch[3];
    children.push(makeParagraph({
      numbering: {
        reference: 'ordered-list',
        level: Math.min(indentLevel, 8),
      },
      children: parseInline(text),
    }));
    i++;
    continue;
  }

  children.push(makeParagraph({
    children: parseInline(line),
  }));
  i++;
}

if (inTable && tableRows.length > 0) {
  const tbl = makeTable(tableRows);
  if (tbl) children.push(tbl);
}

const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          right: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1),
        },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({
            text: '酒店供应链ERP系统 PRD',
            ...makeFont(20),
          })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({
            children: ['第 ', PageNumber.CURRENT, ' 页'],
            ...makeFont(20),
          })],
        })],
      }),
    },
    children,
  }],
  numbering: {
    config: [{
      reference: 'ordered-list',
      levels: Array.from({ length: 9 }, (_, lvl) => ({
        level: lvl,
        format: LevelFormat.DECIMAL,
        text: '%1.',
        alignment: AlignmentType.LEFT,
        style: {
          paragraph: {
            indent: { left: convertInchesToTwip(0.25) * (lvl + 1), hanging: convertInchesToTwip(0.25) },
          },
        },
      })),
    }],
  },
});

(async () => {
  const buffer = await docx.Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log('Done: ' + outPath);
})();
