import PDFDocument from "pdfkit";
import { Readable } from "stream";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getFontName } from "./download-fonts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = join(__dirname, "fonts");

export interface PdfOptions {
  lang?: string;
  title?: string;
  watermark?: string;
  pageSize?: string;
}

export function createDoc(options: PdfOptions = {}): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: options.pageSize || "A4",
    margin: 50,
    info: {
      Title: options.title || "AarogyaEHR Document",
      Author: "AarogyaEHR",
      Creator: "AarogyaEHR PDF Engine",
      Producer: "PDFKit",
    },
    bufferPages: true,
  });

  registerFonts(doc, options.lang || "en");

  return doc;
}

function registerFonts(doc: PDFKit.PDFDocument, lang: string): void {
  const fontsToRegister = [
    { name: "NotoSans", file: "NotoSans-Regular.ttf" },
    { name: "NotoSansDevanagari", file: "NotoSansDevanagari-Regular.ttf" },
    { name: "NotoSansBengali", file: "NotoSansBengali-Regular.ttf" },
    { name: "NotoSansTamil", file: "NotoSansTamil-Regular.ttf" },
    { name: "NotoSansTelugu", file: "NotoSansTelugu-Regular.ttf" },
    { name: "NotoSansKannada", file: "NotoSansKannada-Regular.ttf" },
    { name: "NotoSansMalayalam", file: "NotoSansMalayalam-Regular.ttf" },
    { name: "NotoSansGurmukhi", file: "NotoSansGurmukhi-Regular.ttf" },
    { name: "NotoSansGujarati", file: "NotoSansGujarati-Regular.ttf" },
    { name: "NotoSansOriya", file: "NotoSansOriya-Regular.ttf" },
    { name: "NotoSansArabic", file: "NotoSansArabic-Regular.ttf" },
  ];

  for (const f of fontsToRegister) {
    const fontPath = join(FONTS_DIR, f.file);
    if (existsSync(fontPath)) {
      doc.registerFont(f.name, fontPath);
    }
  }

  const primaryFont = getFontName(lang);
  doc.font(primaryFont);
}

export function header(doc: PDFKit.PDFDocument, title: string, subtitle?: string): void {
  const lang = "en";
  const primaryFont = getFontName(lang);
  doc.font(primaryFont);

  doc.fontSize(18).text("AarogyaEHR", { align: "center" });
  doc.fontSize(8).fillColor("#666")
    .text("Complete EHR for Indian Hospitals & Clinics", { align: "center" })
    .fillColor("#000");
  doc.moveDown(0.3);

  doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor("#ccc").stroke();
  doc.moveDown(0.5);

  doc.fontSize(14).text(title, { align: "center" });
  if (subtitle) {
    doc.fontSize(9).fillColor("#555").text(subtitle, { align: "center" }).fillColor("#000");
  }
  doc.moveDown(0.5);
}

export function footer(doc: PDFKit.PDFDocument, generatedAt?: Date): void {
  const bottom = doc.page.height - 40;
  doc.fontSize(7).fillColor("#999");

  doc.text(
    `Generated: ${(generatedAt || new Date()).toLocaleString("en-IN")} | Page `,
    doc.page.width - 50,
    bottom,
    { align: "right" },
  );

  doc.text(
    "AarogyaEHR — Confidential Patient Document",
    50,
    bottom,
    { align: "left" },
  );

  doc.fillColor("#000");
}

export function sectionTitle(doc: PDFKit.PDFDocument, text: string): void {
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor("#1a56db").text(text).fillColor("#000");
  doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor("#dbeafe").stroke();
  doc.moveDown(0.3);
}

export function kvRow(doc: PDFKit.PDFDocument, label: string, value: string | undefined, x1 = 50, x2 = 180): void {
  const lang = "en";
  const primaryFont = getFontName(lang);
  doc.font(primaryFont);
  doc.fontSize(9).fillColor("#666").text(label, x1, doc.y, { continued: true });
  doc.fillColor("#000").text(`: ${value || "—"}`, x2);
}

export function warningBox(doc: PDFKit.PDFDocument, text: string): void {
  doc.moveDown(0.3);
  const y = doc.y;
  doc.roundedRect(50, y, doc.page.width - 100, 30, 3).fillAndStroke("#fef3c7", "#f59e0b");
  doc.fillColor("#92400e").fontSize(8).text(text, 60, y + 5, { width: doc.page.width - 120, align: "center" });
  doc.fillColor("#000");
  doc.moveDown(1);
}

export function tableHeader(doc: PDFKit.PDFDocument, columns: string[], widths: number[], startY?: number): number {
  const y = startY || doc.y;
  doc.rect(50, y, doc.page.width - 100, 18).fill("#1a56db");
  doc.fillColor("#fff").fontSize(8);

  let x = 55;
  columns.forEach((col, i) => {
    doc.text(col, x, y + 4, { width: widths[i], align: "left" });
    x += widths[i] + 5;
  });

  doc.fillColor("#000");
  return y + 18;
}

export function tableRow(doc: PDFKit.PDFDocument, values: string[], widths: number[], startY: number): number {
  const y = startY;
  doc.rect(50, y, doc.page.width - 100, 16).fill("#f8fafc");
  doc.fillColor("#000").fontSize(8);

  let x = 55;
  values.forEach((val, i) => {
    doc.text(val, x, y + 3, { width: widths[i], align: "left" });
    x += widths[i] + 5;
  });

  return y + 16;
}

export function renderWatermark(doc: PDFKit.PDFDocument, text: string): void {
  for (let i = 0; i < doc.bufferedPageRange().count; i++) {
    doc.switchToPage(i);
    doc.save();
    doc.fontSize(60).fillColor("#ddd").rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] });
    doc.text(text, doc.page.width / 2 - 150, doc.page.height / 2 - 30, { align: "center" });
    doc.restore();
  }
}

export function toBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

export function toStream(doc: PDFKit.PDFDocument): Readable {
  doc.end();
  return doc;
}
