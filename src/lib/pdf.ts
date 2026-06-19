import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

interface BillingItem {
  item_name_en: string;
  item_name_kn: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

// Helper to choose font dynamically based on string content to prevent rendering empty boxes for mixed languages
function getFontForText(text: string | null | undefined, isBold: boolean, fontExists: boolean): string {
  if (!text) return isBold ? 'Helvetica-Bold' : 'Helvetica';
  const hasKn = /[\u0C80-\u0CFF]/.test(text);
  if (hasKn) {
    return fontExists ? 'NotoSansKannada' : 'Helvetica';
  }
  return isBold ? 'Helvetica-Bold' : 'Helvetica';
}

// Spells out numeric values into capitalized English words using Indian numbering system
function numberToWords(num: number): string {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function numToWordsLessThanThousand(n: number): string {
    if (n === 0) return '';
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + ' ';
    }
    return str.trim();
  }

  if (num === 0) return 'ZERO';

  const parts: string[] = [];
  let temp = Math.floor(num);

  const crore = Math.floor(temp / 10000000);
  temp %= 10000000;
  if (crore > 0) {
    parts.push(numToWordsLessThanThousand(crore) + ' Crore');
  }

  const lakh = Math.floor(temp / 100000);
  temp %= 100000;
  if (lakh > 0) {
    parts.push(numToWordsLessThanThousand(lakh) + ' Lakh');
  }

  const thousand = Math.floor(temp / 1000);
  temp %= 1000;
  if (thousand > 0) {
    parts.push(numToWordsLessThanThousand(thousand) + ' Thousand');
  }

  if (temp > 0) {
    parts.push(numToWordsLessThanThousand(temp));
  }

  const decimal = Math.round((num % 1) * 100);
  let decimalStr = '';
  if (decimal > 0) {
    decimalStr = ' and ' + numToWordsLessThanThousand(decimal) + ' Paise';
  }

  return (parts.join(' ') + ' Rupees' + decimalStr + ' Only').replace(/\s+/g, ' ').trim().toUpperCase();
}

export function compileBilingualInvoicePDF(
  items: BillingItem[],
  sessionTitle: string,
  res: any,
  customerName: string = '',
  invoiceDate: string = '',
  destination: string = '',
  dispatchedThrough: string = '',
  termsOfDelivery: string = '',
  consigneeName: string = '',
  consigneeAddress: string = '',
  consigneeGstin: string = '',
  buyerAddress: string = '',
  buyerGstin: string = ''
) {
  // Use a custom layout format. A4 width: 595, height: 842. Margins: 30.
  const doc = new PDFDocument({ size: 'A4', margin: 30 });
  doc.pipe(res);

  const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'NotoSansKannada-Regular.ttf');
  const fontExists = fs.existsSync(fontPath);
  
  if (fontExists) {
    doc.registerFont('NotoSansKannada', fontPath);
  } else {
    console.warn(`Font file not found at ${fontPath}. Falling back to default font. Kannada script may render as broken characters.`);
  }

  const invoiceNumber = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const cgst = subtotal * 0.025; // 2.5%
  const sgst = subtotal * 0.025; // 2.5%
  const grandTotal = subtotal + cgst + sgst;

  // Render Page 1 (English Invoice)
  renderInvoicePage(doc, items, {
    lang: 'en',
    fontExists,
    invoiceNumber,
    currentDate,
    subtotal,
    cgst,
    sgst,
    grandTotal,
    customerName,
    invoiceDate,
    destination,
    dispatchedThrough,
    termsOfDelivery,
    consigneeName,
    consigneeAddress,
    consigneeGstin,
    buyerAddress,
    buyerGstin
  });

  // Render Page 2 (Kannada Invoice)
  doc.addPage();
  renderInvoicePage(doc, items, {
    lang: 'kn',
    fontExists,
    invoiceNumber,
    currentDate,
    subtotal,
    cgst,
    sgst,
    grandTotal,
    customerName,
    invoiceDate,
    destination,
    dispatchedThrough,
    termsOfDelivery,
    consigneeName,
    consigneeAddress,
    consigneeGstin,
    buyerAddress,
    buyerGstin
  });

  doc.end();
}

interface PageOptions {
  lang: 'en' | 'kn';
  fontExists: boolean;
  invoiceNumber: string;
  currentDate: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  customerName: string;
  invoiceDate: string;
  destination: string;
  dispatchedThrough: string;
  termsOfDelivery: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneeGstin: string;
  buyerAddress: string;
  buyerGstin: string;
}

