import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Asset } from 'expo-asset';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Button, ScrollView, View } from 'react-native';
import InvoicePreview from '../components/InvoicePreview';
import { RootStackParamList } from '../types/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PrintMakeInvoice'>;

const PrintMakeInvoiceScreen = ({ route }: Props) => {
  const {
    invoiceNo,
    dateTime,
    vehicleNo,
    customerName,
    customerMobile,
    paymentMethod,
    product,
    price,
    quantity,
    discount,
    smsNotification,
  } = route.params;

  const loadAssets = async () => {
    try {
      const [logo, meghna] = await Promise.all([
        Asset.fromModule(require('../assets/logo.png')).downloadAsync(),
        Asset.fromModule(require('../assets/meghna.png')).downloadAsync(),
      ]);
      return { logo, meghna };
    } catch (error) {
      console.error('Error loading assets:', error);
      return { logo: null, meghna: null };
    }
  };
  // date & time আলাদা করা
  const dateObj = new Date(dateTime);
  const dateStr = dateObj.toLocaleDateString();
  const timeStr = dateObj.toLocaleTimeString();

  const generateHTML = (logoUri?: string, meghnaUri?: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice - ${invoiceNo}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        font-size: 13px;
        padding: 20px;
        color: #000;
      }
        .container{
        margin-top:100px;
        margin-left:35px;
margin-right: -25px;
        }
      .center {
        text-align: center;
      }
      .logo-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      .logo-img {
        width: 60px;
        height: auto;
      }
      .station-title {
        font-size: 18px;
        font-weight: bold;
      }
      .station-info {
        font-size: 12px;
        margin: 2px 0;
      }
      .memo-title {
        text-align: center;
        color: #1d4ed8;
        font-size: 16px;
        text-decoration: underline;
        margin: 16px 0;
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
      }
      .label {
        font-weight: bold;
        min-width: 150px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      th, td {
        border: 1px solid #000;
        padding: 8px;
        text-align: center;
      }
      th {
        background-color: #f3f4f6;
      }
      .signature-row {
        display: flex;
        justify-content: space-between;
        margin-top: 40px;
        font-size: 13px;
      }
      .signature {
        width: 45%;
        border-top: 1px solid #000;
        text-align: center;
        padding-top: 4px;
      }
    </style>
  </head>
  <body>
  <div class= "container">
    <div class="logo-row">
      <img src="${logoUri || ''}" alt="Left Logo" class="logo-img" />
      <div class="center" style="flex: 1;">
        <div class="station-title">East West Filling Station</div>
        <div class="station-info">Dhour Baribadh, Turag, Dhaka</div>
        <div class="station-info">Contact No: 01713-861666</div>
        <div class="station-info">Email: ewfs2012@gmail.com</div>
      </div>
      <img src="${meghnaUri || ''}" alt="Right Logo" class="logo-img" />
    </div>

    <div class="memo-title">Cash Memo</div>

    <div class="info">
      <div class="info-row"><span class="label">Invoice No:</span><span>${invoiceNo}</span></div>
      <div class="info-row"><span class="label">Date:</span><span>${dateStr}</span></div>
      <div class="info-row"><span class="label">Time:</span><span>${timeStr}</span></div>
      <div class="info-row"><span class="label">Vehicle No:</span><span>${vehicleNo}</span></div>
      <div class="info-row"><span class="label">Customer Name:</span><span>${customerName}</span></div>
      <div class="info-row"><span class="label">Mobile Number:</span><span>${customerMobile}</span></div>
      <div class="info-row"><span class="label">Payment Method:</span><span>${paymentMethod}</span></div>
      <div class="info-row"><span class="label">Product:</span><span>${product}</span></div>
      <div class="info-row"><span class="label">Discount:</span><span>BDT ৳{parseFloat(discount || '0').toFixed(2)}</span></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${product}</td>
          <td>${quantity}</td>
          <td>BDT ৳{parseFloat(price).toFixed(2)}</td>
          <td>BDT ৳{(parseFloat(price) * parseFloat(quantity) - parseFloat(discount || '0')).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <p style="margin-top: 10px;"><strong>SMS Notification:</strong> ${smsNotification === 'yes' ? 'Sent' : 'Not Sent'}</p>

    <div class="signature-row">
      <div class="signature">Customer Signature</div>
      <div class="signature">Sales Man Signature</div>
    </div>
    </div>
  </body>
</html>
`;

  const generatePDF = async () => {
    try {
      const { logo, meghna } = await loadAssets();

      const { uri } = await Print.printToFileAsync({
        html: generateHTML(logo?.localUri ?? undefined, meghna?.localUri ?? undefined),
        width: 595,
        height: 842,
        base64: false,
      });

      return uri;
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Could not generate PDF invoice.');
      return null;
    }
  };

  const handlePrint = async () => {
    const pdfUri = await generatePDF();
    if (pdfUri) {
      try {
        await Print.printAsync({ uri: pdfUri });
      } catch (error) {
        console.error('Print error:', error);
        Alert.alert('Error', 'Could not print invoice.');
      }
    }
  };

  const handleShare = async () => {
    const pdfUri = await generatePDF();
    if (pdfUri) {
      try {
        await Sharing.shareAsync(pdfUri);
      } catch (error) {
        console.error('Share error:', error);
        Alert.alert('Error', 'Could not share invoice.');
      }
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <InvoicePreview
        invoiceNo={invoiceNo}
        dateTime={dateTime}
        vehicleNo={vehicleNo}
        customerName={customerName}
        customerMobile={customerMobile}
        paymentMethod={paymentMethod}
        product={product}
        price={price}
        quantity={quantity}
        discount={discount}
        smsNotification={smsNotification}
      />

      <View className="mb-5 mt-8 flex-row justify-around">
        <View className="mx-2 flex-1">
          <Button title="🖨️ Print" onPress={handlePrint} color="#4caf50" />
        </View>
        <View className="mx-2 flex-1">
          <Button title="📤 Share" onPress={handleShare} color="#3f51b5" />
        </View>
      </View>
    </ScrollView>
  );
};

export default PrintMakeInvoiceScreen;
