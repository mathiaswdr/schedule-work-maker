import { PDFDocument } from "pdf-lib";

export async function mergePdfs(buffers: Buffer[]): Promise<Buffer> {
  const merged = await PDFDocument.create();

  for (const buf of buffers) {
    const doc = await PDFDocument.load(buf);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    for (const page of pages) {
      merged.addPage(page);
    }
  }

  const bytes = await merged.save();
  return Buffer.from(bytes);
}
