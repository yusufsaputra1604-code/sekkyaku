import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

function getSettings() {
  try {
    return JSON.parse(localStorage.getItem('pdfSettings') || '{}');
  } catch {
    return {};
  }
}

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return [147, 51, 234];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function addCompanyHeader(doc, settings) {
  const color = hexToRgb(settings.primaryColor || '#9333ea');

  if (settings.showLetterhead === false) {
    return 20;
  }

  const style = settings.letterheadStyle || 'modern';

  if (style === 'modern') {
    if (settings.logoUrl) {
      try { doc.addImage(settings.logoUrl, 'PNG', 20, 10, 15, 15); } catch {}
    }
    doc.setFontSize(18);
    doc.setTextColor(...color);
    doc.text(settings.companyName || 'Sekkyaku', settings.logoUrl ? 40 : 20, 20);

    if (settings.headerLine1) {
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(settings.headerLine1, settings.logoUrl ? 40 : 20, 26);
    }

    if (settings.showCompanyInfo) {
      doc.setFontSize(7);
      doc.setTextColor(120);
      const infoX = 190;
      if (settings.companyAddress) doc.text(settings.companyAddress, infoX, 12, { align: 'right' });
      if (settings.companyEmail) doc.text(settings.companyEmail, infoX, 17, { align: 'right' });
      if (settings.companyPhone) doc.text(settings.companyPhone, infoX, 22, { align: 'right' });
      if (settings.companyWebsite) doc.text(settings.companyWebsite, infoX, 27, { align: 'right' });
    }

    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    doc.line(20, 30, 190, 30);
    return 38;
  }

  if (style === 'classic') {
    const centerX = 105;
    if (settings.logoUrl) {
      try { doc.addImage(settings.logoUrl, 'PNG', centerX - 7, 8, 14, 14); } catch {}
    }
    doc.setFontSize(18);
    doc.setTextColor(...color);
    doc.text(settings.companyName || 'Sekkyaku', centerX, settings.logoUrl ? 27 : 18, { align: 'center' });

    if (settings.headerLine1) {
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(settings.headerLine1, centerX, settings.logoUrl ? 33 : 24, { align: 'center' });
    }
    if (settings.showCompanyInfo) {
      doc.setFontSize(7);
      doc.setTextColor(120);
      const infoText = [settings.companyAddress, settings.companyEmail, settings.companyPhone].filter(Boolean).join(' | ');
      doc.text(infoText, centerX, settings.logoUrl ? 38 : 29, { align: 'center' });
    }

    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    doc.line(20, 42, 190, 42);
    return 50;
  }

  if (style === 'minimal') {
    if (settings.logoUrl) {
      try { doc.addImage(settings.logoUrl, 'PNG', 20, 10, 10, 10); } catch {}
    }
    doc.setFontSize(14);
    doc.setTextColor(...color);
    doc.text(settings.companyName || 'Sekkyaku', settings.logoUrl ? 34 : 20, 18);
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.line(20, 22, 190, 22);
    return 28;
  }

  if (style === 'banner') {
    doc.setFillColor(...color);
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255);
    doc.setFontSize(20);
    doc.text(settings.companyName || 'Sekkyaku', 105, 16, { align: 'center' });

    if (settings.headerLine1) {
      doc.setFontSize(9);
      doc.text(settings.headerLine1, 105, 24, { align: 'center' });
    }

    if (settings.logoUrl) {
      try { doc.addImage(settings.logoUrl, 'PNG', 15, 7, 12, 12); } catch {}
    }

    doc.setTextColor(0);
    return 42;
  }

  return 20;
}

function addFooter(doc, settings) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(settings.footerText || 'Dokumen ini dibuat oleh Sekkyaku', 20, pageHeight - 10);
}