function translateUnit(unit: string, lang: string): string {
  if (lang !== 'kn') return unit;
  const lower = unit.toLowerCase().trim();
  if (lower.startsWith('plate')) return 'ಪ್ಲೇಟ್';
  if (lower.startsWith('kg') || lower.startsWith('kilo')) return 'ಕೆಜಿ';
  if (lower.startsWith('pc') || lower.startsWith('piece')) return 'ನಂಬರ್';
  if (lower.startsWith('gm') || lower.startsWith('gram')) return 'ಗ್ರಾಂ';
  if (lower.startsWith('ltr') || lower.startsWith('liter')) return 'ಲೀಟರ್';
  return unit;
}

function renderInvoicePage(doc: PDFKit.PDFDocument, items: BillingItem[], opt: PageOptions) {
  const knFont = opt.fontExists ? 'NotoSansKannada' : 'Helvetica';
  const primaryFont = opt.lang === 'kn' ? knFont : 'Helvetica';
  const boldFont = opt.lang === 'kn' ? knFont : 'Helvetica-Bold';
  
  // Set font
  doc.font(primaryFont).fontSize(9).fillColor('#000000');

  // Outer Border Box
  doc.lineWidth(1).strokeColor('#000000');
  doc.rect(30, 30, 535, 782).stroke();

  // Header Details (Supplier)
  // Supplier name is in English (Helvetica-Bold) to prevent boxes
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#000000').text('N SHETTY AND CO', 35, 38);
  doc.fontSize(8).fillColor('#444444');
  
  if (opt.lang === 'kn') {
    // Render Kannada address lines
    doc.font(knFont).text('ಎನ್ ಹೆಚ್ 77, ಕುಂದಾಪುರ - 576201', 35, 52);
    
    doc.font(knFont).text('ಮೊಬೈಲ್ ನಂ: ', 35, 62);
    const mobW = doc.widthOfString('ಮೊಬೈಲ್ ನಂ: ');
    doc.font('Helvetica').text('9449824554, 8431798200', 35 + mobW, 62);

    doc.font(knFont).text('ಜಿಎಸ್‌ಟಿಐಎನ್‌: ', 35, 72);
    const gstW = doc.widthOfString('ಜಿಎಸ್‌ಟಿಐಎನ್‌: ');
    doc.font('Helvetica').text('29AIVPN6346B1ZT', 35 + gstW, 72);

    doc.font(knFont).text('ಇ ಮೇಲ್: ', 35, 82);
    const emailW = doc.widthOfString('ಇ ಮೇಲ್: ');
    doc.font('Helvetica').text('nshettycosmg@gmail.com', 35 + emailW, 82);
  } else {
    doc.font('Helvetica');
    doc.text('NH 77, Kundapura - 576201', 35, 52);
    doc.text('Mobile No: 9449824554, 8431798200', 35, 62);
    doc.text('GSTIN: 29AIVPN6346B1ZT', 35, 72);
    doc.text('Email: nshettycosmg@gmail.com', 35, 82);
  }

  // Main Tax Invoice Title on Right
  if (opt.lang === 'kn') {
    doc.font(knFont).fontSize(14).fillColor('#000000');
    doc.text('ತೆರಿಗೆ ಸರಕುಪಟ್ಟಿ', 350, 38, { width: 200, align: 'right' });
    doc.font(knFont).fontSize(8).fillColor('#666666');
    doc.text('ಸ್ವೀಕೃತದಾರರ ಮೂಲ ಪ್ರತಿ', 350, 54, { width: 200, align: 'right' });
  } else {
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000');
    doc.text('TAX INVOICE', 350, 38, { width: 200, align: 'right' });
    doc.font('Helvetica').fontSize(8).fillColor('#666666');
    doc.text('Original for Recipient', 350, 54, { width: 200, align: 'right' });
  }

  // Horizontal divider dividing Supplier Header and Consignee
  doc.strokeColor('#000000').lineWidth(0.75);
  doc.moveTo(30, 100).lineTo(565, 100).stroke();

  // Consignee Box vs. Reference Details
  // Vertical split line at x = 297.5 (exact center)
  doc.moveTo(297.5, 100).lineTo(297.5, 220).stroke();

  // Left Column (Consignee Box)
  if (opt.lang === 'kn') {
    doc.font(knFont).fontSize(8.5).fillColor('#000000').text('ಸ್ವೀಕರಿಸುವವರು:', 35, 107);
  } else {
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000').text('CONSIGNEE:-', 35, 107);
  }
  
  const defaultConsigneeName = opt.lang === 'kn' ? 'ಶ್ರೀ ದುರ್ಗಾಪರಮೇಶ್ವರಿ ದೇವಸ್ಥಾನ ಕಟೀಲು' : 'Sri Durgaparameshwari Temple Kateel';
  const defaultConsigneeAddress = opt.lang === 'kn' ? 'ಕಟೀಲು ಅಂಚೆ, ಮುಲ್ಕಿ ತಾಲೂಕು.\nದ.ಕ ಜಿಲ್ಲೆ - 574148' : 'Kateel Post, Mulki Taluk.\nD.K. District - 574148';
  const defaultConsigneeGstin = '29DAFPD7054C2ZD';

  const consName = opt.consigneeName || defaultConsigneeName;
  const consAddr = opt.consigneeAddress || defaultConsigneeAddress;
  const consGstin = opt.consigneeGstin || defaultConsigneeGstin;

  doc.fontSize(8).fillColor('#222222');
  doc.font(getFontForText(consName, false, opt.fontExists)).text(consName, 35, 120, { lineGap: 1.2, width: 250, height: 12, ellipsis: true });
  doc.font(getFontForText(consAddr, false, opt.fontExists)).text(consAddr, 35, 132, { lineGap: 1.2, width: 250, height: 24, ellipsis: true });
  
  if (opt.lang === 'kn') {
    doc.font(knFont).fontSize(8.5).text('ಜಿಎಸ್‌ಟಿಐಎನ್‌: ', 35, 158);
    const labelW = doc.widthOfString('ಜಿಎಸ್‌ಟಿಐಎನ್‌: ');
    doc.font('Helvetica').fontSize(8.5).text(consGstin, 35 + labelW, 158);
  } else {
    doc.font('Helvetica').fontSize(8.5).text(`GSTIN: ${consGstin}`, 35, 158);
  }

  // Divider inside Consignee box for Buyer
  doc.moveTo(30, 175).lineTo(297.5, 175).stroke();
  
  if (opt.lang === 'kn') {
    doc.font(knFont).fontSize(8.5).fillColor('#000000').text('ಖರೀದಿದಾರರು:', 35, 182);
  } else {
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000').text('BUYER (if other than consignee):-', 35, 182);
  }
  
  if (opt.customerName) {
    doc.font(getFontForText(opt.customerName, true, opt.fontExists)).fontSize(9).fillColor('#000000').text(opt.customerName, 35, 193);
    if (opt.buyerAddress) {
      doc.font(getFontForText(opt.buyerAddress, false, opt.fontExists)).fontSize(7.5).fillColor('#444444').text(opt.buyerAddress, 35, 203, { lineGap: 1.2, width: 250, height: 18, ellipsis: true });
    }
  } else {
    const fallbackBuyerText = opt.lang === 'kn' ? 'ಸ್ವೀಕರಿಸುವವರ ವಿವರಗಳೇ ಅನ್ವಯಿಸುತ್ತವೆ' : 'Same as Consignee Details';
    doc.font(getFontForText(fallbackBuyerText, false, opt.fontExists)).fontSize(8).fillColor('#666666').text(fallbackBuyerText, 35, 196);
  }

  // Right Column (Reference Grid)
  const refLabels = opt.lang === 'kn' ? [
    ['ಪೂರೈಕೆದಾರರ ಉಲ್ಲೇಖ', 'ಇತರ ಉಲ್ಲೇಖಗಳು'],
    ['ಖರೀದಿದಾರರ ಆದೇಶ ಸಂ.', 'ದಿನಾಂಕ'],
    ['ರವಾನೆ ಪತ್ರ ಸಂಖ್ಯೆ', 'ರವಾನೆ ದಿನಾಂಕ'],
    ['ರವಾನೆಯ ಮೂಲಕ', 'ಸ್ಥಳ'],
    ['ವಿತರಣಾ ನಿಯಮಗಳು']
  ] : [
    ['Supplier Ref.', 'Other Reference (s)'],
    ["Buyer's order No.", 'Dated :'],
    ['Dispatch Document No.', 'Delivery Note Date :'],
    ['Dispatched through :', 'Destination:'],
    ['Terms of Delivery:']
  ];

  // Draw lines and texts for reference grid
  let y = 100;
  for (let i = 0; i < 4; i++) {
    // Horizontal separators
    doc.moveTo(297.5, y + 24).lineTo(565, y + 24).stroke();
    // Vertical separators dividing in half
    doc.moveTo(431.25, y).lineTo(431.25, y + 24).stroke();

    // Text cells
    doc.font(primaryFont).fontSize(7.5).fillColor('#555555').text(refLabels[i][0], 302.5, y + 4);
    doc.font(primaryFont).fontSize(7.5).fillColor('#555555').text(refLabels[i][1], 436.25, y + 4);

    // Dynamic text values fill-in
    if (i === 0) { // Ref
      doc.font('Helvetica-Bold').fontSize(8.0).fillColor('#000000').text(opt.invoiceNumber, 302.5, y + 13);
    } else if (i === 1) { // Dated
      const dateVal = opt.invoiceDate || opt.currentDate;
      doc.font('Helvetica-Bold').fontSize(8.0).fillColor('#000000').text(dateVal, 436.25, y + 13);
    } else if (i === 3) { // Dispatch & Destination
      if (opt.dispatchedThrough) {
        doc.font(getFontForText(opt.dispatchedThrough, true, opt.fontExists)).fontSize(8.0).fillColor('#000000').text(opt.dispatchedThrough, 302.5, y + 13);
      }
      if (opt.destination) {
        doc.font(getFontForText(opt.destination, true, opt.fontExists)).fontSize(8.0).fillColor('#000000').text(opt.destination, 436.25, y + 13);
      }
    }
    
    y += 24;
  }
  // Terms of Delivery row
  doc.font(primaryFont).fontSize(7.5).fillColor('#555555').text(refLabels[4][0], 302.5, y + 4);
  const termsText = opt.termsOfDelivery || (opt.lang === 'kn' ? 'ತಕ್ಷಣ ವಿತರಣೆ' : 'Immediate Delivery');
  doc.font(getFontForText(termsText, true, opt.fontExists)).fontSize(8.0).fillColor('#000000').text(termsText, 302.5, y + 13);

  // Table Grid Section
  const tableY = 220;
  
  // Table Header Labels
  const headers = opt.lang === 'kn' 
    ? ['ಕ್ರಮ ಸಂ.', 'ಸೊತ್ತುಗಳ ವಿವರಣೆ', 'ಜಿಎಸ್‌ಟಿ ದರ', 'ಪ್ರಮಾಣ', 'ದರ', 'ಮೊತ್ತ']
    : ['Sl No.', 'Description of Goods', 'GST Rate', 'Qty', 'Rate', 'Amount'];

  doc.strokeColor('#000000').lineWidth(0.75);
  doc.moveTo(30, tableY).lineTo(565, tableY).stroke();

  // Print Header Texts
  doc.fontSize(8.5).fillColor('#000000');
  headers.forEach((hdr, idx) => {
    doc.font(getFontForText(hdr, true, opt.fontExists));
    if (idx === 0) doc.text(hdr, 30, tableY + 5, { width: 30, align: 'center' });
    else if (idx === 1) doc.text(hdr, 65, tableY + 5, { width: 230, align: 'left' });
    else if (idx === 2) doc.text(hdr, 300, tableY + 5, { width: 50, align: 'center' });
    else if (idx === 3) doc.text(hdr, 350, tableY + 5, { width: 65, align: 'right' });
    else if (idx === 4) doc.text(hdr, 415, tableY + 5, { width: 65, align: 'right' });
    else if (idx === 5) doc.text(hdr, 480, tableY + 5, { width: 80, align: 'right' });
  });

  doc.moveTo(30, tableY + 20).lineTo(565, tableY + 20).stroke();

  // Item Rows
  let itemY = tableY + 20;
  items.forEach((item, index) => {
    if (itemY < 420) {
      doc.font('Helvetica').fontSize(8.5).fillColor('#000000');
      doc.text((index + 1).toString(), 30, itemY + 5, { width: 30, align: 'center' });
      
      const descName = opt.lang === 'kn' ? (item.item_name_kn || item.item_name_en) : item.item_name_en;
      doc.font(getFontForText(descName, false, opt.fontExists)).fontSize(8.5).text(descName, 65, itemY + 5, { width: 230 });
      
      if (opt.lang === 'kn' && item.item_name_kn && item.item_name_en !== item.item_name_kn) {
        doc.font('Helvetica').fontSize(7.0).fillColor('#666666').text(`(${item.item_name_en})`, 65, itemY + 15, { width: 230 });
      }

      doc.font('Helvetica').fontSize(8.5).fillColor('#000000');
      doc.text('5%', 300, itemY + 5, { width: 50, align: 'center' });
      
      const qtyUnitText = `${item.quantity} ${translateUnit(item.unit, opt.lang)}`;
      doc.font(getFontForText(qtyUnitText, false, opt.fontExists)).text(qtyUnitText, 350, itemY + 5, { width: 65, align: 'right' });
      
      doc.font('Helvetica').text(item.unit_price.toFixed(2), 415, itemY + 5, { width: 65, align: 'right' });
      
      const itemAmt = (item.quantity * item.unit_price).toFixed(2);
      doc.text(itemAmt, 480, itemY + 5, { width: 80, align: 'right' });

      itemY += 20;
      doc.moveTo(30, itemY).lineTo(565, itemY).strokeColor('#dddddd').lineWidth(0.5).stroke();
    }
  });

  doc.strokeColor('#000000').lineWidth(0.75);

  doc.moveTo(60, tableY).lineTo(60, 440).stroke();
  doc.moveTo(300, tableY).lineTo(300, 440).stroke();
  doc.moveTo(350, tableY).lineTo(350, 440).stroke();
  doc.moveTo(415, tableY).lineTo(415, 500).stroke();
  doc.moveTo(480, tableY).lineTo(480, 500).stroke();

  doc.moveTo(30, 440).lineTo(565, 440).stroke();

  // Summary Rows Block
  const summaryY = 440;
  
  const totalLabel = opt.lang === 'kn' ? 'ಒಟ್ಟು' : 'TOTAL';
  doc.font(getFontForText(totalLabel, true, opt.fontExists)).fontSize(8.5).fillColor('#000000');
  doc.text(totalLabel, 355, summaryY + 4, { width: 120, align: 'right' });
  doc.font('Helvetica').text(opt.subtotal.toFixed(2), 480, summaryY + 4, { width: 80, align: 'right' });
  doc.moveTo(350, summaryY + 15).lineTo(565, summaryY + 15).stroke();

  doc.font('Helvetica-Bold').fontSize(8.5).text('CGST (2.5%)', 355, summaryY + 19, { width: 120, align: 'right' });
  doc.font('Helvetica').text(opt.cgst.toFixed(2), 480, summaryY + 19, { width: 80, align: 'right' });
  doc.moveTo(350, summaryY + 30).lineTo(565, summaryY + 30).stroke();

  doc.font('Helvetica-Bold').text('SGST (2.5%)', 355, summaryY + 34, { width: 120, align: 'right' });
  doc.font('Helvetica').text(opt.sgst.toFixed(2), 480, summaryY + 34, { width: 80, align: 'right' });
  doc.moveTo(350, summaryY + 45).lineTo(565, summaryY + 45).stroke();

  const grandTotalLabel = opt.lang === 'kn' ? 'ಒಟ್ಟು ಮೊತ್ತ' : 'GRAND TOTAL';
  doc.font(getFontForText(grandTotalLabel, true, opt.fontExists)).fontSize(8.5).fillColor('#000000');
  doc.text(grandTotalLabel, 305, summaryY + 49, { width: 170, align: 'right' });
  doc.font('Helvetica-Bold').text(opt.grandTotal.toFixed(2), 480, summaryY + 49, { width: 80, align: 'right' });
  doc.moveTo(30, summaryY + 60).lineTo(565, summaryY + 60).stroke();

  // Amount Chargeable in words
  const wordsY = summaryY + 60;
  const amtWordsLabel = opt.lang === 'kn' ? 'ಪಾವತಿಸಬೇಕಾದ ಒಟ್ಟು ಮೊತ್ತ (ಮಾತುಗಳಲ್ಲಿ):' : 'Amount Chargeable (in words):-';
  doc.font(getFontForText(amtWordsLabel, false, opt.fontExists)).fontSize(7.5).fillColor('#555555').text(amtWordsLabel, 35, wordsY + 4);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000').text(`INR ${numberToWords(opt.grandTotal)}`, 35, wordsY + 14, { width: 520 });
  doc.moveTo(30, wordsY + 30).lineTo(565, wordsY + 30).stroke();

  // GST Tax Breakdown Grid
  const taxY = wordsY + 30;
  
  const taxHeaders = opt.lang === 'kn'
    ? ['ಎಚ್‌ಎಸ್‌ಎನ್/ಎಸ್‌ಎಸಿ', 'ತೆರಿಗೆಗೆ ಒಳಪಡುವ ಮೌಲ್ಯ', 'ಕೇಂದ್ರ ತೆರಿಗೆ', 'ರಾಜ್ಯ ತೆರಿಗೆ', 'ಒಟ್ಟು ತೆರಿಗೆ']
    : ['HSN/SAC', 'Taxable value', 'Central Tax', 'State Tax', 'Total Tax Amount'];
  
  doc.fontSize(8).fillColor('#000000');
  taxHeaders.forEach((thdr, idx) => {
    doc.font(getFontForText(thdr, true, opt.fontExists));
    if (idx === 0) doc.text(thdr, 30, taxY + 4, { width: 110, align: 'center' });
    else if (idx === 1) doc.text(thdr, 140, taxY + 4, { width: 100, align: 'center' });
    else if (idx === 2) doc.text(thdr, 240, taxY + 2, { width: 110, align: 'center' });
    else if (idx === 3) doc.text(thdr, 350, taxY + 2, { width: 110, align: 'center' });
    else if (idx === 4) doc.text(thdr, 460, taxY + 4, { width: 105, align: 'center' });
  });

  doc.moveTo(240, taxY + 12).lineTo(460, taxY + 12).stroke();
  
  const rateLabel = opt.lang === 'kn' ? 'ದರ' : 'Rate';
  const amtLabel = opt.lang === 'kn' ? 'ಮೊತ್ತ' : 'Amount';
  doc.fontSize(7.5);
  doc.font(getFontForText(rateLabel, true, opt.fontExists)).text(rateLabel, 240, taxY + 14, { width: 45, align: 'center' });
  doc.font(getFontForText(amtLabel, true, opt.fontExists)).text(amtLabel, 285, taxY + 14, { width: 65, align: 'center' });
  doc.font(getFontForText(rateLabel, true, opt.fontExists)).text(rateLabel, 350, taxY + 14, { width: 45, align: 'center' });
  doc.font(getFontForText(amtLabel, true, opt.fontExists)).text(amtLabel, 395, taxY + 14, { width: 65, align: 'center' });

  doc.moveTo(30, taxY + 24).lineTo(565, taxY + 24).stroke();

  // Tax Table Grid Values
  const taxValY = taxY + 24;
  doc.font('Helvetica').fontSize(8).fillColor('#000000');
  doc.text('9963', 30, taxValY + 4, { width: 110, align: 'center' });
  doc.text(opt.subtotal.toFixed(2), 140, taxValY + 4, { width: 100, align: 'center' });
  doc.text('2.5%', 240, taxValY + 4, { width: 45, align: 'center' });
  doc.text(opt.cgst.toFixed(2), 285, taxValY + 4, { width: 65, align: 'center' });
  doc.text('2.5%', 350, taxValY + 4, { width: 45, align: 'center' });
  doc.text(opt.sgst.toFixed(2), 395, taxValY + 4, { width: 65, align: 'center' });
  
  const totalTax = opt.cgst + opt.sgst;
  doc.text(totalTax.toFixed(2), 460, taxValY + 4, { width: 105, align: 'center' });

  doc.moveTo(30, taxValY + 14).lineTo(565, taxValY + 14).stroke();

  // Total Tax Row
  const taxTotY = taxValY + 14;
  const taxTotalLabel = opt.lang === 'kn' ? 'ಒಟ್ಟು' : 'Total';
  doc.font(getFontForText(taxTotalLabel, true, opt.fontExists)).fontSize(8);
  doc.text(taxTotalLabel, 30, taxTotY + 4, { width: 110, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(8);
  doc.text(opt.subtotal.toFixed(2), 140, taxTotY + 4, { width: 100, align: 'center' });
  doc.text(opt.cgst.toFixed(2), 285, taxTotY + 4, { width: 65, align: 'center' });
  doc.text(opt.sgst.toFixed(2), 395, taxTotY + 4, { width: 65, align: 'center' });
  doc.text(totalTax.toFixed(2), 460, taxTotY + 4, { width: 105, align: 'center' });

  doc.moveTo(30, taxTotY + 14).lineTo(565, taxTotY + 14).stroke();

  doc.moveTo(140, taxY).lineTo(140, taxTotY + 14).stroke();
  doc.moveTo(240, taxY).lineTo(240, taxTotY + 14).stroke();
  doc.moveTo(285, taxY + 12).lineTo(285, taxTotY + 14).stroke();
  doc.moveTo(350, taxY).lineTo(350, taxTotY + 14).stroke();
  doc.moveTo(395, taxY + 12).lineTo(395, taxTotY + 14).stroke();
  doc.moveTo(460, taxY).lineTo(460, taxTotY + 14).stroke();

  // Tax amount in words
  const taxWordsY = taxTotY + 14;
  const taxAmtWordsLabel = opt.lang === 'kn' ? 'ತೆರಿಗೆ ಮೊತ್ತ (ಮಾತುಗಳಲ್ಲಿ):' : 'Tax Amount (in words):-';
  doc.font(getFontForText(taxAmtWordsLabel, false, opt.fontExists)).fontSize(7.5).fillColor('#555555').text(taxAmtWordsLabel, 35, taxWordsY + 4);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000').text(`INR ${numberToWords(totalTax)}`, 35, taxWordsY + 14, { width: 520 });
  doc.moveTo(30, taxWordsY + 30).lineTo(565, taxWordsY + 30).stroke();

  // Bottom Box details (Declaration & Bank details)
  const bottomY = taxWordsY + 30;
  
  doc.moveTo(297.5, bottomY).lineTo(297.5, bottomY + 100).stroke();
  
  if (opt.lang === 'kn') {
    doc.font(knFont).fontSize(7.5).fillColor('#555555').text("ಸಂಸ್ಥೆಯ ಪಾನ್:", 35, bottomY + 6);
    doc.font('Helvetica').fontSize(7.5).fillColor('#000000').text('AIVPN6346B', 125, bottomY + 6);
    
    doc.font(knFont).fontSize(7.5).fillColor('#555555').text("ಸಂಸ್ಥೆಯ ಜಿಎಸ್‌ಟಿಐಎನ್‌:", 35, bottomY + 16);
    doc.font('Helvetica').fontSize(7.5).fillColor('#000000').text('29AIVPN6346B1ZT', 125, bottomY + 16);

    doc.font(knFont).fontSize(7.5).fillColor('#555555').text("ಖರೀದಿದಾರರ ಜಿಎಸ್‌ಟಿಐಎನ್‌:", 35, bottomY + 26);
    const buyerGstinVal = opt.buyerGstin || '29DAFPD7054C2ZD';
    doc.font('Helvetica').fontSize(7.5).fillColor('#000000').text(buyerGstinVal, 125, bottomY + 26);
  } else {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#555555').text("Company's PAN :", 35, bottomY + 6);
    doc.font('Helvetica').fontSize(7.5).fillColor('#000000').text('AIVPN6346B', 110, bottomY + 6);
    
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#555555').text("Company's GSTIN:", 35, bottomY + 16);
    doc.font('Helvetica').fontSize(7.5).fillColor('#000000').text('29AIVPN6346B1ZT', 110, bottomY + 16);

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#555555').text("Buyer's GSTIN :", 35, bottomY + 26);
    const buyerGstinVal = opt.buyerGstin || '29DAFPD7054C2ZD';
    doc.font('Helvetica').fontSize(7.5).fillColor('#000000').text(buyerGstinVal, 110, bottomY + 26);
  }

  const declHeader = opt.lang === 'kn' ? 'ಘೋಷಣೆ:' : 'Declaration:';
  doc.font(getFontForText(declHeader, true, opt.fontExists)).fontSize(7.5).fillColor('#000000').text(declHeader, 35, bottomY + 40);
  const declarationText = opt.lang === 'kn'
    ? 'ಈ ಸರಕುಪಟ್ಟಿ ಕರ್ನಾಟಕ ಭಾರತದ ಸರಕುಗಳ ನಿಖರವಾದ ಬೆಲೆಯನ್ನು ತೋರಿಸುತ್ತದೆ ಮತ್ತು ಎಲ್ಲಾ ವಿವರಗಳು ಸತ್ಯ ಮತ್ತು ಸರಿಯಾಗಿವೆ ಎಂದು ನಾವು ಘೋಷಿಸುತ್ತೇವೆ.'
    : 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.';
  doc.font(getFontForText(declarationText, false, opt.fontExists)).fontSize(7).fillColor('#444444').text(declarationText, 35, bottomY + 50, { width: 250, lineGap: 1.5 });

  // Right: Bank Details
  if (opt.lang === 'kn') {
    doc.font(knFont).fontSize(7.5).fillColor('#000000').text("ಸಂಸ್ಥೆಯ ಬ್ಯಾಂಕ್ ವಿವರಗಳು:", 305, bottomY + 6);
    
    doc.font(knFont).fontSize(7.5).fillColor('#555555');
    doc.text('ಬ್ಯಾಂಕ್ ಹೆಸರು: ', 305, bottomY + 18);
    const bankNameW = doc.widthOfString('ಬ್ಯಾಂಕ್ ಹೆಸರು: ');
    doc.font('Helvetica-Bold').fillColor('#000000').text('Bank of Baroda', 305 + bankNameW, bottomY + 18);

    doc.font(knFont).fontSize(7.5).fillColor('#555555').text('ಖಾತೆ ಸಂಖ್ಯೆ: ', 305, bottomY + 28);
    const acNoW = doc.widthOfString('ಖಾತೆ ಸಂಖ್ಯೆ: ');
    doc.font('Helvetica-Bold').fillColor('#000000').text('82020200000101', 305 + acNoW, bottomY + 28);

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#555555').text('IFSC ', 305, bottomY + 38);
    const ifscLabelW = doc.widthOfString('IFSC ');
    doc.font(knFont).fontSize(7.5).fillColor('#555555').text('ಕೋಡ್: ', 305 + ifscLabelW, bottomY + 38);
    const codeW = doc.widthOfString('ಕೋಡ್: ');
    doc.font('Helvetica-Bold').fillColor('#000000').text('BARB0VJKUNP (0 IS ZERO)', 305 + ifscLabelW + codeW, bottomY + 38);

    doc.font(knFont).fontSize(7.5).fillColor('#555555').text('ಶಾಖೆ: ', 305, bottomY + 48);
    const branchW = doc.widthOfString('ಶಾಖೆ: ');
    doc.font('Helvetica-Bold').fillColor('#000000').text('KUNDAPURA, KARNATAKA', 305 + branchW, bottomY + 48);
  } else {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000').text("Company's Bank Details:", 305, bottomY + 6);
    
    doc.font('Helvetica').fontSize(7.5).fillColor('#555555');
    doc.text('Bank Name: ', 305, bottomY + 18);
    doc.font('Helvetica-Bold').fillColor('#000000').text('Bank of Baroda', 370, bottomY + 18);

    doc.font('Helvetica').fontSize(7.5).fillColor('#555555').text('A/C No: ', 305, bottomY + 28);
    doc.font('Helvetica-Bold').fillColor('#000000').text('82020200000101', 370, bottomY + 28);

    doc.font('Helvetica').fontSize(7.5).fillColor('#555555').text('IFSC Code: ', 305, bottomY + 38);
    doc.font('Helvetica-Bold').fillColor('#000000').text('BARB0VJKUNP (0 IS ZERO)', 370, bottomY + 38);

    doc.font('Helvetica').fontSize(7.5).fillColor('#555555').text('Branch: ', 305, bottomY + 48);
    doc.font('Helvetica-Bold').fillColor('#000000').text('KUNDAPURA, KARNATAKA', 370, bottomY + 48);
  }

  doc.moveTo(30, bottomY + 100).lineTo(565, bottomY + 100).stroke();

  // Signature Block
  const sigY = bottomY + 100;
  const sigCustLabel = opt.lang === 'kn' ? 'ಗ್ರಾಹಕರ ಸಹಿ' : "Customer's Seal and Signature";
  doc.font(getFontForText(sigCustLabel, false, opt.fontExists)).fontSize(8).fillColor('#444444').text(sigCustLabel, 35, sigY + 52);
  
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000');
  doc.text('for N SHETTY AND CO', 350, sigY + 6, { width: 200, align: 'right' });
  const sigAuthLabel = opt.lang === 'kn' ? 'ಅಧಿಕೃತ ಸಹಿ' : 'Authorized Signatory';
  doc.font(getFontForText(sigAuthLabel, false, opt.fontExists)).fontSize(8).fillColor('#444444');
  doc.text(sigAuthLabel, 350, sigY + 52, { width: 200, align: 'right' });
}
