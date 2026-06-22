import puppeteer, { type PDFOptions } from "puppeteer";

/**
 * Generates a PDF buffer from the provided HTML content.
 * Launches a headless Chromium browser instance, renders the HTML, and compiles it.
 */
export async function generatePdfFromHtml(htmlContent: string, options: PDFOptions = {}): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "load" });

    const defaultOptions: PDFOptions = {
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm",
      },
    };

    const mergedOptions = { ...defaultOptions, ...options };
    const pdfBuffer = await page.pdf(mergedOptions);
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
