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
  const [profitMargin, setProfitMargin] = useState('0.00');

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
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
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
    const total = (priceNum * quantityNum - discountNum);
    setTotalAmount(total.toFixed(2));
    
    // Calculate profit margin if product is selected
    if (selectedProduct) {
      const purchasePrice = selectedProduct.purchases;
      const profit = (priceNum - purchasePrice) * quantityNum;
      const profitPercentage = purchasePrice > 0 ? (profit / (purchasePrice * quantityNum)) * 100 : 0;
      setProfitMargin(profitPercentage.toFixed(2));
    }
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
    setProfitMargin('0.00');
  };

  const validateForm = () => {
    if (!invoiceNo) {
      Alert.alert('Validation Error', 'Invoice number is required');
      return false;
    }
    if (!customerName) {
      Alert.alert('Validation Error', 'Customer name is required');
      return false;
    }
    if (!customerMobile) {
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
    if (parseFloat(discount) > parseFloat(totalAmount)) {
      Alert.alert('Validation Error', 'Discount cannot be greater than total amount');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const formData = {
        invoice_no: invoiceNo,
        date_time: dateTime.toISOString(),
        vehicle_no: vehicleNo || null,
        customer_name: customerName,
        customer_phone_number: customerMobile,
        payment_method: paymentMethod,
        product: selectedProductId,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        total_amount: parseFloat(totalAmount),
        discount: parseFloat(discount) || 0,
        is_sent_sms: smsNotification,
        status: 'pending',
      };

      // Save to backend
      const response = await api.post('/api/admin/create/invoice', formData);
      
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
              totalAmount: totalAmount,
            });
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating invoice:', error);
      Alert.alert('Error', 'Failed to create invoice');
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
    setAutoCalculate(!autoCalculate);
    if (!autoCalculate) {
      calculateTotal();
    }
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
            placeholder="Enter Invoice Number"
            keyboardType="numeric"
          />
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
            placeholder="Enter Vehicle Number (optional)"
          />
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
              placeholder="Enter Customer Name"
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
              placeholder="Enter Mobile Number"
              keyboardType="phone-pad"
            />
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
              className={`h-5 w-5 rounded border-2 border-indigo-600 ${
                autoCalculate ? 'bg-indigo-600' : 'bg-transparent'
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
              editable={autoCalculate}
              onChangeText={autoCalculate ? undefined : setTotalAmount}
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

        {/* Profit Margin Display */}
        {selectedProduct && (
          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
              Profit Margin
            </Text>
            <View className="rounded-xl border-2 border-gray-300 bg-green-50 px-4 py-4">
              <Text className="text-base font-semibold text-green-700">
                {profitMargin}% (${((parseFloat(price) || 0) - selectedProduct.purchases) * (parseFloat(quantity) || 0)})
              </Text>
            </View>
          </View>
        )}

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
                className={`h-5 w-5 rounded-full border-2 border-indigo-600 ${
                  smsNotification ? 'bg-indigo-600' : 'bg-transparent'
                }`}
              />
              <Text className="ml-2 font-medium">Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="ml-5 flex-row items-center"
              onPress={() => setSmsNotification(false)}>
              <View
                className={`h-5 w-5 rounded-full border-2 border-indigo-600 ${
                  !smsNotification ? 'bg-indigo-600' : 'bg-transparent'
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
