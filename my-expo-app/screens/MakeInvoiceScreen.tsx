import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import InvoicePreview from '../components/InvoicePreview';
import { RootStackParamList } from '../types/types';
import api from '../utils/api';

type Props = NativeStackScreenProps<RootStackParamList, 'MakeInvoice'>;

type Product = {
  _id: string;
  name: string;
  purchases: number;
  sell: number;
  description?: string;
  status: boolean;
};

export default function MakeInvoiceScreen({ navigation }: Props) {
  const [invoiceNo, setInvoiceNo] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [vehicleNo, setVehicleNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [discount, setDiscount] = useState('');
  const [smsNotification, setSmsNotification] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-calculation states
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [totalAmount, setTotalAmount] = useState('0.00');


  // Load products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Load last invoice number and set next invoice number on mount
  useEffect(() => {
    const getInvoiceNumber = async () => {
      try {
        const storedNumber = await AsyncStorage.getItem('lastInvoiceNo');
        const nextNumber = storedNumber ? parseInt(storedNumber, 10) + 1 : 1;
        setInvoiceNo(nextNumber.toString());
      } catch (error) {
        console.log('Error loading invoice number:', error);
        setInvoiceNo('1');
      }
    };
    getInvoiceNumber();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/get/products', {
        params: {
          page: 1,
          perPage: 1000,
          status: 'true', // Only active products
        },
      });

      if (response.data.status && response.data.products) {
        setProducts(response.data.products);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p._id === selectedProductId);

  // Auto-fill price when product is selected
  useEffect(() => {
    if (selectedProduct && autoCalculate) {
      setPrice(selectedProduct.sell.toString());
      calculateTotal();
    }
  }, [selectedProductId, autoCalculate]);

  // Auto-calculate total when price, quantity, or discount changes
  useEffect(() => {
    if (autoCalculate) {
      calculateTotal();
    }
  }, [price, quantity, discount, autoCalculate]);

  const calculateTotal = () => {
    const priceNum = parseFloat(price) || 0;
    const quantityNum = parseFloat(quantity) || 0;
    const discountNum = parseFloat(discount) || 0;
    // Ensure the calculation is exactly: (price × quantity) - discount
    // Use Math.round to avoid floating point precision issues
    const total = Math.round((priceNum * quantityNum - discountNum) * 100) / 100;
    setTotalAmount(total.toFixed(2));
  };

  const handleConfirmDate = (date: Date) => {
    setDateTime(date);
    setDatePickerVisibility(false);
  };

  const handleReset = () => {
    setInvoiceNo('');
    setDateTime(new Date());
    setVehicleNo('');
    setCustomerName('');
    setCustomerMobile('');
    setPaymentMethod('cash');
    setSelectedProductId('');
    setPrice('');
    setQuantity('');
    setDiscount('');
    setSmsNotification(false);
    setTotalAmount('0.00');
  };

  const validateForm = () => {
    if (!invoiceNo.trim()) {
      Alert.alert('Validation Error', 'Invoice number is required');
      return false;
    }

    // Validate invoice number format (uppercase letters, numbers, hyphens only)
    const invoiceRegex = /^[A-Z0-9-]+$/;
    if (!invoiceRegex.test(invoiceNo.trim())) {
      Alert.alert('Validation Error', 'Invoice number can only contain uppercase letters, numbers, and hyphens');
      return false;
    }

    if (!customerName.trim()) {
      Alert.alert('Validation Error', 'Customer name is required');
      return false;
    }
    if (!customerMobile.trim()) {
      Alert.alert('Validation Error', 'Customer mobile number is required');
      return false;
    }

    if (!selectedProductId) {
      Alert.alert('Validation Error', 'Please select a product');
      return false;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price');
      return false;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity');
      return false;
    }
    if (parseFloat(discount) < 0) {
      Alert.alert('Validation Error', 'Discount cannot be negative');
      return false;
    }

    // Validate vehicle number format if provided
    if (vehicleNo.trim() && !/^[A-Z0-9-]+$/.test(vehicleNo.trim())) {
      Alert.alert('Validation Error', 'Vehicle number can only contain uppercase letters, numbers, and hyphens');
      return false;
    }

    // Calculate the correct total amount with precision
    const priceNum = parseFloat(price);
    const quantityNum = parseFloat(quantity);
    const discountNum = parseFloat(discount) || 0;
    const calculatedTotal = Math.round((priceNum * quantityNum - discountNum) * 100) / 100;

    // Check if discount is greater than subtotal (before discount)
    if (discountNum > (priceNum * quantityNum)) {
      Alert.alert('Validation Error', 'Discount cannot be greater than subtotal amount');
      return false;
    }

    // Always use the calculated total, not the manually entered one
    setTotalAmount(calculatedTotal.toFixed(2));

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Recalculate total amount to ensure it's correct before submission
    const priceNum = parseFloat(price) || 0;
    const quantityNum = parseFloat(quantity) || 0;
    const discountNum = parseFloat(discount) || 0;
    // Use Math.round to avoid floating point precision issues
    const calculatedTotal = Math.round((priceNum * quantityNum - discountNum) * 100) / 100;

    // Log the calculation for debugging
    console.log('Calculation:', {
      price: priceNum,
      quantity: quantityNum,
      discount: discountNum,
      subtotal: priceNum * quantityNum,
      calculatedTotal: calculatedTotal
    });

    setSubmitting(true);
    try {
      const formData = {
        invoice_no: invoiceNo.trim().toUpperCase(),
        date_time: dateTime.toISOString(),
        vehicle_no: vehicleNo.trim() ? vehicleNo.trim().toUpperCase() : null,
        customer_name: customerName.trim(),
        customer_phone_number: customerMobile.trim(),
        payment_method: paymentMethod,
        product: selectedProductId,
        price: priceNum,
        quantity: quantityNum,
        total_amount: calculatedTotal,
        discount: discountNum,
        is_sent_sms: smsNotification,
      };

      console.log('Submitting invoice data:', formData);
      console.log('Data types:', {
        invoice_no: typeof formData.invoice_no,
        date_time: typeof formData.date_time,
        vehicle_no: typeof formData.vehicle_no,
        customer_name: typeof formData.customer_name,
        customer_phone_number: typeof formData.customer_phone_number,
        payment_method: typeof formData.payment_method,
        product: typeof formData.product,
        price: typeof formData.price,
        quantity: typeof formData.quantity,
        total_amount: typeof formData.total_amount,
        discount: typeof formData.discount,
        is_sent_sms: typeof formData.is_sent_sms,
      });

      // Save to backend
      const response = await api.post('/api/admin/create/invoice', formData);

      if (response.data.status) {
        // Save current invoiceNo as last used
        await AsyncStorage.setItem('lastInvoiceNo', invoiceNo);

        Alert.alert('Success', 'Invoice created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('PrintMakeInvoice', {
                invoiceNo: invoiceNo,
                dateTime: dateTime.toISOString(),
                vehicleNo: vehicleNo || '',
                customerName: customerName,
                customerMobile: customerMobile,
                paymentMethod: paymentMethod,
                product: selectedProduct?.name || '',
                price: price,
                quantity: quantity,
                discount: discount,
                smsNotification: smsNotification ? 'yes' : 'no',
                totalAmount: calculatedTotal.toFixed(2),
              });
            },
          },
        ]);
      } else {
        throw new Error(response.data.message || 'Failed to create invoice');
      }
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      let errorMessage = 'Failed to create invoice';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        // Log the full error response for debugging
        console.error('Full error response:', error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const showPreview = () => {
    if (validateForm()) {
      setModalVisible(true);
    }
  };

  const handleManualCalculation = () => {
    // Always auto-calculate for consistency
    calculateTotal();
  };

  return (
    <ScrollView className="flex-1 bg-gray-100" contentContainerClassName="p-5 pt-8">
      <View className="rounded-2xl bg-white p-8 shadow-lg shadow-black/10">
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          className="mb-5 rounded-xl"
          style={{ overflow: 'hidden' }}>
          <Text className="py-2 text-center text-3xl font-extrabold text-white">
            ✨ Cash Memo ✨
          </Text>
        </LinearGradient>

        {/* Invoice No */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
            Invoice No *
          </Text>
          <TextInput
            className="rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-4 text-base"
            value={invoiceNo}
            onChangeText={setInvoiceNo}
            placeholder="e.g., INV-001 or 001"
            keyboardType="numeric"
            autoCapitalize="characters"
          />
          <Text className="mt-1 text-xs text-gray-500">
            Use uppercase letters, numbers, and hyphens only
          </Text>
        </View>

        {/* Date */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
            Date and Time
          </Text>
          <TouchableOpacity
            className="rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-4"
            onPress={() => setDatePickerVisibility(true)}>
            <Text className="text-base text-gray-800">{dateTime.toLocaleString()}</Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="datetime"
            onConfirm={handleConfirmDate}
            onCancel={() => setDatePickerVisibility(false)}
          />
        </View>

        {/* Vehicle No */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
            Vehicle No
          </Text>
          <TextInput
            className="rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-4 text-base"
            value={vehicleNo}
            onChangeText={setVehicleNo}
            placeholder="e.g., ABC-123 or leave empty"
            autoCapitalize="characters"
          />
          <Text className="mt-1 text-xs text-gray-500">
            Use uppercase letters, numbers, and hyphens only (optional)
          </Text>
        </View>

        {/* Customer Name & Mobile */}
        <View className="mb-5 flex-row space-x-5">
          <View className="mr-5 flex-1">
            <Text className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
              Customer Name *
            </Text>
            <TextInput
              className="rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-4 text-base"
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Enter Customer"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
              Mobile Number *
            </Text>
            <TextInput
              className="rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-4 text-base"
              value={customerMobile}
              onChangeText={setCustomerMobile}
              placeholder="Enter Number"
              keyboardType="phone-pad"
            />
            <Text className="mt-1 text-xs text-gray-500">
              Enter numbers only, optionally starting with +
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
            Payment Method
          </Text>
          <View className="overflow-hidden rounded-xl border-2 border-gray-300 bg-gray-50">
            <Picker
              selectedValue={paymentMethod}
              onValueChange={setPaymentMethod}
              style={{ height: 50 }}>
              <Picker.Item label="Cash" value="cash" />
              <Picker.Item label="Card" value="card" />
              <Picker.Item label="Bank Transfer" value="bank_transfer" />
              <Picker.Item label="Credit" value="credit" />
              <Picker.Item label="Due" value="due" />
            </Picker>
          </View>
        </View>

        {/* Product Selection */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
            Product *
          </Text>
          {loading ? (
            <View className="rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-4">
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text className="mt-2 text-center text-gray-500">Loading products...</Text>
            </View>
          ) : (
            <View className="overflow-hidden rounded-xl border-2 border-gray-300 bg-gray-50">
              <Picker
                selectedValue={selectedProductId}
                onValueChange={setSelectedProductId}
                style={{ height: 50 }}>
                <Picker.Item label="Select a product" value="" />
                {products.map((product) => (
                  <Picker.Item
                    key={product._id}
                    label={`${product.name} - $${product.sell}`}
                    value={product._id}
                  />
                ))}
              </Picker>
            </View>
          )}
        </View>

        {/* Auto-calculation Toggle */}
        <View className="mb-5">
          <TouchableOpacity
            onPress={handleManualCalculation}
            className="flex-row items-center">
            <View
              className={`h-5 w-5 rounded border-2 border-indigo-600 ${autoCalculate ? 'bg-indigo-600' : 'bg-transparent'
                }`}
            />
            <Text className="ml-2 font-medium text-gray-700">
              Auto-calculate totals
            </Text>
          </TouchableOpacity>
        </View>

        {/* Price & Quantity */}
        <View className="mb-5 flex-row space-x-5">
          <View className="mr-5 flex-1">
            <Text className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
              Price *
            </Text>
            <TextInput
              className="rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-4 text-base"
              value={price}
              onChangeText={setPrice}
              placeholder="Enter Price"
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
              Quantity *
            </Text>
            <TextInput
              className="rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-4 text-base"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Enter Quantity"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Total Amount & Discount */}
        <View className="mb-5 flex-row space-x-5">
          <View className="mr-5 flex-1">
            <Text className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
              Total Amount
            </Text>
            <TextInput
              className="rounded-xl border-2 border-gray-300 bg-gray-200 px-4 py-4 text-base"
              value={totalAmount}
              editable={false}
              onChangeText={undefined}
            />
          </View>
          <View className="flex-1">
            <Text className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
              Discount
            </Text>
            <TextInput
              className="rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-4 text-base"
              value={discount}
              onChangeText={setDiscount}
              placeholder="Enter Discount"
              keyboardType="numeric"
            />
          </View>
        </View>


        {/* SMS Notification */}
        <View className="mb-5">
          <Text className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
            SMS Notification
          </Text>
          <View className="flex-row space-x-5">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => setSmsNotification(true)}>
              <View
                className={`h-5 w-5 rounded-full border-2 border-indigo-600 ${smsNotification ? 'bg-indigo-600' : 'bg-transparent'
                  }`}
              />
              <Text className="ml-2 font-medium">Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="ml-5 flex-row items-center"
              onPress={() => setSmsNotification(false)}>
              <View
                className={`h-5 w-5 rounded-full border-2 border-indigo-600 ${!smsNotification ? 'bg-indigo-600' : 'bg-transparent'
                  }`}
              />
              <Text className="ml-2 font-medium">No</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Buttons */}
        <View className="mb-6 flex-row justify-between space-x-4 px-2">
          <TouchableOpacity
            className="mr-5 flex-1 items-center rounded-xl bg-red-500 py-3"
            onPress={handleReset}>
            <Text className="text-xs font-semibold uppercase tracking-wider text-white">
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mr-5 flex-1 items-center rounded-xl bg-green-600 py-3"
            onPress={showPreview}>
            <Text className="text-xs font-semibold uppercase tracking-wider text-white">
              Preview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 items-center rounded-xl bg-blue-500 py-3"
            onPress={handleSubmit}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-xs font-semibold uppercase tracking-wider text-white">
                Submit
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal Preview */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 justify-center bg-black/50 p-5">
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 16,
            }}>
            <InvoicePreview
              invoiceNo={invoiceNo}
              dateTime={dateTime.toISOString()}
              vehicleNo={vehicleNo}
              customerName={customerName}
              customerMobile={customerMobile}
              paymentMethod={paymentMethod}
              product={selectedProduct?.name || ''}
              price={price}
              quantity={quantity}
              discount={discount}
              smsNotification={smsNotification ? 'yes' : 'no'}
            />
            <TouchableOpacity
              className="mt-10 self-center rounded-2xl bg-indigo-600 px-6 py-3"
              onPress={() => setModalVisible(false)}>
              <Text className="text-lg font-bold text-white">Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}
