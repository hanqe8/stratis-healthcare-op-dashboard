export type BriefExportFormat = "Markdown" | "PDF" | "DOCX";

export interface BriefExportGraph {
  title: string;
  svg: string;
}

interface ParsedBrief {
  title: string;
  intro: string[];
  sections: Array<{ title: string; lines: string[] }>;
}

function parseBrief(brief: string): ParsedBrief {
  const lines = brief.split("\n").filter((line) => line.trim().length > 0);
  let title = "Operating Brief";
  let currentSection: { title: string; lines: string[] } | null = null;
  const intro: string[] = [];
  const sections: Array<{ title: string; lines: string[] }> = [];

  for (const line of lines) {
    if (line.startsWith("# ")) {
      title = line.replace("# ", "").trim();
      continue;
    }
    if (line.startsWith("## ")) {
      currentSection = { title: line.replace("## ", "").trim(), lines: [] };
      sections.push(currentSection);
      continue;
    }
    if (currentSection) {
      currentSection.lines.push(line);
    } else {
      intro.push(line);
    }
  }

  return { title, intro, sections };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export function briefToMarkdownWithGraphs(brief: string, graphs: BriefExportGraph[]): string {
  if (graphs.length === 0) {
    return brief;
  }

  const chartMarkdown = graphs
    .map((graph) => `![${graph.title}](${svgToDataUri(graph.svg)})`)
    .join("\n\n");

  return `${brief.trim()}\n\n## Export Charts\n${chartMarkdown}\n`;
}

export function briefToHtmlDocument(brief: string, graphs: BriefExportGraph[], documentTitle = "STRATIS Operating Brief"): string {
  const parsed = parseBrief(brief);
  const sectionHtml = parsed.sections
    .map((section) => {
      const content = section.lines
        .map((line) => {
          if (line.startsWith("- ")) {
            return `<li>${escapeHtml(line.replace("- ", ""))}</li>`;
          }
          return `<p>${escapeHtml(line)}</p>`;
        })
        .join("");
      const wrapped = content.includes("<li>") ? content.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>") : content;
      return `<section><h2>${escapeHtml(section.title)}</h2>${wrapped}</section>`;
    })
    .join("");
  const graphHtml =
    graphs.length > 0
      ? `<section class="charts"><h2>Operating Charts</h2>${graphs
          .map((graph) => `<figure><figcaption>${escapeHtml(graph.title)}</figcaption>${graph.svg}</figure>`)
          .join("")}</section>`
      : "";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(documentTitle)}</title>
  <style>
    @page { margin: 18mm; }
    body { color: #192532; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.5; }
    h1 { color: #192532; font-size: 22px; margin: 0 0 16px; }
    h2 { border-bottom: 1px solid #d7dee6; color: #192532; font-size: 15px; margin: 20px 0 8px; padding-bottom: 4px; }
    p { margin: 6px 0; }
    ul { margin: 6px 0 0 18px; padding: 0; }
    li { margin: 4px 0; }
    figure { break-inside: avoid; border: 1px solid #d7dee6; border-radius: 6px; margin: 12px 0; padding: 10px; }
    figcaption { color: #18716f; font-weight: 700; margin-bottom: 8px; }
    svg { height: auto; max-width: 100%; }
  </style>
</head>
<body>
  <h1>${escapeHtml(parsed.title)}</h1>
  ${parsed.intro.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
  ${sectionHtml}
  ${graphHtml}
</body>
</html>`;
}

function textEncoder(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(target: number[], value: number): void {
  target.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(target: number[], value: number): void {
  target.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function dosTimestamp(date = new Date()): { time: number; date: number } {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: dosDate };
}

function createZip(entries: Array<{ path: string; data: Uint8Array }>): Uint8Array {
  const fileParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  const timestamp = dosTimestamp();

  for (const entry of entries) {
    const name = textEncoder(entry.path);
    const crc = crc32(entry.data);
    const local: number[] = [];
    writeUint32(local, 0x04034b50);
    writeUint16(local, 20);
    writeUint16(local, 0);
    writeUint16(local, 0);
    writeUint16(local, timestamp.time);
    writeUint16(local, timestamp.date);
    writeUint32(local, crc);
    writeUint32(local, entry.data.length);
    writeUint32(local, entry.data.length);
    writeUint16(local, name.length);
    writeUint16(local, 0);
    const localBytes = new Uint8Array([...local, ...name, ...entry.data]);
    fileParts.push(localBytes);

    const central: number[] = [];
    writeUint32(central, 0x02014b50);
    writeUint16(central, 20);
    writeUint16(central, 20);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, timestamp.time);
    writeUint16(central, timestamp.date);
    writeUint32(central, crc);
    writeUint32(central, entry.data.length);
    writeUint32(central, entry.data.length);
    writeUint16(central, name.length);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint32(central, 0);
    writeUint32(central, offset);
    centralParts.push(new Uint8Array([...central, ...name]));
    offset += localBytes.length;
  }

  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end: number[] = [];
  writeUint32(end, 0x06054b50);
  writeUint16(end, 0);
  writeUint16(end, 0);
  writeUint16(end, entries.length);
  writeUint16(end, entries.length);
  writeUint32(end, centralSize);
  writeUint32(end, centralOffset);
  writeUint16(end, 0);

  const totalLength = fileParts.reduce((sum, part) => sum + part.length, 0) + centralSize + end.length;
  const zip = new Uint8Array(totalLength);
  let cursor = 0;
  for (const part of [...fileParts, ...centralParts, new Uint8Array(end)]) {
    zip.set(part, cursor);
    cursor += part.length;
  }
  return zip;
}

function documentParagraph(text: string, style?: "Title" | "Heading1" | "ListParagraph"): string {
  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
  const renderedText = style === "ListParagraph" ? `- ${text}` : text;
  return `<w:p>${styleXml}<w:r><w:t xml:space="preserve">${escapeXml(renderedText)}</w:t></w:r></w:p>`;
}

function drawingXml(graph: BriefExportGraph, relationshipId: string, index: number): string {
  const name = escapeXml(graph.title);
  return `<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">
<wp:extent cx="5486400" cy="2743200"/><wp:effectExtent l="0" t="0" r="0" b="0"/>
<wp:docPr id="${index + 1}" name="${name}"/><wp:cNvGraphicFramePr/>
<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
<pic:pic><pic:nvPicPr><pic:cNvPr id="${index + 1}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr>
<pic:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="5486400" cy="2743200"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
</pic:pic></a:graphicData></a:graphic>
</wp:inline></w:drawing></w:r></w:p>`;
}

export function createBriefDocx(brief: string, graphs: BriefExportGraph[]): Blob {
  const parsed = parseBrief(brief);
  const body: string[] = [documentParagraph(parsed.title, "Title")];
  parsed.intro.forEach((line) => body.push(documentParagraph(line)));
  parsed.sections.forEach((section) => {
    body.push(documentParagraph(section.title, "Heading1"));
    section.lines.forEach((line) => {
      body.push(documentParagraph(line.startsWith("- ") ? line.replace("- ", "") : line, line.startsWith("- ") ? "ListParagraph" : undefined));
    });
  });
  if (graphs.length > 0) {
    body.push(documentParagraph("Operating Charts", "Heading1"));
    graphs.forEach((graph, index) => {
      body.push(documentParagraph(graph.title, "Heading1"));
      body.push(drawingXml(graph, `rId${index + 1}`, index));
    });
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
<w:body>${body.join("")}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`;

  const relationships = graphs
    .map(
      (_, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/chart-${index + 1}.svg"/>`,
    )
    .join("");

  const entries = [
    {
      path: "[Content_Types].xml",
      data: textEncoder(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="svg" ContentType="image/svg+xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`),
    },
    {
      path: "_rels/.rels",
      data: textEncoder(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rIdDocument" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`),
    },
    {
      path: "word/_rels/document.xml.rels",
      data: textEncoder(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}</Relationships>`),
    },
    { path: "word/document.xml", data: textEncoder(documentXml) },
    ...graphs.map((graph, index) => ({ path: `word/media/chart-${index + 1}.svg`, data: textEncoder(graph.svg) })),
  ];

  const zipBytes = createZip(entries);
  const zipBuffer = new ArrayBuffer(zipBytes.byteLength);
  new Uint8Array(zipBuffer).set(zipBytes);
  return new Blob([zipBuffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export async function createBriefPdf(element: HTMLElement): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: Math.min(2, window.devicePixelRatio || 1),
    useCORS: true,
  });
  const imageData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 32;
  const renderWidth = pageWidth - margin * 2;
  const renderHeight = (canvas.height * renderWidth) / canvas.width;
  let remainingHeight = renderHeight;
  let y = margin;
  const contentHeight = pageHeight - margin * 2;

  pdf.addImage(imageData, "PNG", margin, y, renderWidth, renderHeight);
  remainingHeight -= contentHeight;

  while (remainingHeight > 0) {
    pdf.addPage();
    y = margin - (renderHeight - remainingHeight);
    pdf.addImage(imageData, "PNG", margin, y, renderWidth, renderHeight);
    remainingHeight -= contentHeight;
  }

  return pdf.output("blob");
}
