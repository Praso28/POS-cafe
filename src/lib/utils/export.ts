import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { OrderWithItems } from '@/lib/types/database';

interface ExportData {
    orders: OrderWithItems[];
    summary: {
        totalOrders: number;
        paidOrders: number;
        totalRevenue: number;
    };
    filters: {
        startDate?: string;
        endDate?: string;
        session?: string;
        status?: string;
        responsible?: string;
        product?: string;
    };
}

export function exportToPDF(data: ExportData) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246); // Blue color
    doc.text('☕ Café POS', 14, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Sales Report', 14, 30);

    // Report date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);

    // Filters applied
    let filterText = 'Filters: ';
    const appliedFilters: string[] = [];
    if (data.filters.startDate) appliedFilters.push(`From: ${data.filters.startDate}`);
    if (data.filters.endDate) appliedFilters.push(`To: ${data.filters.endDate}`);
    if (data.filters.session && data.filters.session !== 'all') appliedFilters.push(`Session: ${data.filters.session.slice(-6)}`);
    if (data.filters.status && data.filters.status !== 'all') appliedFilters.push(`Status: ${data.filters.status}`);
    if (data.filters.responsible && data.filters.responsible !== 'all') appliedFilters.push(`Staff: ${data.filters.responsible.slice(-6)}`);
    if (data.filters.product && data.filters.product !== 'all') appliedFilters.push(`Product filter applied`);
    filterText += appliedFilters.length > 0 ? appliedFilters.join(' | ') : 'None';
    doc.text(filterText, 14, 45);

    // Summary section
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary', 14, 55);

    // Summary boxes
    const summaryY = 60;
    const boxWidth = 55;
    const boxHeight = 20;
    
    // Total Orders box
    doc.setFillColor(239, 246, 255);
    doc.rect(14, summaryY, boxWidth, boxHeight, 'F');
    doc.setFontSize(16);
    doc.setTextColor(59, 130, 246);
    doc.text(data.summary.totalOrders.toString(), 14 + boxWidth/2, summaryY + 10, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Total Orders', 14 + boxWidth/2, summaryY + 16, { align: 'center' });

    // Paid Orders box
    doc.setFillColor(236, 253, 245);
    doc.rect(74, summaryY, boxWidth, boxHeight, 'F');
    doc.setFontSize(16);
    doc.setTextColor(34, 197, 94);
    doc.text(data.summary.paidOrders.toString(), 74 + boxWidth/2, summaryY + 10, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Paid Orders', 74 + boxWidth/2, summaryY + 16, { align: 'center' });

    // Revenue box
    doc.setFillColor(254, 249, 195);
    doc.rect(134, summaryY, boxWidth, boxHeight, 'F');
    doc.setFontSize(14);
    doc.setTextColor(202, 138, 4);
    doc.text(`₹${data.summary.totalRevenue.toFixed(2)}`, 134 + boxWidth/2, summaryY + 10, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Total Revenue', 134 + boxWidth/2, summaryY + 16, { align: 'center' });

    // Orders table
    const tableData = data.orders.map(order => [
        `#${order.id.slice(-6).toUpperCase()}`,
        order.tables?.name || 'N/A',
        `${order.order_items?.length || 0} items`,
        `₹${order.total.toFixed(2)}`,
        order.status.charAt(0).toUpperCase() + order.status.slice(1),
        new Date(order.created_at).toLocaleString()
    ]);

    autoTable(doc, {
        startY: summaryY + 30,
        head: [['Order ID', 'Table', 'Items', 'Total', 'Status', 'Date']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        columnStyles: {
            0: { fontStyle: 'bold' },
            3: { halign: 'right' },
            4: { halign: 'center' }
        }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Page ${i} of ${pageCount} | Café POS Report`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Download
    doc.save(`cafe-pos-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportToExcel(data: ExportData) {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
        ['Café POS - Sales Report'],
        [''],
        ['Generated:', new Date().toLocaleString()],
        [''],
        ['Summary'],
        ['Total Orders', data.summary.totalOrders],
        ['Paid Orders', data.summary.paidOrders],
        ['Total Revenue', `₹${data.summary.totalRevenue.toFixed(2)}`],
        [''],
        ['Filters Applied'],
        ['Start Date', data.filters.startDate || 'All'],
        ['End Date', data.filters.endDate || 'All'],
        ['Session', data.filters.session === 'all' ? 'All' : (data.filters.session?.slice(-6) || 'All')],
        ['Status', data.filters.status === 'all' ? 'All' : (data.filters.status || 'All')],
        ['Responsible', data.filters.responsible === 'all' ? 'All' : (data.filters.responsible?.slice(-6) || 'All')],
        ['Product', data.filters.product === 'all' ? 'All' : (data.filters.product?.slice(-6) || 'All')],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Orders sheet
    const ordersData = [
        ['Order ID', 'Table', 'Items Count', 'Total (₹)', 'Status', 'Date', 'Session ID']
    ];

    data.orders.forEach(order => {
        ordersData.push([
            `#${order.id.slice(-6).toUpperCase()}`,
            order.tables?.name || 'N/A',
            (order.order_items?.length || 0).toString(),
            order.total.toFixed(2),
            order.status.charAt(0).toUpperCase() + order.status.slice(1),
            new Date(order.created_at).toLocaleString(),
            order.session_id.slice(-8)
        ]);
    });

    const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData);
    ordersSheet['!cols'] = [
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 22 },
        { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, ordersSheet, 'Orders');

    // Order Details sheet (with items breakdown)
    const detailsData = [
        ['Order ID', 'Table', 'Product', 'Quantity', 'Price (₹)', 'Subtotal (₹)', 'Order Status', 'Order Date']
    ];

    data.orders.forEach(order => {
        if (order.order_items && order.order_items.length > 0) {
            order.order_items.forEach((item, idx) => {
                detailsData.push([
                    idx === 0 ? `#${order.id.slice(-6).toUpperCase()}` : '',
                    idx === 0 ? (order.tables?.name || 'N/A') : '',
                    item.products?.name || 'Unknown',
                    item.qty.toString(),
                    item.price.toFixed(2),
                    (item.qty * item.price).toFixed(2),
                    idx === 0 ? order.status : '',
                    idx === 0 ? new Date(order.created_at).toLocaleString() : ''
                ]);
            });
        } else {
            detailsData.push([
                `#${order.id.slice(-6).toUpperCase()}`,
                order.tables?.name || 'N/A',
                'No items',
                '0',
                '0.00',
                '0.00',
                order.status,
                new Date(order.created_at).toLocaleString()
            ]);
        }
    });

    const detailsSheet = XLSX.utils.aoa_to_sheet(detailsData);
    detailsSheet['!cols'] = [
        { wch: 15 },
        { wch: 12 },
        { wch: 25 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(wb, detailsSheet, 'Order Details');

    // Download
    XLSX.writeFile(wb, `cafe-pos-report-${new Date().toISOString().split('T')[0]}.xlsx`);
}
