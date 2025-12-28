
import jsPDF from 'jspdf';
import { Bill, BillSettings } from '@/lib/types';
import { format } from 'date-fns';

const addHindiFonts = async (doc: jsPDF) => {
  try {
    const fonts = [
      {
        url: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-400-normal.woff',
        name: 'NotoSansDevanagari-Regular.ttf',
        style: 'normal'
      },
      {
        url: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-700-normal.woff',
        name: 'NotoSansDevanagari-Bold.ttf',
        style: 'bold'
      }
    ];

    await Promise.all(fonts.map(async (font) => {
      const response = await fetch(font.url);
      if (!response.ok) throw new Error(`Failed to fetch font ${font.style}`);
      const buffer = await response.arrayBuffer();

      const base64String = btoa(
        new Uint8Array(buffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      doc.addFileToVFS(font.name, base64String);
      doc.addFont(font.name, 'NotoSansDevanagari', font.style);
    }));

    return true;
  } catch (error) {
    console.error('Error loading Hindi fonts:', error);
    return false;
  }
};

export const generateBillPDF = async (bill: Bill, settings: BillSettings | null, customerAddress?: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Load fonts
  const fontsLoaded = await addHindiFonts(doc);
  const fontName = fontsLoaded ? 'NotoSansDevanagari' : 'helvetica';

  // -- HEADER --
  // Company Name
  doc.setFontSize(22);
  doc.setFont(fontName, "bold");

  const companyName = settings?.company_name || "JMD ENTERPRISES";
  const companyNameWidth = doc.getTextWidth(companyName);
  doc.text(companyName, (pageWidth - companyNameWidth) / 2, yPos);
  yPos += 8;

  // Company Details
  doc.setFontSize(10);
  doc.setFont(fontName, "normal");

  if (settings?.company_address) {
    const addressLines = doc.splitTextToSize(settings.company_address, pageWidth - (margin * 2));
    addressLines.forEach((line: string) => {
      const lineWidth = doc.getTextWidth(line);
      doc.text(line, (pageWidth - lineWidth) / 2, yPos);
      yPos += 5;
    });
  }

  const contactInfo = [
     settings?.company_mobile ? `Mobile: ${settings.company_mobile}` : '',
     settings?.company_email ? `Email: ${settings.company_email}` : '',
     settings?.company_gst ? `GSTIN: ${settings.company_gst}` : ''
  ].filter(Boolean).join(' | ');

  if (contactInfo) {
     const infoWidth = doc.getTextWidth(contactInfo);
     doc.text(contactInfo, (pageWidth - infoWidth) / 2, yPos);
     yPos += 10;
  }

  // Divider
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // -- BILL INFO --
  doc.setFontSize(12);
  doc.setFont(fontName, "bold");
  doc.text("INVOICE", margin, yPos);

  doc.setFont(fontName, "normal");
  doc.setFontSize(10);

  // Right side: Date & Bill No
  const billNoText = `Bill No: ${bill.bill_number}`;
  const dateText = `Date: ${format(new Date(bill.date), 'dd/MM/yyyy')}`;

  const billNoWidth = doc.getTextWidth(billNoText);
  const dateWidth = doc.getTextWidth(dateText);

  doc.text(billNoText, pageWidth - margin - billNoWidth, yPos);
  doc.text(dateText, pageWidth - margin - dateWidth, yPos + 5);

  // Left side: Customer
  yPos += 10;
  doc.text(`Customer Name: ${bill.customer_name}`, margin, yPos);

  if (customerAddress) {
    yPos += 5;
    doc.setFontSize(9);
    const addressLines = doc.splitTextToSize(`Address: ${customerAddress}`, (pageWidth / 2) - margin);
    addressLines.forEach((line: string) => {
      doc.text(line, margin, yPos);
      yPos += 4;
    });
    doc.setFontSize(10);
  }

  yPos += 10;

  // -- TABLE HEADER --
  const cols = [
    { header: "SN", x: margin, width: 10 },
    { header: "Description", x: margin + 15, width: 80 },
    { header: "Qty", x: margin + 100, width: 20, align: 'right' as const },
    { header: "Rate", x: margin + 125, width: 25, align: 'right' as const },
    { header: "Amount", x: margin + 155, width: 35, align: 'right' as const },
  ];

  // Draw Header Background
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos - 4, pageWidth - (margin * 2), 8, 'F');

  doc.setFont(fontName, "bold");
  cols.forEach(col => {
    if (col.align === 'right') {
       doc.text(col.header, col.x + col.width, yPos + 1.5, { align: 'right' });
    } else {
       doc.text(col.header, col.x, yPos + 1.5);
    }
  });

  yPos += 8;

  // -- TABLE BODY --
  doc.setFont(fontName, "normal");

  bill.items?.forEach((item, index) => {
     const sn = (index + 1).toString();
     const desc = item.product_name;
     const qty = item.quantity.toString();
     const rate = item.rate.toFixed(2);
     const amount = item.amount.toFixed(2);

     if (cols[2].align === 'right') doc.text(qty, cols[2].x + cols[2].width, yPos, { align: 'right' });
     if (cols[3].align === 'right') doc.text(rate, cols[3].x + cols[3].width, yPos, { align: 'right' });
     if (cols[4].align === 'right') doc.text(amount, cols[4].x + cols[4].width, yPos, { align: 'right' });

     doc.text(sn, cols[0].x, yPos);
     doc.text(desc, cols[1].x, yPos);

     yPos += 7;
  });

  // Divider
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // -- TOTALS --
  const rightColX = pageWidth - margin - 40;
  const valX = pageWidth - margin;

  doc.text("Subtotal:", rightColX, yPos);
  doc.text(bill.subtotal.toFixed(2), valX, yPos, { align: 'right' });
  yPos += 6;

  if (bill.discount_amount > 0) {
    doc.text("Discount:", rightColX, yPos);
    doc.text(`-${bill.discount_amount.toFixed(2)}`, valX, yPos, { align: 'right' });
    yPos += 6;
  }

  if (bill.tax_amount > 0) {
    doc.text("Tax:", rightColX, yPos);
    doc.text(`+${bill.tax_amount.toFixed(2)}`, valX, yPos, { align: 'right' });
    yPos += 6;
  }

  doc.setFont(fontName, "bold");
  doc.setFontSize(12);
  doc.text("Total:", rightColX, yPos);
  doc.text(bill.total_amount.toFixed(2), valX, yPos, { align: 'right' });
  yPos += 10;

  // -- FOOTER --
  doc.setFontSize(9);
  doc.setFont(fontName, "normal");

  const footerMessage = settings?.footer_message || "Thank you for your business!";
  const footerLines = doc.splitTextToSize(footerMessage, pageWidth - (margin * 2));

  footerLines.forEach((line: string) => {
      doc.text(line, margin, yPos);
      yPos += 5;
  });

  // Save
  doc.save(`Invoice_${bill.bill_number}.pdf`);
};
