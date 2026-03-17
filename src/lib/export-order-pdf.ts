import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (v: number) =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDoc = (doc: string) => {
  const d = (doc || '').replace(/\D/g, '');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return doc;
};

const statusLabels: Record<string, string> = {
  'EN': 'Enviado', '10': 'Digitação', '20': 'Enviado', '30': 'Aprovado',
  'AP': 'Aprovado', '40': 'Faturado', '50': 'Faturado', 'FA': 'Faturado',
  '90': 'Cancelado', 'CA': 'Cancelado', 'PC': 'Pag. Confirmado', 'PE': 'Pendente',
};

export function exportOrderPDF(order: any, items: any[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ── Header bar ──
  doc.setFillColor(23, 37, 84); // dark navy
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`PEDIDO #${order.orc_codorc_web}`, margin, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const statusLabel = statusLabels[String(order.orc_status)] || String(order.orc_status);
  doc.text(`Status: ${statusLabel}   |   Data: ${formatDate(order.orc_dta_orc)}`, margin, 22);

  if (order.orc_codorc_had > 0) {
    doc.text(`ERP: ${order.orc_codorc_had}`, margin, 28);
  }

  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth - margin, 28, { align: 'right' });

  y = 40;

  // ── Client & Order info side-by-side ──
  const colWidth = contentWidth / 2 - 2;

  // Client box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, y, colWidth, 38, 2, 2, 'F');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO CLIENTE', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.text(order.orc_nomter || order.orc_fanter || '—', margin + 4, y + 13);
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(`CNPJ/CPF: ${formatDoc(order.orc_documento)}`, margin + 4, y + 19);
  doc.text(`Código: #${order.orc_codter}`, margin + 4, y + 25);
  if (order.REPRESENTANTE) {
    doc.text(`Rep.: ${order.REPRESENTANTE}`, margin + 4, y + 31);
  }

  // Order box
  const col2X = margin + colWidth + 4;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(col2X, y, colWidth, 38, 2, 2, 'F');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALHES DO PEDIDO', col2X + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(8);
  const orderDetails = [
    `Data: ${formatDate(order.orc_dta_orc)}`,
    `Validade: ${formatDate(order.orc_dtavld)}`,
    `Forma Pgto: ${order.orc_codcpg || '—'}`,
    `Frete: ${order.orc_tp_fre || 'CIF'}`,
  ];
  orderDetails.forEach((text, i) => {
    doc.text(text, col2X + 4, y + 13 + i * 6);
  });

  y += 44;

  // ── Address row ──
  const hasDeliveryAddr = !!order.orc_end_etg;

  const addrBoxW = hasDeliveryAddr ? colWidth : contentWidth;
  doc.setFillColor(250, 251, 252);
  doc.roundedRect(margin, y, addrBoxW, 24, 2, 2, 'F');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('ENDEREÇO DE COBRANÇA', margin + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(7.5);
  const billingAddr = [
    `${order.orc_end_lgr || ''}${order.orc_numlgr ? ', ' + order.orc_numlgr : ''}`,
    `${order.orc_bailgr ? order.orc_bailgr + ' - ' : ''}${order.orc_cidlgr || ''}/${order.orc_uflgr || ''}`,
    order.orc_ceplgr ? `CEP ${order.orc_ceplgr}` : '',
  ].filter(Boolean);
  billingAddr.forEach((line, i) => {
    doc.text(line, margin + 4, y + 11 + i * 4);
  });

  if (hasDeliveryAddr) {
    doc.setFillColor(250, 251, 252);
    doc.roundedRect(col2X, y, colWidth, 24, 2, 2, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('ENDEREÇO DE ENTREGA', col2X + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(7.5);
    const deliveryAddr = [
      `${order.orc_end_etg}${order.orc_num_etg ? ', ' + order.orc_num_etg : ''}`,
      `${order.orc_bai_etg ? order.orc_bai_etg + ' - ' : ''}${order.orc_cid_etg || ''}/${order.orc_uf_etg || ''}`,
      order.orc_cep_etg ? `CEP ${order.orc_cep_etg}` : '',
    ].filter(Boolean);
    deliveryAddr.forEach((line, i) => {
      doc.text(line, col2X + 4, y + 11 + i * 4);
    });
  }

  y += 30;

  // ── Items table ──
  const tableData = items.map((item: any) => [
    String(item.oit_codpro),
    item.oit_despro,
    item.oit_undpro || 'UN',
    String(item.oit_qtdoit),
    formatCurrency(item.oit_prcpro),
    formatCurrency(item.oit_qtdoit * item.oit_prcpro),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['SKU', 'Produto', 'Un.', 'Qtde', 'Preço Un.', 'Total']],
    body: tableData,
    headStyles: {
      fillColor: [23, 37, 84],
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [248, 249, 252],
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    theme: 'plain',
    styles: {
      lineColor: [220, 225, 235],
      lineWidth: 0.2,
    },
    didDrawPage: () => {},
  });

  // ── Totals box ──
  const finalY = (doc as any).lastAutoTable?.finalY || y + 20;
  const totalsY = finalY + 6;
  const totalsW = 70;
  const totalsX = pageWidth - margin - totalsW;

  const totalPeso = items.reduce((s: number, i: any) => s + (i.oit_qtdoit * (i.oit_peso_liq || 0)), 0);
  const totalItens = items.reduce((s: number, i: any) => s + (i.oit_qtdoit * i.oit_prcpro), 0);
  const valorTotal = order.orc_vlrorc || totalItens;

  doc.setFillColor(245, 247, 250);
  doc.roundedRect(totalsX, totalsY, totalsW, 30, 2, 2, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  const rows = [
    ['Itens:', `${items.length}`],
    ['Peso Total:', `${totalPeso.toFixed(1)} Kg`],
    ['Subtotal:', formatCurrency(totalItens)],
  ];

  rows.forEach(([label, value], i) => {
    doc.text(label, totalsX + 4, totalsY + 7 + i * 5);
    doc.setTextColor(40, 40, 40);
    doc.text(value, totalsX + totalsW - 4, totalsY + 7 + i * 5, { align: 'right' });
    doc.setTextColor(100, 100, 100);
  });

  // Total line
  doc.setDrawColor(23, 37, 84);
  doc.setLineWidth(0.3);
  doc.line(totalsX + 4, totalsY + 22, totalsX + totalsW - 4, totalsY + 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(23, 37, 84);
  doc.text('TOTAL', totalsX + 4, totalsY + 28);
  doc.text(formatCurrency(valorTotal), totalsX + totalsW - 4, totalsY + 28, { align: 'right' });

  // ── Observations ──
  if (order.orc_obs) {
    const obsY = totalsY + 36;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('OBSERVAÇÕES', margin, obsY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(7.5);
    doc.text(order.orc_obs, margin, obsY + 5, { maxWidth: contentWidth });
  }

  // ── Footer ──
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220, 225, 235);
  doc.setLineWidth(0.2);
  doc.line(margin, pageH - 10, pageWidth - margin, pageH - 10);
  doc.setFontSize(6.5);
  doc.setTextColor(160, 160, 160);
  doc.text('Documento gerado automaticamente pelo sistema Hadron', margin, pageH - 6);
  doc.text(`Pedido #${order.orc_codorc_web}`, pageWidth - margin, pageH - 6, { align: 'right' });

  doc.save(`pedido_${order.orc_codorc_web}.pdf`);
}
