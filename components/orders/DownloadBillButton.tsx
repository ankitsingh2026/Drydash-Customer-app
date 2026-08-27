import React, { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../Customalert';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { getSingleOrderDetailsApi } from '@/features/orders/orders.api';
import { useTheme } from '@/context/ThemeContext';

interface DownloadBillButtonProps {
  orderId: string;
}

export const DownloadBillButton: React.FC<DownloadBillButtonProps> = ({ orderId }) => {
  const { theme, isDark } = useTheme();
  const styles = makeStyles(theme, isDark);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadBillPdf = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      // 1. Fetch data
      const responseData = await getSingleOrderDetailsApi(orderId);
      const apiData = responseData?.data?.order_details || responseData?.order_details || responseData;
      
      if (!apiData || (!apiData.order_id && !apiData.orderId)) {
        if (responseData?.message) {
          throw new Error(responseData.message);
        }
        throw new Error('Failed to fetch order details from server.');
      }

      // Format dates
      const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      };

      const orderDate = formatDate(apiData.createdAt);
      
      const itemsHtml = (apiData.items || []).map((item: any) => {
        const price = Number(item.price) || 0;
        const total = price; 
        const sku = item.itemId?.sku || item.sku || 'N/A';
        const sacid = item.itemId?.sacid || item.sacid || 'N/A';
        return `
          <tr>
            <td>${sku}</td>
            <td>${item.label || item.heading || 'Service'}</td>
            <td>${sacid}</td>
            <td>1</td>
            <td>${price.toFixed(2)}</td>
            <td>${total.toFixed(2)}</td>
          </tr>
        `;
      }).join('');

      const subtotal = Number(apiData.price) || 0;
      const discount = Number(apiData.discountAmount) || 0;
      const taxable = subtotal - discount;
      const taxAmt = Number(apiData.taxAmount) || 0;
      
      let cgst = 0;
      let sgst = 0;
      if (taxAmt < 1 && taxAmt > 0) { // It's a percentage (e.g. 0.18)
        cgst = (taxable * taxAmt) / 2;
        sgst = (taxable * taxAmt) / 2;
      } else { // It's an absolute value
        cgst = taxAmt / 2;
        sgst = taxAmt / 2;
      }
      
      const grandTotal = Number(apiData.totalAmount) || 0;

      // Load logo as base64 safely
      let logoSrc = '';
      try {
        const assets = await Asset.loadAsync(require('../../assets/images/drydashlogo.png'));
        const asset = assets?.[0];
        const targetUri = asset?.localUri || asset?.uri;
        if (targetUri && targetUri.startsWith('file://')) {
          const logoBase64 = await FileSystem.readAsStringAsync(targetUri, { encoding: FileSystem.EncodingType.Base64 });
          logoSrc = `data:image/png;base64,${logoBase64}`;
        } else if (targetUri) {
          logoSrc = targetUri;
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
        receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17V7"/>',
        fileDigit: '<path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><rect width="4" height="6" x="2" y="12" rx="1"/><path d="M10 12h2v6"/><path d="M10 18h4"/>',
        tag: '<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>',
        creditCard: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
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
            .invoice-title h1 { font-size: 26px; margin: 0; color: #02362A; letter-spacing: 0.5px; font-weight: 800; text-transform: uppercase; }
            
            .top-right { flex: 1; display: flex; flex-direction: column; align-items: flex-end; }
            .tr-inner { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
            .tr-item { display: flex; align-items: flex-start; gap: 12px; }
            .tr-icon { color: #00A67E; margin-top: 2px; }
            .tr-content { display: flex; flex-direction: column; font-size: 12px; color: #4a5568; }
            .tr-content strong { color: #1a202c; font-size: 13px; margin-top: 2px; }
            
            /* Main Box */
            .main-box { border: 1px solid #00A67E; border-radius: 8px; padding: 24px; display: flex; justify-content: space-between; margin-bottom: 20px; position: relative; overflow: hidden; }
            .main-col { display: flex; flex-direction: column; gap: 20px; z-index: 2; }
            .mb-item { display: flex; align-items: flex-start; gap: 16px; }
            .mb-icon { color: #00A67E; margin-top: 2px; }
            .mb-content { display: flex; flex-direction: column; font-size: 11px; color: #718096; font-weight: 600; }
            .mb-content strong { color: #2d3748; font-size: 14px; font-weight: 700; margin-top: 2px; }
            
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.05; text-align: center; z-index: 1; }
            .watermark-circle { border: 2px dashed #00A67E; border-radius: 50%; width: 140px; height: 140px; display: flex; align-items: center; justify-content: center; position: relative; }
            
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
            .summary-section { display: flex; gap: 20px; page-break-inside: avoid; justify-content: flex-end; }
            .summary-box { width: 50%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
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
                <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="48" height="48" rx="13.62" fill="#00751E"/>
                  <path d="M8.24864 27.3283C6.87869 27.3283 5.82788 26.2775 5.82788 24.7129C5.82788 23.1562 6.87869 22.0976 8.24864 22.0976C8.91804 22.0976 9.47069 22.3544 9.85209 22.8059V21.0156H11.0586V27.2427H9.87544V26.6122C9.49404 27.0636 8.93361 27.3283 8.24864 27.3283ZM7.0655 24.7129C7.0655 25.6236 7.64929 26.223 8.47437 26.223C9.29944 26.223 9.88323 25.6236 9.88323 24.7129C9.88323 23.81 9.29944 23.2029 8.47437 23.2029C7.64929 23.2029 7.0655 23.81 7.0655 24.7129ZM12.4868 27.2427V22.1832H13.6855V22.9071C13.8179 22.6191 14.246 22.1443 14.9465 22.0976V23.3274C14.1915 23.3274 13.7011 23.8334 13.7011 24.6117V27.2427H12.4868ZM16.7642 28.7994L17.3791 27.2427L15.3631 22.1832H16.6007L17.9862 25.7092L19.3873 22.1832H20.6016L17.9862 28.7994H16.7642ZM23.158 27.3283C21.788 27.3283 20.7372 26.2775 20.7372 24.7129C20.7372 23.1562 21.788 22.0976 23.158 22.0976C23.8274 22.0976 24.38 22.3544 24.7614 22.8059V21.0156H25.9679V27.2427H24.7848V26.6122C24.4034 27.0636 23.843 27.3283 23.158 27.3283ZM21.9749 24.7129C21.9749 25.6236 22.5586 26.223 23.3837 26.223C24.2088 26.223 24.7926 25.6236 24.7926 24.7129C24.7926 23.81 24.2088 23.2029 23.3837 23.2029C22.5586 23.2029 21.9749 23.81 21.9749 24.7129ZM29.0892 27.3283C27.7192 27.3283 26.6684 26.2697 26.6684 24.7051C26.6684 23.1484 27.7192 22.0976 29.0892 22.0976C29.7664 22.0976 30.3268 22.3622 30.7082 22.8137V22.1832H31.9069V27.2427H30.7082V26.6044C30.3268 27.0636 29.7664 27.3283 29.0892 27.3283ZM27.906 24.7051C27.906 25.6158 28.4898 26.223 29.3149 26.223C30.14 26.223 30.7238 25.6158 30.7238 24.7051C30.7238 23.8022 30.14 23.2029 29.3149 23.2029C28.4898 23.2029 27.906 23.8022 27.906 24.7051ZM34.6543 27.3283C33.4167 27.3283 32.6072 26.5421 32.6072 25.4135H33.8059C33.8059 25.9116 34.1795 26.2619 34.7166 26.2619C35.0747 26.2619 35.4872 26.1062 35.4872 25.7559C35.4872 25.3434 34.9813 25.2967 34.413 25.1099C33.6892 24.8764 32.7707 24.6818 32.7707 23.6232C32.7707 22.6969 33.4946 22.0587 34.5454 22.0587C35.6273 22.0587 36.4446 22.7281 36.4446 23.6699H35.2537C35.2537 23.3508 34.9657 23.1328 34.5921 23.1328C34.2418 23.1328 33.9849 23.3196 33.9849 23.5998C33.9849 23.9501 34.4053 24.0202 34.9501 24.1914C35.7363 24.4327 36.6781 24.6584 36.6781 25.717C36.6781 26.7211 35.8297 27.3283 34.6543 27.3283ZM37.3751 27.2427V19.6211H38.5892V22.8215C38.7216 22.5179 39.1808 22.0976 39.9748 22.0976C41.1268 22.0976 42.0141 22.9849 42.0141 24.3004V27.2427H40.7998V24.3237C40.7998 23.6388 40.3562 23.1795 39.6945 23.1795C39.0329 23.1795 38.5892 23.6388 38.5892 24.3237V27.2427H37.3751Z" fill="white"/>
                </svg>
                <div style="display: flex; flex-direction: column; justify-content: center; margin-left: 12px;">
                  <div style="font-size: 26px; font-weight: 800; color: #00A67E; letter-spacing: -0.5px; line-height: 1; display: flex;">drydash<span style="font-size: 10px; font-weight: 600; margin-top: 2px; margin-left: 2px;">TM</span></div>
                  <div style="font-size: 11px; color: #00A67E; font-weight: 600; margin-top: 2px;">Restored by Morning</div>
                </div>
              </div>
            </div>
            <div class="invoice-title">
              <h1>BILL</h1>
              <div style="color: #00A67E; font-size: 12px; margin-top: 10px; font-weight: 600;">Bill Generated Successfully</div>
            </div>
            <div class="top-right">
              <div class="tr-inner">
                <div class="tr-item">
                  <div class="tr-icon">${renderIcon('fileDigit')}</div>
                  <div class="tr-content">Order ID<strong>${apiData.order_id || apiData.orderId || 'N/A'}</strong></div>
                </div>
              </div>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;"></div>
          
          <div class="main-box">
            <div class="watermark">
              <div class="watermark-circle">
                <div style="color: #00A67E; stroke-width: 1;">${renderIcon('shirt', 60)}</div>
              </div>
            </div>
            <div class="main-col">
              <div class="mb-item">
                <div class="mb-icon">${renderIcon('tag')}</div>
                <div class="mb-content">Order ID<strong>${apiData.order_id || apiData.orderId || 'N/A'}</strong></div>
              </div>
            </div>
            <div class="main-col">
              <div class="mb-item">
                <div class="mb-icon">${renderIcon('calendarDays')}</div>
                <div class="mb-content">Order Date<strong>${orderDate}</strong></div>
              </div>
            </div>
          </div>
          
          <div class="bill-to-box">
            <div class="bill-to-left">
              <div class="bt-item bt-title"><div class="bt-icon">${renderIcon('user')}</div> BILL TO</div>
              <div class="bt-item"><div class="bt-icon">${renderIcon('user')}</div> <strong style="color: #02362A;">${apiData.customerName || 'N/A'}</strong></div>
              <div class="bt-item"><div class="bt-icon">${renderIcon('phone')}</div> +${apiData.contactNo || 'N/A'}</div>
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
              <div class="summary-row"><span>Delivery Charges</span> <strong>₹${(Number(apiData.deliveryCharges) || 0).toFixed(2)}</strong></div>
              <div class="summary-row"><span>Discount</span> <strong class="discount-val">-₹${discount.toFixed(2)}</strong></div>
              <div style="height: 12px;"></div>
              <div class="summary-row"><span>Taxable Amount</span> <strong>₹${taxable.toFixed(2)}</strong></div>
              <div class="summary-row"><span>CGST (9%)</span> <strong>₹${cgst.toFixed(2)}</strong></div>
              <div class="summary-row"><span>SGST (9%)</span> <strong>₹${sgst.toFixed(2)}</strong></div>
              <div class="grand-total">GRAND TOTAL <span>₹${grandTotal.toFixed(2)}</span></div>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-icon">${renderIcon('fileCheck', 24)}</div>
            <div class="footer-text">
              <strong>This is a computer-generated proforma invoice and does not require a physical signature.</strong><br>
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
      const customFileName = `Bill_${apiData.order_id || apiData.orderId || orderId}.pdf`;
      let shareUri = uri;

      if (FileSystem.documentDirectory) {
        const targetUri = FileSystem.documentDirectory + customFileName;
        try {
          await FileSystem.deleteAsync(targetUri, { idempotent: true });
          await FileSystem.moveAsync({
            from: uri,
            to: targetUri
          });
          shareUri = targetUri;
        } catch (moveError) {
          console.log('Move file error, falling back to temp uri:', moveError);
          shareUri = uri;
        }
      }

      showAlert({
        type: 'success',
        title: 'Success',
        message: 'Bill generated successfully.',
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(shareUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save or Share Bill',
          UTI: 'com.adobe.pdf'
        });
      }

    } catch (error: any) {
      console.log('Bill error:', error);
      let errMsg = 'Failed to download bill. Please try again later.';
      if (error.response?.data?.message) {
        errMsg = error.response.data.message;
      } else if (error.message) {
        errMsg = error.message;
      }
      showAlert({
        type: 'error',
        title: 'Download Error',
        message: errMsg,
      }); 
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <TouchableOpacity 
      onPress={downloadBillPdf} 
      style={styles.button}
      disabled={isDownloading}
      activeOpacity={0.7}
    >
      {isDownloading ? (
        <ActivityIndicator size="small" style={styles.icon} />
      ) : (
        <Ionicons name="download-outline" size={16}  style={styles.icon} />
      )}
      <Text style={styles.text}>
        {isDownloading ? "Downloading Bill..." : "Download Bill"}
      </Text>
    </TouchableOpacity>
  );
};
const makeStyles = (theme: any, isDark: boolean) => StyleSheet.create({

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
      borderColor: isDark ? '#163028' : '#D3EBE4',
  },
  icon: {
    marginRight: 6,
    color : theme.primary,   
  },
  text: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '700',
  }
});
