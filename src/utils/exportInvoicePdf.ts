import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice } from '../api/invoices/types';
import type { InvoiceTemplate } from '../api/invoices/types';

/* ── Helpers ───────────────────────────────────────────── */

const formatCurrency = (amount: number) => {
    // Manual formatting to avoid non-breaking space chars that jsPDF renders as "/"
    const rounded = Math.round(amount * 100) / 100;
    const [intPart, decPart] = rounded.toFixed(2).split('.');
    const withSeparators = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const decimal = decPart === '00' ? '' : `,${decPart}`;
    return `${withSeparators}${decimal} FCFA`;
};

const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};

/* ── Letterhead ────────────────────────────────────────── */

function drawLetterhead(doc: jsPDF, img: string) {
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.addImage(img, 'PNG', 0, 0, pw, ph);
}

const LH_TOP = 42;   // mm below header zone
const LH_BOTTOM = 28; // mm above footer zone
const MARGIN = 20;     // left/right page margins

function ensureSpace(doc: jsPDF, y: number, needed: number, lhImg?: string): number {
    const ph = doc.internal.pageSize.getHeight();
    const limit = lhImg ? ph - LH_BOTTOM : ph - 15;
    if (y + needed > limit) {
        doc.addPage();
        if (lhImg) drawLetterhead(doc, lhImg);
        return lhImg ? LH_TOP : 20;
    }
    return y;
}

/* ── Main export ───────────────────────────────────────── */

export function exportInvoicePdf(
    invoice: Invoice,
    template?: InvoiceTemplate | null,
    letterheadImg?: string,
) {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const hasLH = !!letterheadImg;
    const rightEdge = pw - MARGIN;

    // Colors
    const BRAND: [number, number, number] = [51, 203, 204];
    const DARK: [number, number, number] = [40, 56, 82];

    // ── First page letterhead ──
    if (hasLH) drawLetterhead(doc, letterheadImg!);

    let y = hasLH ? LH_TOP : 20;

    // ── Company header (only without letterhead) ──
    if (!hasLH) {
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.text(template?.companyName || 'Company', MARGIN, y);
        y += 6;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        if (template?.address) { doc.text(template.address, MARGIN, y); y += 3.5; }
        if (template?.phone) { doc.text(template.phone, MARGIN, y); y += 3.5; }
        if (template?.email) { doc.text(template.email, MARGIN, y); y += 3.5; }
    }

    // ── FACTURE title block (right-aligned) ──
    const titleY = hasLH ? LH_TOP : 20;
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND);
    doc.text('FACTURE', rightEdge, titleY, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(invoice.invoiceNumber, rightEdge, titleY + 9, { align: 'right' });

    y = Math.max(y, titleY + 14) + 8;

    // ── Teal accent line ──
    doc.setDrawColor(...BRAND);
    doc.setLineWidth(0.8);
    doc.line(MARGIN, y, rightEdge, y);
    doc.setLineWidth(0.2);
    y += 12;

    // ── Two-column info: Dates (left) | Client (right) ──
    const colRight = pw / 2 + 10;

    // Left column - Dates
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND);
    doc.text('DATES', MARGIN, y);
    y += 5;

    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'bold');
    doc.text('Emission:', MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(invoice.issueDate), MARGIN + 25, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Echeance:', MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(invoice.dueDate), MARGIN + 25, y);

    // Right column - Client (same y-level as dates start)
    const clientY = y - 10;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND);
    doc.text('FACTURER A', colRight, clientY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(invoice.client?.name || '-', colRight, clientY + 5);

    if (invoice.project?.name) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Projet: ${invoice.project.name}`, colRight, clientY + 10);
    }

    y += 12;

    // ── Items Table ──
    const tableBody = (invoice.items || []).map(item => [
        item.description,
        String(Number(item.quantity)),
        formatCurrency(item.unitPrice),
        formatCurrency(item.amount),
    ]);

    let isFirstTablePage = true;

    autoTable(doc, {
        startY: y,
        head: [['Description', 'Qte', 'Prix unitaire', 'Montant']],
        body: tableBody,
        theme: 'striped',
        headStyles: {
            fillColor: BRAND,
            textColor: 255,
            fontSize: 8.5,
            fontStyle: 'bold',
            cellPadding: 4,
        },
        bodyStyles: {
            fontSize: 8.5,
            textColor: [50, 50, 50],
            cellPadding: 3.5,
        },
        alternateRowStyles: {
            fillColor: [245, 250, 250],
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 18, halign: 'center' },
            2: { cellWidth: 38, halign: 'right' },
            3: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
        },
        margin: {
            left: MARGIN,
            right: MARGIN,
            top: hasLH ? LH_TOP : 20,
            bottom: hasLH ? LH_BOTTOM : 20,
        },
        willDrawPage: () => {
            if (hasLH) {
                if (isFirstTablePage) {
                    isFirstTablePage = false;
                } else {
                    drawLetterhead(doc, letterheadImg!);
                }
            }
        },
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // ── Totals box ──
    y = ensureSpace(doc, y, 35, letterheadImg);
    const totalsBoxX = pw - MARGIN - 75;
    const totalsBoxW = 75;

    // Light background for totals
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(totalsBoxX - 2, y - 3, totalsBoxW + 4, 32, 2, 2, 'F');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Sous-total:', totalsBoxX, y + 2);
    doc.text(formatCurrency(Number(invoice.subtotal)), rightEdge, y + 2, { align: 'right' });

    doc.text(`TVA (${Number(invoice.taxRate)}%):`, totalsBoxX, y + 8);
    doc.text(formatCurrency(Number(invoice.taxAmount)), rightEdge, y + 8, { align: 'right' });

    // Separator
    doc.setDrawColor(...BRAND);
    doc.setLineWidth(0.5);
    doc.line(totalsBoxX, y + 13, rightEdge, y + 13);
    doc.setLineWidth(0.2);

    // Total
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('Total:', totalsBoxX, y + 22);
    doc.setTextColor(...BRAND);
    doc.text(formatCurrency(Number(invoice.total)), rightEdge, y + 22, { align: 'right' });

    y += 40;

    // ── Notes ──
    if (invoice.notes) {
        y = ensureSpace(doc, y, 20, letterheadImg);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...BRAND);
        doc.text('NOTES', MARGIN, y);
        y += 4;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(invoice.notes, MARGIN, y, { maxWidth: pw - MARGIN * 2 });
        y += 10;
    }

    // ── Payment Terms ──
    if (template?.paymentTerms) {
        y = ensureSpace(doc, y, 15, letterheadImg);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...BRAND);
        doc.text('CONDITIONS DE PAIEMENT', MARGIN, y);
        y += 4;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(template.paymentTerms, MARGIN, y, { maxWidth: pw - MARGIN * 2 });
        y += 8;
    }

    // ── Bank Info ──
    if (template?.bankInfo) {
        y = ensureSpace(doc, y, 15, letterheadImg);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...BRAND);
        doc.text('INFORMATIONS BANCAIRES', MARGIN, y);
        y += 4;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(template.bankInfo, MARGIN, y, { maxWidth: pw - MARGIN * 2 });
        y += 8;
    }

    // ── Footer (only without letterhead) ──
    if (!hasLH && template?.footerText) {
        const footerY = ph - 12;
        doc.setDrawColor(220, 220, 220);
        doc.line(MARGIN, footerY - 4, rightEdge, footerY - 4);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'italic');
        doc.text(template.footerText, pw / 2, footerY, { align: 'center' });
    }

    doc.save(`${invoice.invoiceNumber}.pdf`);
}
