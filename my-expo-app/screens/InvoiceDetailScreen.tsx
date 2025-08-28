import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Invoice {
  _id: string;
  invoice_no: string;
  date_time: string;
  vehicle_no: string;
  customer_name: string;
  customer_phone_number: string;
  payment_method: string;
  product: {
    _id: string;
    name: string;
    purchases: number;
    sell: number;
  };
  seller: {
    _id: string;
    name: string;
    email: string;
  };
  price: number;
  quantity: number;
  total_amount: number;
  discount: number;
  is_sent_sms: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  profit: number;
  profitMargin: number;
  calculatedTotal: number;
}

const InvoiceDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { invoice } = route.params as { invoice: Invoice };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrint = () => {
    navigation.navigate('PrintMakeInvoice', {
      invoiceNo: invoice.invoice_no,
      dateTime: invoice.date_time,
      vehicleNo: invoice.vehicle_no || '',
      customerName: invoice.customer_name,
      customerMobile: invoice.customer_phone_number,
      paymentMethod: invoice.payment_method,
      product: invoice.product.name,
      price: invoice.price.toString(),
      quantity: invoice.quantity.toString(),
      discount: invoice.discount.toString(),
      smsNotification: invoice.is_sent_sms ? 'yes' : 'no',
      totalAmount: invoice.total_amount.toString(),
    });
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        className="pt-12 pb-6 px-4"
        style={{ overflow: 'hidden' }}>
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => navigation.goBack()}
            className="p-2 rounded-full bg-white/20">
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text className="text-2xl font-bold text-white text-center flex-1">
            Invoice Details
          </Text>
          <View className="w-10" />
        </View>
        <Text className="text-white text-center opacity-90 mt-2">
          Invoice #{invoice.invoice_no}
        </Text>
      </LinearGradient>

      <ScrollView className="flex-1 px-4">
        {/* Invoice Info Card */}
        <View className="mt-4 bg-white rounded-lg p-6 shadow">
          <Text className="text-xl font-bold text-gray-800 mb-4">Invoice Information</Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600 font-medium">Invoice No:</Text>
              <Text className="text-gray-800 font-semibold">{invoice.invoice_no}</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600 font-medium">Date & Time:</Text>
              <Text className="text-gray-800 font-semibold">{formatDate(invoice.date_time)}</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600 font-medium">Status:</Text>
              <View className={`px-3 py-1 rounded-full ${
                invoice.status === 'pending' ? 'bg-yellow-100' : 
                invoice.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Text className={`text-sm font-medium capitalize ${
                  invoice.status === 'pending' ? 'text-yellow-800' : 
                  invoice.status === 'completed' ? 'text-green-800' : 'text-gray-800'
                }`}>
                  {invoice.status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Customer Info Card */}
        <View className="mt-4 bg-white rounded-lg p-6 shadow">
          <Text className="text-xl font-bold text-gray-800 mb-4">Customer Information</Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600 font-medium">Name:</Text>
              <Text className="text-gray-800 font-semibold">{invoice.customer_name}</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600 font-medium">Phone:</Text>
              <Text className="text-gray-800 font-semibold">{invoice.customer_phone_number}</Text>
            </View>
            
            {invoice.vehicle_no && (
              <View className="flex-row justify-between">
                <Text className="text-gray-600 font-medium">Vehicle No:</Text>
                <Text className="text-gray-800 font-semibold">{invoice.vehicle_no}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Product Info Card */}
        <View className="mt-4 bg-white rounded-lg p-6 shadow">
          <Text className="text-xl font-bold text-gray-800 mb-4">Product Information</Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600 font-medium">Product Name:</Text>
              <Text className="text-gray-800 font-semibold">{invoice.product.name}</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600 font-medium">Purchase Price:</Text>
              <Text className="text-gray-800 font-semibold">৳{invoice.product.purchases}</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600 font-medium">Selling Price:</Text>
              <Text className="text-gray-800 font-semibold">৳{invoice.product.sell}</Text>
            </View>
          </View>
        </View>

        {/* Transaction Details Card */}
        <View className="mt-4 bg-white rounded-lg p-6 shadow">
          <Text className="text-xl font-bold text-gray-800 mb-4">Transaction Details</Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600 font-medium">Price:</Text>
              <Text className="text-gray-800 font-semibold">৳{invoice.price}</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600 font-medium">Quantity:</Text>
              <Text className="text-gray-800 font-semibold">{invoice.quantity}</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600 font-medium">Discount:</Text>
              <Text className="text-gray-800 font-semibold">৳{invoice.discount}</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600 font-medium">Total Amount:</Text>
              <Text className="text-2xl font-bold text-green-600">৳{invoice.total_amount.toFixed(2)}</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600 font-medium">Payment Method:</Text>
              <Text className="text-gray-800 font-semibold capitalize">{invoice.payment_method}</Text>
            </View>
          </View>
        </View>

        {/* Profit Analysis Card */}
        {invoice.profit !== undefined && (
          <View className="mt-4 bg-white rounded-lg p-6 shadow">
            <Text className="text-xl font-bold text-gray-800 mb-4">Profit Analysis</Text>
            
            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-600 font-medium">Profit:</Text>
                <Text className="text-2xl font-bold text-green-600">৳{invoice.profit.toFixed(2)}</Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600 font-medium">Profit Margin:</Text>
                <Text className="text-2xl font-bold text-blue-600">{invoice.profitMargin.toFixed(2)}%</Text>
              </View>
            </View>
          </View>
        )}

        {/* Seller Info Card */}
        <View className="mt-4 bg-white rounded-lg p-6 shadow">
          <Text className="text-xl font-bold text-gray-800 mb-4">Seller Information</Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600 font-medium">Name:</Text>
              <Text className="text-gray-800 font-semibold">{invoice.seller.name}</Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-600 font-medium">Email:</Text>
              <Text className="text-gray-800 font-semibold">{invoice.seller.email}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mt-6 mb-8 space-y-3">
          <Pressable
            onPress={handlePrint}
            className="bg-blue-600 py-4 px-6 rounded-lg flex-row items-center justify-center">
            <Ionicons name="print" size={24} color="white" className="mr-2" />
            <Text className="text-white font-semibold text-lg ml-2">Print Invoice</Text>
          </Pressable>
          
          <Pressable
            onPress={() => navigation.goBack()}
            className="bg-gray-600 py-4 px-6 rounded-lg">
            <Text className="text-white font-semibold text-lg text-center">Back to Reports</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

export default InvoiceDetailScreen;
