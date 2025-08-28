import { Image, StyleSheet, Text, View } from 'react-native';

type Props = {
  invoiceNo: string;
  dateTime: string;
  vehicleNo: string;
  customerName: string;
  customerMobile: string;
  paymentMethod: string;
  product: string;
  price: string;
  quantity: string;
  discount: string;
  smsNotification: string;
};

const InvoicePreview = ({
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
}: Props) => {
  const priceNum = parseFloat(price);
  const quantityNum = parseFloat(quantity);
  const discountNum = parseFloat(discount);

  // মোট টাকার হিসাব (Price * Quantity - Discount)
  const total =
    !isNaN(priceNum) && !isNaN(quantityNum)
      ? (priceNum * quantityNum - (isNaN(discountNum) ? 0 : discountNum)).toFixed(2)
      : '0.00';

  // date & time আলাদা করা
  const dateObj = new Date(dateTime);
  const dateStr = dateObj.toLocaleDateString();
  const timeStr = dateObj.toLocaleTimeString();

  // Details এ প্রয়োজনীয় তথ্য
  const detailsData = [
    { label: 'Invoice No:', value: invoiceNo },
    { label: 'Date:', value: dateStr },
    { label: 'Time:', value: timeStr },
    { label: 'Vehicle No:', value: vehicleNo },
    { label: 'Customer Name:', value: customerName },
    { label: 'Mobile Number:', value: customerMobile },
    { label: 'Payment Method:', value: paymentMethod },
    { label: 'Product:', value: product },
    { label: 'Discount:', value: `BDT ৳${!isNaN(discountNum) ? discountNum.toFixed(2) : '0.00'}` },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
        </View>

        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>East West Filling Station</Text>
          <Text style={styles.address}>Dhour Baribadh, Turag, Dhaka</Text>
          <Text style={styles.contact}>Contact No: 01713-861666</Text>
          <Text style={styles.contact}>Email: ewfs2012@gmail.com</Text>
        </View>

        <View style={styles.logoContainer}>
          <Image source={require('../assets/meghna.png')} style={styles.logo} />
        </View>
      </View>

      <Text style={styles.memoTitle}>Cash Memo</Text>

      {/* Details */}
      <View style={styles.details}>
        {detailsData.map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col}>Product</Text>
          <Text style={styles.col}>Qty</Text>
          <Text style={styles.col}>Price</Text>
          <Text style={styles.col}>Total</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.col}>{product}</Text>
          <Text style={styles.col}>{quantity}</Text>
          <Text style={styles.col}>BDT {!isNaN(priceNum) ? priceNum.toFixed(2) : '0.00'}</Text>
          <Text style={styles.col}>BDT {total}</Text>
        </View>
      </View>

      {/* SMS Notification */}
      <View style={{ marginTop: 10, paddingHorizontal: 10 }}>
        <Text>SMS Notification: {smsNotification === 'yes' ? 'Sent' : 'Not Sent'}</Text>
      </View>

      {/* Signatures */}
      <View style={styles.signatures}>
        <Text>Customer Signature</Text>
        <Text>|</Text>
        <Text>Sales Man Signature</Text>
      </View>
    </View>
  );
};

export default InvoicePreview;

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logoContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  address: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
  },
  contact: {
    fontSize: 12,
    textAlign: 'center',
  },
  memoTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    textDecorationLine: 'underline',
    color: '#667eea',
  },
  details: {
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  table: {
    borderWidth: 1,
    borderColor: '#000',
    marginVertical: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    backgroundColor: '#f0f0f0',
  },
  tableRow: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderColor: '#000',
    fontSize: 14,
    textAlign: 'center',
  },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingHorizontal: 10,
  },
});
