import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import InvoicePreview from '../components/InvoicePreview';
import { RootStackParamList } from '../types/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MakeInvoice'>;

export default function MakeInvoiceScreen({ navigation }: Props) {
  const [invoiceNo, setInvoiceNo] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [vehicleNo, setVehicleNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [product, setProduct] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [discount, setDiscount] = useState('');
  const [smsNotification, setSmsNotification] = useState('no');
  const [modalVisible, setModalVisible] = useState(false);

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

  const calculateTotal = () => {
    const priceNum = parseFloat(price) || 0;
    const quantityNum = parseFloat(quantity) || 0;
    const discountNum = parseFloat(discount) || 0;
    return (priceNum * quantityNum - discountNum).toFixed(2);
  };

  const handleConfirmDate = (date: Date) => {
    setDateTime(date);
    setDatePickerVisibility(false);
  };

  const handleReset = () => {
    setInvoiceNo(''); // optional: you can reset to '' or keep current number
    setDateTime(new Date());
    setVehicleNo('');
    setCustomerName('');
    setCustomerMobile('');
    setPaymentMethod('cash');
    setProduct('');
    setPrice('');
    setQuantity('');
    setDiscount('');
    setSmsNotification('no');
  };

  const validateForm = () => {
    if (
      !invoiceNo ||
      !vehicleNo ||
      !customerName ||
      !customerMobile ||
      !product ||
      !price ||
      !quantity
    ) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      const formData = {
        invoiceNo,
        dateTime: dateTime.toISOString(),
        vehicleNo,
        customerName,
        customerMobile,
        paymentMethod,
        product,
        price,
        quantity,
        discount,
        smsNotification,
        totalAmount: calculateTotal(),
      };

      try {
        // Save current invoiceNo as last used
        await AsyncStorage.setItem('lastInvoiceNo', invoiceNo);
      } catch (error) {
        console.log('Error saving invoice number:', error);
      }

      console.log('Form Data:', formData);
      Alert.alert('Success', 'Form submitted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('PrintMakeInvoice', formData);
          },
        },
      ]);
    }
  };

  const showPreview = () => {
    if (validateForm()) {
      setModalVisible(true);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100" contentContainerClassName="p-5 pt-8">
      <View></View>
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
            Vehicle No *
          </Text>
          <TextInput
            className="rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-4 text-base"
            value={vehicleNo}
            onChangeText={setVehicleNo}
            placeholder="Enter Vehicle Number"
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
              placeholder="Enter - Name"
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
              placeholder="Enter - Number"
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
              <Picker.Item label="Due" value="due" />
              <Picker.Item label="Poss" value="poss" />
            </Picker>
          </View>
        </View>

        {/* Product */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
            Product *
          </Text>
          <TextInput
            className="rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-4 text-base"
            value={product}
            onChangeText={setProduct}
            placeholder="Enter Product Name"
          />
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
              value={calculateTotal()}
              editable={false}
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
              onPress={() => setSmsNotification('yes')}>
              <View
                className={`h-5 w-5 rounded-full border-2 border-indigo-600 ${
                  smsNotification === 'yes' ? 'bg-indigo-600' : 'bg-transparent'
                }`}
              />
              <Text className="ml-2 font-medium">Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="ml-5 flex-row items-center"
              onPress={() => setSmsNotification('no')}>
              <View
                className={`h-5 w-5 rounded-full border-2 border-indigo-600 ${
                  smsNotification === 'no' ? 'bg-indigo-600' : 'bg-transparent'
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
            onPress={handleSubmit}>
            <Text className="text-xs font-semibold uppercase tracking-wider text-white">
              Submit
            </Text>
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
              product={product}
              price={price}
              quantity={quantity}
              discount={discount}
              smsNotification={smsNotification}
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
