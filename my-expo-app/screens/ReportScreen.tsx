import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../utils/api';

type Product = {
  _id: string;
  name: string;
  purchases: number;
  sell: number;
};

type Seller = {
  _id: string;
  name: string;
  email: string;
};

type Invoice = {
  _id: string;
  invoice_no: string;
  date_time: string;
  vehicle_no?: string | null;
  customer_name: string;
  customer_phone_number: string;
  payment_method: "cash" | "card" | "bank_transfer" | "credit" | "due";
  product: Product;
  seller: Seller;
  price: number;
  quantity: number;
  total_amount: number;
  discount: number;
  is_sent_sms: boolean;
  profit?: number;
  profitMargin?: number;
  calculatedTotal?: number;
  createdAt: string;
  updatedAt: string;
};

type ReportStats = {
  totalInvoices: number;
  totalRevenue: number;
  totalProfit: number;
  averageOrderValue: number;
  topProducts: Array<{
    product: string;
    quantity: number;
    revenue: number;
  }>;
  paymentMethodStats: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  dailyStats: Array<{
    date: string;
    invoices: number;
    revenue: number;
    profit: number;
  }>;
};

export default function ReportScreen() {
  const navigation = useNavigation<any>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    payment_method: '',
    startDate: '',
    endDate: '',
    customer: '',
    minAmount: '',
    maxAmount: '',
  });
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('excel');
  
  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const fetchInvoices = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setPage(1);
      }
      
      const params = {
        page: pageNum,
        perPage: 20,
        search: search,
        payment_method: filters.payment_method || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        customer: filters.customer || undefined,
        minAmount: filters.minAmount || undefined,
        maxAmount: filters.maxAmount || undefined,
      };
      
      const response = await api.get('/api/admin/reports/detailed', { params });
      const { invoices: newInvoices, meta } = response.data;
      
      if (refresh || pageNum === 1) {
        setInvoices(newInvoices);
      } else {
        setInvoices(prev => [...prev, ...newInvoices]);
      }
      
      setHasMore(meta.currentPage < meta.lastPage);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      Alert.alert('Error', 'Failed to load invoices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        payment_method: filters.payment_method || undefined,
      };
      const response = await api.get('/api/admin/reports/stats', { params });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchInvoices(1, true);
    fetchStats();
  }, [filters]);

  const onRefresh = () => {
    fetchInvoices(1, true);
    fetchStats();
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchInvoices(page + 1);
    }
  };

  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      setFilters(prev => ({
        ...prev,
        startDate: selectedDate.toISOString().split('T')[0],
      }));
    }
  };

  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
      setFilters(prev => ({
        ...prev,
        endDate: selectedDate.toISOString().split('T')[0],
      }));
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
              const params = {
          format: exportFormat,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          payment_method: filters.payment_method || undefined,
          customer: filters.customer || undefined,
          minAmount: filters.minAmount || undefined,
          maxAmount: filters.maxAmount || undefined,
        };
      
      console.log('Exporting with params:', params);
      
      const response = await api.get('/api/admin/reports/export', {
        params,
        responseType: 'blob',
      });

      // Check if response is valid
      if (response.data && response.data.size > 0) {
        const fileName = `invoice-report-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
        
        // For React Native, we'll share the data instead of downloading
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = reader.result as string;
          Share.share({
            title: `Invoice Report - ${fileName}`,
            message: `Invoice report generated on ${new Date().toLocaleDateString()}`,
            url: base64Data,
          });
        };
        reader.readAsDataURL(response.data);
        
        Alert.alert('Success', `${exportFormat.toUpperCase()} report exported successfully`);
        setExportModalVisible(false);
      } else {
        throw new Error("Invalid export response");
      }
    } catch (error: any) {
      console.error('Export error:', error);
      if (error.response?.data?.message) {
        Alert.alert('Error', error.response.data.message);
      } else {
        Alert.alert('Error', `Failed to export ${exportFormat.toUpperCase()} report`);
      }
    } finally {
      setExporting(false);
    }
  };

  const handleDateRangeQuick = (range: 'today' | 'week' | 'month' | 'quarter' | 'year') => {
    const now = new Date();
    let start = new Date();
    
    switch (range) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    setFilters(prev => ({
      ...prev,
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    }));
  };

  const clearFilters = () => {
    setFilters({
      payment_method: '',
      startDate: '',
      endDate: '',
      customer: '',
      minAmount: '',
      maxAmount: '',
    });
    setSearch('');
  };

  const renderInvoice = ({ item, index }: { item: Invoice; index: number }) => (
    <Pressable
      onPress={() => navigation.navigate('InvoiceDetail', { invoice: item })}
      className={`border-b border-gray-100 px-4 py-3 ${
        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
      }`}>
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="font-semibold text-gray-800">{item.invoice_no}</Text>
          <Text className="text-sm text-gray-600">{item.customer_name}</Text>
          <Text className="text-xs text-gray-500">{item.customer_phone_number}</Text>
        </View>
        <View className="items-end">
          <Text className="font-bold text-green-600">${item.total_amount.toFixed(2)}</Text>
          <Text className="text-xs text-gray-500 capitalize">{item.payment_method}</Text>
          {item.profit !== undefined && (
            <View className="mt-1 px-2 py-1 rounded-full bg-blue-100">
              <Text className="text-xs font-medium text-blue-800">
                Profit: ${item.profit.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View className="mt-2 flex-row justify-between">
        <Text className="text-sm text-gray-600">{item.product.name}</Text>
        <Text className="text-sm text-gray-600">
          {new Date(item.date_time).toLocaleDateString()}
        </Text>
      </View>
      <View className="mt-1">
        <Text className="text-xs text-gray-500">Seller: {item.seller.name}</Text>
      </View>
    </Pressable>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  };

  if (loading && invoices.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-2 text-gray-600">Loading reports...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        className="pt-12 pb-6 px-4"
        style={{ overflow: 'hidden' }}>
        <Text className="text-2xl font-bold text-white text-center mb-2">
          📊 Reports & Analytics
        </Text>
        <Text className="text-white text-center opacity-90">
          Comprehensive invoice analysis and insights
        </Text>
      </LinearGradient>

      <ScrollView className="flex-1 px-4">
        {/* Stats Cards */}
        {stats && (
          <View className="mt-4 space-y-3">
            <View className="flex-row space-x-3">
              <View className="flex-1 bg-white rounded-lg p-4 shadow">
                <Text className="text-sm text-gray-600">Total Invoices</Text>
                <Text className="text-2xl font-bold text-blue-600">{stats.totalInvoices}</Text>
              </View>
              <View className="flex-1 bg-white rounded-lg p-4 shadow">
                <Text className="text-sm text-gray-600">Total Revenue</Text>
                <Text className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</Text>
              </View>
            </View>
            
            <View className="flex-row space-x-3">
              <View className="flex-1 bg-white rounded-lg p-4 shadow">
                <Text className="text-sm text-gray-600">Total Profit</Text>
                <Text className="text-2xl font-bold text-purple-600">${stats.totalProfit.toFixed(2)}</Text>
              </View>
              <View className="flex-1 bg-white rounded-lg p-4 shadow">
                <Text className="text-sm text-gray-600">Avg Order</Text>
                <Text className="text-2xl font-bold text-orange-600">${stats.averageOrderValue.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Date Filters */}
        <View className="mt-4 bg-white rounded-lg p-4 shadow">
          <Text className="text-sm font-semibold text-gray-700 mb-3">Quick Date Range</Text>
          <View className="flex-row flex-wrap gap-2">
            {(['today', 'week', 'month', 'quarter', 'year'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                onPress={() => handleDateRangeQuick(range)}
                className="bg-blue-100 px-3 py-2 rounded-full">
                <Text className="text-sm font-medium text-blue-700 capitalize">{range}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search and Actions */}
        <View className="mt-4 flex-row space-x-2">
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search invoices..."
            className="flex-1 bg-white rounded-lg px-3 py-2 border border-gray-300"
          />
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            className="bg-blue-500 px-4 py-2 rounded-lg justify-center">
            <Text className="text-white font-medium">Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setExportModalVisible(true)}
            className="bg-green-500 px-4 py-2 rounded-lg justify-center">
            <Text className="text-white font-medium">Export</Text>
          </TouchableOpacity>
        </View>

        {/* Invoice List */}
        <View className="mt-4 bg-white rounded-lg shadow overflow-hidden">
          <View className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <Text className="font-semibold text-gray-700">Invoice Reports</Text>
          </View>
          
          <FlatList
            data={invoices}
            keyExtractor={(item) => item._id}
            renderItem={renderInvoice}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.1}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View className="py-8 items-center">
                <Text className="text-gray-500">No invoices found</Text>
              </View>
            }
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}>
        <View className="flex-1 bg-white p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Advanced Filter</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Text className="text-red-500 text-lg">✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView className="flex-1">
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Payment Method</Text>
                <View className="flex-row flex-wrap gap-2">
                  {(['cash', 'card', 'bank_transfer', 'credit', 'due'] as const).map((method) => (
                    <TouchableOpacity
                      key={method}
                      onPress={() => setFilters(prev => ({ ...prev, payment_method: prev.payment_method === method ? '' : method }))}
                      className={`px-3 py-2 rounded-full ${
                        filters.payment_method === method ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                      <Text className={`text-sm font-medium ${
                        filters.payment_method === method ? 'text-white' : 'text-gray-700'
                      }`}>
                        {method.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Start Date</Text>
                <TouchableOpacity
                  onPress={() => setShowStartDatePicker(true)}
                  className="border border-gray-300 rounded-lg px-3 py-2">
                  <Text className="text-gray-700">
                    {filters.startDate || 'Select start date'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">End Date</Text>
                <TouchableOpacity
                  onPress={() => setShowEndDatePicker(true)}
                  className="border border-gray-300 rounded-lg px-3 py-2">
                  <Text className="text-gray-700">
                    {filters.endDate || 'Select end date'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Customer Search</Text>
                <TextInput
                  value={filters.customer}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, customer: text }))}
                  placeholder="Search by customer name or phone"
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />
              </View>
              
              <View className="flex-row space-x-2">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Min Amount</Text>
                  <TextInput
                    value={filters.minAmount}
                    onChangeText={(text) => setFilters(prev => ({ ...prev, minAmount: text }))}
                    placeholder="0.00"
                    keyboardType="numeric"
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Max Amount</Text>
                  <TextInput
                    value={filters.maxAmount}
                    onChangeText={(text) => setFilters(prev => ({ ...prev, maxAmount: text }))}
                    placeholder="0.00"
                    keyboardType="numeric"
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  />
                </View>
              </View>
            </View>
          </ScrollView>
          
          <View className="flex-row space-x-2 mt-4">
            <TouchableOpacity
              onPress={clearFilters}
              className="flex-1 bg-gray-500 rounded-lg py-3">
              <Text className="text-white text-center font-medium">Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilterModalVisible(false)}
              className="flex-1 bg-blue-500 rounded-lg py-3">
              <Text className="text-white text-center font-medium">Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Export Modal */}
      <Modal
        visible={exportModalVisible}
        animationType="slide"
        onRequestClose={() => setExportModalVisible(false)}>
        <View className="flex-1 bg-white p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Export Report</Text>
            <TouchableOpacity onPress={() => setExportModalVisible(false)}>
              <Text className="text-red-500 text-lg">✕</Text>
            </TouchableOpacity>
          </View>
          
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Export Format</Text>
              <View className="space-y-2">
                <TouchableOpacity
                  onPress={() => setExportFormat('excel')}
                  className={`flex-row items-center p-3 rounded-lg border ${
                    exportFormat === 'excel' ? 'border-green-500 bg-green-50' : 'border-gray-300'
                  }`}>
                  <View className={`w-4 h-4 rounded-full mr-3 ${
                    exportFormat === 'excel' ? 'bg-green-500' : 'border-2 border-gray-300'
                  }`} />
                  <Text className="font-medium text-gray-700">Excel (.xlsx)</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => setExportFormat('pdf')}
                  className={`flex-row items-center p-3 rounded-lg border ${
                    exportFormat === 'pdf' ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}>
                  <View className={`w-4 h-4 rounded-full mr-3 ${
                    exportFormat === 'pdf' ? 'bg-red-500' : 'border-2 border-gray-300'
                  }`} />
                  <Text className="font-medium text-gray-700">PDF (.pdf)</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View className="bg-gray-50 p-3 rounded-lg">
              <Text className="font-medium text-gray-700 mb-2">Export will include:</Text>
              <Text className="text-sm text-gray-600">• Invoice details and customer information</Text>
              <Text className="text-sm text-gray-600">• Product details and pricing</Text>
              <Text className="text-sm text-gray-600">• Payment method and status</Text>
              <Text className="text-sm text-gray-600">• Date range: {filters.startDate || 'All'} to {filters.endDate || 'All'}</Text>
            </View>
            
            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => setExportModalVisible(false)}
                className="flex-1 bg-gray-500 rounded-lg py-3">
                <Text className="text-white text-center font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleExport}
                disabled={exporting}
                className="flex-1 bg-blue-500 rounded-lg py-3">
                {exporting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white text-center font-medium">
                    Export {exportFormat.toUpperCase()}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          onChange={handleStartDateChange}
        />
      )}
      
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          onChange={handleEndDateChange}
        />
      )}
    </View>
  );
}