export function generateInvoicePDF(invoice) {
  const doc = new jsPDF();
  const settings = getSettings();
  const color = hexToRgb(settings.primaryColor || '#9333ea');

  const startY = addCompanyHeader(doc, settings);

  doc.setFontSize(24);
  doc.setTextColor(...color);
  doc.text('INVOICE', 20, startY + 5);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(invoice.invoiceNo, 20, startY + 12);

  doc.setFontSize(9);
  doc.text(`Tanggal: ${new Date(invoice.issueDate).toLocaleDateString('id-ID')}`, 20, startY + 19);
  doc.text(`Jatuh Tempo: ${new Date(invoice.dueDate).toLocaleDateString('id-ID')}`, 20, startY + 25);

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text('Kepada:', 120, startY + 5);
  doc.setFontSize(9);
  doc.text(invoice.client?.name || '-', 120, startY + 11);
  if (invoice.client?.company) doc.text(invoice.client.company, 120, startY + 17);
  if (invoice.client?.email) doc.text(invoice.client.email, 120, startY + 23);
  if (invoice.client?.phone) doc.text(invoice.client.phone, 120, startY + 29);

  const statusColors = { unpaid: [239, 68, 68], partial: [245, 158, 11], paid: [16, 185, 129] };
  const statusColor = statusColors[invoice.status] || [100, 100, 100];
  doc.setFillColor(...statusColor);
  doc.roundedRect(150, startY + 32, 40, 10, 2, 2, 'F');
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.text(invoice.status.toUpperCase(), 170, startY + 38, { align: 'center' });

  doc.setTextColor(0);
  autoTable(doc, {
    startY: startY + 48,
    head: [['Deskripsi', 'Qty', 'Harga', 'Total']],
    body: invoice.items?.map((item) => [
      item.description,
      String(item.quantity),
      formatCurrency(item.unitPrice),
      formatCurrency(item.amount),
    ]) || [],
    theme: 'grid',
    headStyles: { fillColor: color, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
  });

  const finalY = doc.lastAutoTable?.finalY || 100;
  const right = 170;

  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text('Subtotal:', right - 50, finalY + 10);
  doc.text(formatCurrency(invoice.subtotal), right, finalY + 10, { align: 'right' });

  if (invoice.tax > 0) {
    doc.text(`PPN (${invoice.tax}%):`, right - 50, finalY + 16);
    doc.text(formatCurrency((invoice.subtotal * invoice.tax) / 100), right, finalY + 16, { align: 'right' });
  }

  if (invoice.discount > 0) {
    doc.text('Diskon:', right - 50, finalY + 22);
    doc.text(`-${formatCurrency(invoice.discount)}`, right, finalY + 22, { align: 'right' });
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', right - 50, finalY + 30);
  doc.text(formatCurrency(invoice.total), right, finalY + 30, { align: 'right' });

  if (invoice.paidAmount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129);
    doc.text('Dibayar:', right - 50, finalY + 38);
    doc.text(formatCurrency(invoice.paidAmount), right, finalY + 38, { align: 'right' });

    const remaining = invoice.total - invoice.paidAmount;
    if (remaining > 0) {
      doc.setTextColor(239, 68, 68);
      doc.text('Sisa:', right - 50, finalY + 44);
      doc.text(formatCurrency(remaining), right, finalY + 44, { align: 'right' });
    }
  }

  if (settings.invoiceNotes) {
    doc.setTextColor(100);
    doc.setFontSize(8);
    const noteLines = doc.splitTextToSize(settings.invoiceNotes, 170);
    doc.text(noteLines, 20, finalY + 55);
  }

  addFooter(doc, settings);
  doc.save(`${invoice.invoiceNo}.pdf`);
}

export function generateQuotationPDF(quotation) {
  const doc = new jsPDF();
  const settings = getSettings();
  const color = hexToRgb(settings.primaryColor || '#9333ea');

  const startY = addCompanyHeader(doc, settings);

  doc.setFontSize(24);
  doc.setTextColor(...color);
  doc.text('QUOTATION', 20, startY + 5);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(quotation.quoteNo, 20, startY + 12);

  doc.setFontSize(9);
  doc.text(`Berlaku Sampai: ${new Date(quotation.validUntil).toLocaleDateString('id-ID')}`, 20, startY + 19);

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text('Kepada:', 120, startY + 5);
  doc.setFontSize(9);
  doc.text(quotation.client?.name || '-', 120, startY + 11);
  if (quotation.client?.company) doc.text(quotation.client.company, 120, startY + 17);
  if (quotation.client?.email) doc.text(quotation.client.email, 120, startY + 23);

  const statusColors = { draft: [100, 100, 100], sent: [59, 130, 246], accepted: [16, 185, 129], rejected: [239, 68, 68], converted: [147, 51, 234] };
  const statusColor = statusColors[quotation.status] || [100, 100, 100];
  doc.setFillColor(...statusColor);
  doc.roundedRect(150, startY + 26, 40, 10, 2, 2, 'F');
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.text(quotation.status.toUpperCase(), 170, startY + 32, { align: 'center' });

  doc.setTextColor(0);
  autoTable(doc, {
    startY: startY + 42,
    head: [['Deskripsi', 'Qty', 'Harga', 'Total']],
    body: quotation.items?.map((item) => [
      item.description,
      String(item.quantity),
      formatCurrency(item.unitPrice),
      formatCurrency(item.amount),
    ]) || [],
    theme: 'grid',
    headStyles: { fillColor: color, textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
  });

  const finalY = doc.lastAutoTable?.finalY || 100;
  const right = 170;

  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text('Subtotal:', right - 50, finalY + 10);
  doc.text(formatCurrency(quotation.subtotal), right, finalY + 10, { align: 'right' });

  if (quotation.tax > 0) {
    doc.text(`PPN (${quotation.tax}%):`, right - 50, finalY + 16);
    doc.text(formatCurrency((quotation.subtotal * quotation.tax) / 100), right, finalY + 16, { align: 'right' });
  }

  if (quotation.discount > 0) {
    doc.text('Diskon:', right - 50, finalY + 22);
    doc.text(`-${formatCurrency(quotation.discount)}`, right, finalY + 22, { align: 'right' });
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', right - 50, finalY + 30);
  doc.text(formatCurrency(quotation.total), right, finalY + 30, { align: 'right' });

  if (settings.quotationNotes) {
    doc.setTextColor(100);
    doc.setFontSize(8);
    const noteLines = doc.splitTextToSize(settings.quotationNotes, 170);
    doc.text(noteLines, 20, finalY + 45);
  }

  addFooter(doc, settings);
  doc.save(`${quotation.quoteNo}.pdf`);
}
