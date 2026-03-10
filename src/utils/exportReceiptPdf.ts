import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice, InvoiceTemplate } from '../api/invoices/types';

/* ── Helpers ───────────────────────────────────────────── */

const formatCurrency = (amount: number) => {
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

/* ── Number to French words ────────────────────────────── */

function numberToWordsFr(n: number): string {
    const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
        'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
        'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

    function below100(num: number): string {
        if (num < 20) return ones[num];
        const t = Math.floor(num / 10);
        const o = num % 10;
        if (t === 7) return 'soixante-' + ones[10 + o];
        if (t === 9) return 'quatre-vingt-' + (o > 0 ? ones[o] : '');
        if (t === 8) return 'quatre-vingt' + (o > 0 ? '-' + ones[o] : 's');
        return tens[t] + (o === 1 ? '-et-un' : o > 0 ? '-' + ones[o] : '');
    }

    function below1000(num: number): string {
        if (num < 100) return below100(num);
        const h = Math.floor(num / 100);
        const r = num % 100;
        const hWord = (h > 1 ? ones[h] + ' ' : '') + 'cent';
        if (r === 0) return hWord + (h > 1 ? 's' : '');
        return hWord + ' ' + below100(r);
    }

    const integer = Math.round(n);
    if (integer === 0) return 'zéro';

    let result = '';
    let remaining = integer;

    if (remaining >= 1000000) {
        const m = Math.floor(remaining / 1000000);
        result += below1000(m) + (m > 1 ? ' millions ' : ' million ');
        remaining = remaining % 1000000;
    }

    if (remaining >= 1000) {
        const k = Math.floor(remaining / 1000);
        result += (k === 1 ? 'mille' : below1000(k) + ' mille') + ' ';
        remaining = remaining % 1000;
    }

    if (remaining > 0) {
        result += below1000(remaining);
    }

    return result.trim();
}

/* ── Letterhead ────────────────────────────────────────── */

function drawLetterhead(doc: jsPDF, img: string) {
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.addImage(img, 'PNG', 0, 0, pw, ph);
}

const LH_TOP = 42;
const LH_BOTTOM = 28;
const MARGIN = 20;

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

/* ── Bank info parser ──────────────────────────────────── */

function parseBankInfo(bankInfo: string): { key: string; value: string }[] {
    return bankInfo.split('\n')
        .map(line => {
            const idx = line.indexOf(':');
            if (idx === -1) return null;
            return { key: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
        })
        .filter(Boolean) as { key: string; value: string }[];
}

/* ── Main export ───────────────────────────────────────── */

export function exportReceiptPdf(
    invoice: Invoice,
    template?: InvoiceTemplate | null,
    letterheadImg?: string,
    signatureImg?: string,
    cachetImg?: string,
) {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const hasLH = !!letterheadImg;
    const rightEdge = pw - MARGIN;

    // Colors
    const GREEN: [number, number, number] = [16, 185, 129];   // emerald-500
    const DARK: [number, number, number] = [40, 56, 82];
    const GREEN_LIGHT: [number, number, number] = [236, 253, 245];

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

    // ── REÇU DE PAIEMENT title (right-aligned) ──
    const titleY = hasLH ? LH_TOP : 20;
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREEN);
    doc.text('RECU DE PAIEMENT', rightEdge, titleY, { align: 'right' });

    const receiptNumber = `REC-${invoice.invoiceNumber}`;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(receiptNumber, rightEdge, titleY + 8, { align: 'right' });

    y = Math.max(y, titleY + 14) + 8;

    // ── Green accent line ──
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.8);
    doc.line(MARGIN, y, rightEdge, y);
    doc.setLineWidth(0.2);
    y += 10;

    // ── Payment confirmation banner ──
    doc.setFillColor(...GREEN_LIGHT);
    doc.roundedRect(MARGIN, y, pw - MARGIN * 2, 12, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREEN);
    doc.text(
        `Nous confirmons la reception du paiement de la facture ${invoice.invoiceNumber}`,
        pw / 2,
        y + 8,
        { align: 'center' }
    );
    y += 18;

    // ── Two-column info: Payment details (left) | Client (right) ──
    const colRight = pw / 2 + 10;
    const blockStartY = y;

    // Left: Payment info
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREEN);
    doc.text('DETAILS DU PAIEMENT', MARGIN, y);
    y += 5;

    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);

    doc.setFont('helvetica', 'bold');
    doc.text('Date de paiement:', MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(invoice.paidAt), MARGIN + 38, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Facture ref.:', MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceNumber, MARGIN + 38, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Date emission:', MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(invoice.issueDate), MARGIN + 38, y);

    // Right: Client info
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREEN);
    doc.text('RECU DE', colRight, blockStartY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(invoice.client?.name || '-', colRight, blockStartY + 5);

    if (invoice.project?.name) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Projet: ${invoice.project.name}`, colRight, blockStartY + 11);
    }
    if (invoice.department?.name) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Departement: ${invoice.department.name}`, colRight, blockStartY + 17);
    }

    y += 14;

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
            fillColor: GREEN,
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
            fillColor: [240, 253, 248],
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
    y = ensureSpace(doc, y, 50, letterheadImg);
    const totalsBoxX = pw - MARGIN - 75;
    const totalsBoxW = 75;

    doc.setFillColor(240, 253, 248);
    doc.roundedRect(totalsBoxX - 2, y - 3, totalsBoxW + 4, 32, 2, 2, 'F');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Sous-total:', totalsBoxX, y + 2);
    doc.text(formatCurrency(Number(invoice.subtotal)), rightEdge, y + 2, { align: 'right' });

    doc.text(`TVA (${Number(invoice.taxRate)}%):`, totalsBoxX, y + 8);
    doc.text(formatCurrency(Number(invoice.taxAmount)), rightEdge, y + 8, { align: 'right' });

    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.5);
    doc.line(totalsBoxX, y + 13, rightEdge, y + 13);
    doc.setLineWidth(0.2);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('Montant recu:', totalsBoxX, y + 22);
    doc.setTextColor(...GREEN);
    doc.text(formatCurrency(Number(invoice.total)), rightEdge, y + 22, { align: 'right' });

    y += 40;

    // ── Amount in words ──
    y = ensureSpace(doc, y, 14, letterheadImg);
    const amountWords = numberToWordsFr(Number(invoice.total));
    const amountWordsCapitalized = amountWords.charAt(0).toUpperCase() + amountWords.slice(1);

    doc.setFillColor(240, 253, 248);
    doc.roundedRect(MARGIN, y - 3, pw - MARGIN * 2, 12, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('Arrêter le montant du présent reçu à la somme de :', MARGIN + 3, y + 3);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80);
    const labelWidth = doc.getTextWidth('Arrêter le montant du présent reçu à la somme de : ');
    doc.text(`${amountWordsCapitalized} francs CFA`, MARGIN + 3 + labelWidth, y + 3);

    y += 16;

    // ── PAID stamp ──
    y = ensureSpace(doc, y, 30, letterheadImg);
    const stampX = MARGIN;
    const stampY = y;
    const stampW = 50;
    const stampH = 16;

    doc.setDrawColor(...GREEN);
    doc.setLineWidth(1.5);
    doc.roundedRect(stampX, stampY, stampW, stampH, 3, 3, 'S');

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREEN);
    doc.text('PAYE', stampX + stampW / 2, stampY + 11, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(`le ${formatDate(invoice.paidAt)}`, stampX + stampW + 4, stampY + 10);

    y += stampH + 10;

    // ── Notes ──
    if (invoice.notes) {
        y = ensureSpace(doc, y, 20, letterheadImg);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GREEN);
        doc.text('NOTES', MARGIN, y);
        y += 4;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(invoice.notes, MARGIN, y, { maxWidth: pw - MARGIN * 2 });
        y += 10;
    }

    // ── Payment Info (structured table) ──
    if (template?.bankInfo) {
        y = ensureSpace(doc, y, 45, letterheadImg);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.text('Informations de Paiement', MARGIN, y);
        y += 3;

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Vous pouvez payer par chèque ou virement bancaire en utilisant les coordonnées suivantes :', MARGIN, y + 4, { maxWidth: pw - MARGIN * 2 });
        y += 9;

        const bankRows = parseBankInfo(template.bankInfo);
        if (bankRows.length > 0) {
            autoTable(doc, {
                startY: y,
                body: bankRows.map(r => [r.key, r.value]),
                theme: 'grid',
                styles: { fontSize: 8.5, cellPadding: 3 },
                columnStyles: {
                    0: { fontStyle: 'bold', textColor: [40, 56, 82], cellWidth: 55 },
                    1: { textColor: [50, 50, 50] },
                },
                margin: { left: MARGIN, right: MARGIN },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
        } else {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(80, 80, 80);
            doc.text(template.bankInfo, MARGIN, y, { maxWidth: pw - MARGIN * 2 });
            y += 8;
        }
    }

    // ── Signature & Cachet ──
    if (signatureImg || cachetImg) {
        y = ensureSpace(doc, y, 45, letterheadImg);
        const sigW = 45;
        const sigH = 22;
        const cachetSize = 30;
        const sigX = rightEdge - sigW;
        const cachetX = sigX - cachetSize + 10; // slight overlap
        const blockCenterX = (cachetX + rightEdge) / 2;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.text('La direction', blockCenterX, y, { align: 'center' });
        y += 5;

        if (signatureImg) {
            doc.addImage(signatureImg, 'PNG', sigX, y, sigW, sigH);
        }
        if (cachetImg) {
            doc.addImage(cachetImg, 'PNG', cachetX, y - 2, cachetSize, cachetSize);
        }

        y += sigH + 8;
    }

    // ── Footer ──
    if (!hasLH) {
        const footerY = ph - 12;
        doc.setDrawColor(220, 220, 220);
        doc.line(MARGIN, footerY - 4, rightEdge, footerY - 4);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'italic');
        const footerMsg = template?.footerText || `Document genere le ${formatDate(new Date().toISOString())}`;
        doc.text(footerMsg, pw / 2, footerY, { align: 'center' });
    }

    doc.save(`${receiptNumber}.pdf`);
}
