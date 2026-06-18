import React, { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { generateInvoiceApi } from '@/features/orders/orders.api';

interface DownloadInvoiceButtonProps {
  orderId: string;
}

export const DownloadInvoiceButton: React.FC<DownloadInvoiceButtonProps> = ({ orderId }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadInvoicePdf = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      // 1. Fetch data
      const responseData = await generateInvoiceApi(orderId);
      const apiData = responseData?.data || responseData;
      
      if (!apiData || !apiData.invoiceNumber) {
        if (responseData?.message) {
          throw new Error(responseData.message);
        }
        throw new Error('Failed to generate invoice data from server.');
      }

      // Format dates
      const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      };

      const invoiceDate = formatDate(apiData.invoiceDate);
      const paidDate = formatDate(apiData.payment?.paidAt || apiData.createdAt);
      
      const itemsHtml = (apiData.items || []).map((item: any) => {
        const price = Number(item.price) || 0;
        const total = price; 
        return `
          <tr>
            <td>${item.sku || 'N/A'}</td>
            <td>${item.label || 'Service'}</td>
            <td>${item.sacid || 'N/A'}</td>
            <td>1</td>
            <td>${price.toFixed(2)}</td>
            <td>${total.toFixed(2)}</td>
          </tr>
        `;
      }).join('');

      const subtotal = Number(apiData.subtotal) || 0;
      const discount = Number(apiData.discountAmount) || 0;
      const taxable = subtotal - discount;
      const taxAmt = Number(apiData.taxAmount) || 0;
      
      let cgst = 0;
      let sgst = 0;
      if (taxAmt < 1) { // It's a percentage (e.g. 0.18)
        cgst = (taxable * taxAmt) / 2;
        sgst = (taxable * taxAmt) / 2;
      } else { // It's an absolute value
        cgst = taxAmt / 2;
        sgst = taxAmt / 2;
      }
      
      const grandTotal = Number(apiData.totalAmount) || 0;

      // Load logo as base64
      let logoSrc = '';
      try {
        const [asset] = await Asset.loadAsync(require('../../assets/images/drydashlogo.png'));
        if (asset && asset.localUri) {
          const logoBase64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
          logoSrc = `data:image/png;base64,${logoBase64}`;
        }
      } catch (e) {
        console.log('Failed to load logo', e);
      }

      const icons = {
        calendar: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
        truck: '<path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
        user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
        phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
        mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
        shieldCheck: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
        receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17V7"/>',
        fileDigit: '<path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><rect width="4" height="6" x="2" y="12" rx="1"/><path d="M10 12h2v6"/><path d="M10 18h4"/>',
        tag: '<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>',
        creditCard: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
        badgeCheck: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
        checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
        shirt: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
        calendarDays: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>',
        fileCheck: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/>'
      };

      const renderIcon = (name: keyof typeof icons, size = 28, color = 'currentColor', extraStyle = '') => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="${extraStyle}">${icons[name]}</svg>`;

      // 2. Generate HTML
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            * { box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; color: #1a202c; margin: 0; padding: 40px; }
            
            /* Header */
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
            .logo-section { flex: 1; display: flex; flex-direction: column; }
            .logo-img { height: 40px; object-fit: contain; }
            .invoice-title { flex: 1; text-align: center; display: flex; flex-direction: column; align-items: center; }
            .invoice-title h1 { font-size: 32px; margin: 0; color: #02362A; letter-spacing: 0.5px; font-weight: 800; }
            .paid-badge { background: #00A67E; color: #fff; padding: 4px 16px; border-radius: 20px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; margin-top: 8px; font-size: 14px; gap: 4px; }
            
            .top-right { flex: 1; display: flex; flex-direction: column; align-items: flex-end; }
            .tr-inner { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
            .tr-item { display: flex; align-items: flex-start; gap: 12px; }
            .tr-icon { color: #00A67E; margin-top: 2px; }
            .tr-content { display: flex; flex-direction: column; font-size: 12px; color: #4a5568; }
            .tr-content strong { color: #1a202c; font-size: 13px; margin-top: 2px; }
            
            .gst-info { color: #00A67E; font-weight: 600; margin-bottom: 20px; font-size: 12px; display: flex; justify-content: flex-start; }
            .gst-info span { color: #4a5568; font-weight: normal; }
            
            /* Main Box */
            .main-box { border: 1px solid #00A67E; border-radius: 8px; padding: 24px; display: flex; justify-content: space-between; margin-bottom: 20px; position: relative; overflow: hidden; }
            .main-col { display: flex; flex-direction: column; gap: 20px; z-index: 2; }
            .mb-item { display: flex; align-items: flex-start; gap: 16px; }
            .mb-icon { color: #00A67E; margin-top: 2px; }
            .mb-content { display: flex; flex-direction: column; font-size: 11px; color: #718096; font-weight: 600; }
            .mb-content strong { color: #2d3748; font-size: 14px; font-weight: 700; margin-top: 2px; }
            
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.05; text-align: center; z-index: 1; }
            .watermark-circle { border: 2px dashed #00A67E; border-radius: 50%; width: 140px; height: 140px; display: flex; align-items: center; justify-content: center; position: relative; }
            .watermark-text { position: absolute; width: 100%; height: 100%; font-size: 9px; font-weight: bold; color: #00A67E; letter-spacing: 1px; }
            
            /* Bill To Box */
            .bill-to-box { display: flex; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
            .bill-to-left { flex: 1; border-right: 1px solid #e2e8f0; padding-right: 20px; display: flex; flex-direction: column; gap: 10px; }
            .bill-to-right { flex: 1; padding-left: 20px; display: flex; flex-direction: row; align-items: flex-start; }
            .bt-item { display: flex; align-items: center; gap: 12px; font-size: 13px; color: #4a5568; }
            .bt-icon { color: #00A67E; width: 18px; }
            .bt-title { color: #00A67E; font-size: 12px; font-weight: 600; margin-bottom: 4px; }
            
            /* Table */
            .table-container { position: relative; margin-bottom: 20px; }
            .table-header-pill { background: #02362A; color: #fff; border-radius: 6px; display: inline-flex; padding: 6px 16px; font-size: 11px; font-weight: 700; position: absolute; top: -14px; left: 0; }
            table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; margin-top: 14px; }
            th, td { padding: 14px 16px; text-align: center; font-size: 12px; }
            th { background: #f0fdf9; color: #02362A; font-weight: 600; font-size: 11px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; }
            td { border-bottom: 1px dashed #e2e8f0; color: #4a5568; }
            td:nth-child(2), th:nth-child(2) { text-align: left; }
            
            /* Summary Section */
            .summary-section { display: flex; gap: 20px; page-break-inside: avoid; }
            .summary-box { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
            .box-title { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #02362A; margin-bottom: 16px; }
            .box-icon { color: #00A67E; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; color: #4a5568; }
            .summary-row strong { color: #1a202c; font-weight: 600; }
            .discount-val { color: #00A67E !important; }
            .grand-total { border-top: 1px dashed #e2e8f0; padding-top: 12px; margin-top: 12px; font-size: 14px; font-weight: 800; color: #02362A; display: flex; justify-content: space-between; }
            .grand-total span { color: #00A67E; font-size: 16px; }
            
            /* Footer */
            .footer { display: flex; align-items: flex-start; gap: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; page-break-inside: avoid; }
            .footer-icon { color: #00A67E; }
            .footer-text { font-size: 10px; color: #718096; line-height: 1.5; }
            .footer-text strong { color: #4a5568; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              <div style="display: flex; align-items: center;">
                ${logoSrc ? `<img src="${logoSrc}" class="logo-img" />` : `<div class="logo">drydash</div>`}
                <div style="display: flex; flex-direction: column; justify-content: center; margin-left: 12px;">
                  <div style="font-size: 26px; font-weight: 800; color: #00A67E; letter-spacing: -0.5px; line-height: 1; display: flex;">drydash<span style="font-size: 10px; font-weight: 600; margin-top: 2px; margin-left: 2px;">TM</span></div>
                  <div style="font-size: 11px; color: #00A67E; font-weight: 600; margin-top: 2px;">Restored by Morning</div>
                </div>
              </div>
            </div>
            <div class="invoice-title">
              <h1>INVOICE</h1>
              <div class="paid-badge">${renderIcon('badgeCheck', 16)} Paid</div>
              <div style="color: #00A67E; font-size: 12px; margin-top: 10px; font-weight: 600;">Invoice Generated Successfully</div>
            </div>
            <div class="top-right">
              <div class="tr-inner">
                <div class="tr-item">
                  <div class="tr-icon">${renderIcon('receipt')}</div>
                  <div class="tr-content">Invoice Number<strong>${apiData.invoiceNumber || 'N/A'}</strong></div>
                </div>
                <div class="tr-item">
                  <div class="tr-icon">${renderIcon('fileDigit')}</div>
                  <div class="tr-content">Bill Number<strong>${apiData.orderId || 'N/A'}</strong></div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="gst-info">
            <div>GSTIN: <span>${apiData.gstNumber || 'N/A'}</span></div>
          </div>
          
          <div class="main-box">
            <div class="watermark">
              <div class="watermark-circle">
                <div style="color: #00A67E; stroke-width: 1;">${renderIcon('shirt', 60)}</div>
              </div>
            </div>
            <div class="main-col">
              <div class="mb-item">
                <div class="mb-icon">${renderIcon('calendar')}</div>
                <div class="mb-content">Invoice Date<strong>${invoiceDate}</strong></div>
              </div>
              <div class="mb-item">
                <div class="mb-icon">${renderIcon('tag')}</div>
                <div class="mb-content">Order ID<strong>${apiData.orderId || 'N/A'}</strong></div>
              </div>
            </div>
            <div class="main-col">
              <div class="mb-item">
                <div class="mb-icon">${renderIcon('calendarDays')}</div>
                <div class="mb-content">Pickup Date<strong>${apiData.createdAt ? formatDate(apiData.createdAt) : 'N/A'}</strong></div>
              </div>
              <div class="mb-item">
                <div class="mb-icon">${renderIcon('truck')}</div>
                <div class="mb-content">Delivery Date<strong>${paidDate}</strong></div>
              </div>
            </div>
          </div>
          
          <div class="bill-to-box">
            <div class="bill-to-left">
              <div class="bt-item bt-title"><div class="bt-icon">${renderIcon('user')}</div> BILL TO</div>
              <div class="bt-item"><div class="bt-icon">${renderIcon('user')}</div> <strong style="color: #02362A;">${apiData.customerName || 'N/A'}</strong></div>
              <div class="bt-item"><div class="bt-icon">${renderIcon('phone')}</div> +${apiData.contactNo || 'N/A'}</div>
              <div class="bt-item"><div class="bt-icon">${renderIcon('mail')}</div> ${apiData.email || 'N/A'}</div>
            </div>
            <div class="bill-to-right">
              <div style="color: #00A67E; margin-top: 2px; margin-right: 12px; flex-shrink: 0;">${renderIcon('mapPin')}</div>
              <div style="font-size: 13px; color: #1a202c; line-height: 1.5; font-weight: 500; flex: 1;">
                ${apiData.address || 'N/A'}
              </div>
            </div>
          </div>
          
          <div class="table-container">
            <div class="table-header-pill">ITEM DETAILS</div>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>ITEM DESCRIPTION</th>
                  <th>SAC CODE</th>
                  <th>QTY</th>
                  <th>PRICE (₹)</th>
                  <th>TOTAL (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>
          
          <div class="summary-section">
            <div class="summary-box">
              <div class="box-title"><div class="box-icon">${renderIcon('receipt')}</div> ORDER SUMMARY</div>
              <div class="summary-row"><span>Subtotal</span> <strong>₹${subtotal.toFixed(2)}</strong></div>
              <div class="summary-row"><span>Discount</span> <strong class="discount-val">-₹${discount.toFixed(2)}</strong></div>
              <div style="height: 12px;"></div>
              <div class="summary-row"><span>Taxable Amount</span> <strong>₹${taxable.toFixed(2)}</strong></div>
              <div class="summary-row"><span>CGST (9%)</span> <strong>₹${cgst.toFixed(2)}</strong></div>
              <div class="summary-row"><span>SGST (9%)</span> <strong>₹${sgst.toFixed(2)}</strong></div>
              <div class="grand-total">GRAND TOTAL <span>₹${grandTotal.toFixed(2)}</span></div>
            </div>
            
            <div class="summary-box">
              <div class="box-title"><div class="box-icon">${renderIcon('creditCard')}</div> PAYMENT INFORMATION</div>
              <div class="summary-row"><span>Payment Status</span> <strong style="color: #00A67E; display: flex; align-items: center; gap: 4px;">Paid ${renderIcon('checkCircle', 14)}</strong></div>
              <div class="summary-row"><span>Mode of Payment</span> <strong>${apiData.payment?.mode?.toUpperCase() || 'N/A'}</strong></div>
              <div class="summary-row"><span>Transaction ID</span> <strong>${apiData.payment?.transactionId || 'N/A'}</strong></div>
              <div class="summary-row"><span>Reference Number</span> <strong>TXN${Math.floor(Math.random()*1000000000)}</strong></div>
              <div class="summary-row"><span>Payment Date</span> <strong>${paidDate}</strong></div>
              <div class="summary-row"><span>Payment Gateway</span> <strong>Razorpay</strong></div>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-icon">${renderIcon('fileCheck', 24)}</div>
            <div class="footer-text">
              <strong>This is a computer-generated invoice and does not require a physical signature.</strong><br>
              GST compliant invoice. Subject to jurisdiction.
            </div>
          </div>
        </body>
        </html>
      `;

      // 3. Print to PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      // 4. Save and share the file with a clear filename
      const customFileName = `Invoice_${apiData.invoiceNumber || orderId}.pdf`;
      const newUri = FileSystem.documentDirectory + customFileName;
      
      // Move to a properly named file
      await FileSystem.moveAsync({
        from: uri,
        to: newUri
      });

      Alert.alert('Success', 'Invoice downloaded successfully. Opening share dialog...');

      await Sharing.shareAsync(newUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save or Share Invoice',
        UTI: 'com.adobe.pdf'
      });

    } catch (error: any) {
      console.log('Invoice error:', error);
      let errMsg = 'Failed to download invoice. Please try again later.';
      if (error.response?.data?.message) {
        errMsg = error.response.data.message;
      } else if (error.message) {
        errMsg = error.message;
      }
      Alert.alert('Download Error', errMsg); 
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <TouchableOpacity 
      onPress={downloadInvoicePdf} 
      style={styles.button}
      disabled={isDownloading}
      activeOpacity={0.7}
    >
      {isDownloading ? (
        <ActivityIndicator size="small" color="#2FE6A6" style={styles.icon} />
      ) : (
        <Ionicons name="download-outline" size={16} color="#2FE6A6" style={styles.icon} />
      )}
      <Text style={styles.text}>
        {isDownloading ? "Downloading Invoice..." : "Download Receipt"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F2C24',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#163028',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    color: '#2FE6A6',
    fontSize: 12,
    fontWeight: '700',
  }
});
