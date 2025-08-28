import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

type Product = {
  _id: string;
  name: string;
  purchases: number;
  sell: number;
  description?: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function ProductsScreen() {
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // CRUD Modal States
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    name: '',
    purchases: '',
    sell: '',
    description: '',
  });

  const fetchProducts = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setPage(1);
      }
      
      const response = await api.get('/api/admin/get/products', {
        params: {
          page: pageNum,
          perPage: 20,
          search: search,
        },
      });

      const { products: newProducts, meta } = response.data;
      
      if (refresh || pageNum === 1) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }
      
      setHasMore(meta.currentPage < meta.lastPage);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts(1, true);
  }, [search]);

  const onRefresh = () => {
    fetchProducts(1, true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchProducts(page + 1);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      purchases: '',
      sell: '',
      description: '',
    });
  };

  const openCreateModal = () => {
    resetForm();
    setCreateModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      purchases: product.purchases.toString(),
      sell: product.sell.toString(),
      description: product.description || '',
    });
    setViewModalVisible(false);
    setEditModalVisible(true);
  };

  const openViewModal = (product: Product) => {
    setViewModalVisible(true);
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.purchases || !formData.sell) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/admin/create/product', {
        name: formData.name,
        purchases: parseFloat(formData.purchases),
        sell: parseFloat(formData.sell),
        description: formData.description || null,
      });
      
      Alert.alert('Success', 'Product created successfully');
      setCreateModalVisible(false);
      resetForm();
      fetchProducts(1, true);
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.name || !formData.purchases || !formData.sell) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const currentProduct = products.find(p => p.name === formData.name);
      if (!currentProduct) {
        throw new Error('Product not found');
      }

      await api.put(`/api/admin/update/product/${currentProduct._id}`, {
        name: formData.name,
        purchases: parseFloat(formData.purchases),
        sell: parseFloat(formData.sell),
        description: formData.description || null,
      });
      
      Alert.alert('Success', 'Product updated successfully');
      setEditModalVisible(false);
      resetForm();
      fetchProducts(1, true);
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this product? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post('/api/admin/delete/products', { ids: [id] });
            Alert.alert('Success', 'Product deleted successfully');
            fetchProducts(1, true);
          } catch (error) {
            console.error('Error deleting product:', error);
            Alert.alert('Error', 'Failed to delete product');
          }
        },
      },
    ]);
  };

  const handleStatusToggle = async (product: Product) => {
    try {
      await api.put(`/api/admin/update/product-status/${product._id}`, {
        status: !product.status,
      });
      Alert.alert('Success', 'Product status updated successfully');
      fetchProducts(1, true);
    } catch (error) {
      console.error('Error updating product status:', error);
      Alert.alert('Error', 'Failed to update product status');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800">{item.name}</Text>
          {item.description && (
            <Text className="text-sm text-gray-600 mt-1" numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View className="flex-row mt-3 space-x-4">
            <View>
              <Text className="text-xs text-gray-500">Purchase Price</Text>
              <Text className="text-sm font-semibold text-gray-800">৳{item.purchases}</Text>
            </View>
            <View>
              <Text className="text-xs text-gray-500">Sell Price</Text>
              <Text className="text-sm font-semibold text-gray-800">৳{item.sell}</Text>
            </View>
            <View>
              <Text className="text-xs text-gray-500">Profit</Text>
              <Text className="text-sm font-semibold text-green-600">
                ৳{(item.sell - item.purchases).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
        <View className="items-end">
          <View className={`px-3 py-1 rounded-full mb-2 ${
            item.status ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Text className={`text-xs font-medium ${
              item.status ? 'text-green-800' : 'text-red-800'
            }`}>
              {item.status ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => handleStatusToggle(item)}
              className={`p-2 rounded-full ${
                item.status ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
              <Ionicons
                name={item.status ? 'pause' : 'play'}
                size={16}
                color={item.status ? '#d97706' : '#059669'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openViewModal(item)}
              className="p-2 rounded-full bg-blue-100">
              <Ionicons name="eye" size={16} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openEditModal(item)}
              className="p-2 rounded-full bg-green-100">
              <Ionicons name="create" size={16} color="#059669" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item._id)}
              className="p-2 rounded-full bg-red-100">
              <Ionicons name="trash" size={16} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View className="mt-3 pt-3 border-t border-gray-100">
        <Text className="text-xs text-gray-500">
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <Text className="text-xs text-gray-500">
          Updated: {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  };

  if (loading && products.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-2 text-gray-600">Loading products...</Text>
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
          📦 Product Management
        </Text>
        <Text className="text-white text-center opacity-90">
          Manage your product catalog and pricing
        </Text>
      </LinearGradient>

      {/* Search and Add Button */}
      <View className="px-4 mt-4">
        <View className="flex-row space-x-3">
          <View className="flex-1">
            <TextInput
              className="bg-white rounded-lg px-4 py-3 border border-gray-300"
              placeholder="Search products..."
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity
            onPress={openCreateModal}
            className="bg-blue-600 px-6 py-3 rounded-lg">
            <Text className="text-white font-semibold">Add Product</Text>
          </TouchableOpacity>
        </View>
        
        <View className="mt-3">
          <Text className="text-center py-2 text-gray-600">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <View className="flex-1 items-center justify-center py-20">
          <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
          <Text className="mt-4 text-xl font-semibold text-gray-600">No products found</Text>
          <Text className="mt-2 text-gray-500 text-center">
            {search 
              ? 'Try adjusting your search'
              : 'Get started by adding your first product'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          className="mt-4 px-4"
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Create Product Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}>
        <View className="flex-1 justify-center bg-black/50 p-5">
          <ScrollView className="bg-white rounded-2xl p-6 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-gray-800">Create New Product</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Product Name *</Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="Enter product name"
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                />
              </View>
              
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Purchase Price *</Text>
                <TextInput
                  value={formData.purchases}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, purchases: text }))}
                  placeholder="Enter purchase price"
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                />
              </View>
              
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Sell Price *</Text>
                <TextInput
                  value={formData.sell}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, sell: text }))}
                  placeholder="Enter sell price"
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                />
              </View>
              
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
                <TextInput
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Enter description (optional)"
                  multiline
                  numberOfLines={3}
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                />
              </View>
            </View>
            
            <View className="flex-row space-x-3 mt-8">
              <TouchableOpacity
                onPress={() => setCreateModalVisible(false)}
                className="flex-1 bg-gray-500 py-3 rounded-lg">
                <Text className="text-white font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                disabled={submitting}
                className="flex-1 bg-blue-600 py-3 rounded-lg">
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-semibold text-center">Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}>
        <View className="flex-1 justify-center bg-black/50 p-5">
          <ScrollView className="bg-white rounded-2xl p-6 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-gray-800">Edit Product</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Product Name *</Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="Enter product name"
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                />
              </View>
              
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Purchase Price *</Text>
                <TextInput
                  value={formData.purchases}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, purchases: text }))}
                  placeholder="Enter purchase price"
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                />
              </View>
              
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Sell Price *</Text>
                <TextInput
                  value={formData.sell}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, sell: text }))}
                  placeholder="Enter sell price"
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                />
              </View>
              
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
                <TextInput
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Enter description (optional)"
                  multiline
                  numberOfLines={3}
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                />
              </View>
            </View>
            
            <View className="flex-row space-x-3 mt-8">
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                className="flex-1 bg-gray-500 py-3 rounded-lg">
                <Text className="text-white font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdate}
                disabled={submitting}
                className="flex-1 bg-blue-600 py-3 rounded-lg">
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-semibold text-center">Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* View Product Modal */}
      <Modal
        visible={viewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setViewModalVisible(false)}>
        <View className="flex-1 justify-center bg-black/50 p-5">
          <ScrollView className="bg-white rounded-2xl p-6 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-gray-800">Product Details</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {products.length > 0 && (
              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Product Name</Text>
                  <Text className="text-lg text-gray-800">{formData.name}</Text>
                </View>
                
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Purchase Price</Text>
                  <Text className="text-lg text-gray-800">৳{formData.purchases}</Text>
                </View>
                
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Sell Price</Text>
                  <Text className="text-lg text-gray-800">৳{formData.sell}</Text>
                </View>
                
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Profit Margin</Text>
                  <Text className="text-lg text-green-600">
                    ৳{(parseFloat(formData.sell) - parseFloat(formData.purchases)).toFixed(2)}
                  </Text>
                </View>
                
                {formData.description && (
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
                    <Text className="text-lg text-gray-800">{formData.description}</Text>
                  </View>
                )}
              </View>
            )}
            
            <View className="flex-row space-x-3 mt-8">
              <TouchableOpacity
                onPress={() => setViewModalVisible(false)}
                className="flex-1 bg-gray-500 py-3 rounded-lg">
                <Text className="text-white font-semibold text-center">Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setViewModalVisible(false);
                  const currentProduct = products.find(p => p.name === formData.name);
                  if (currentProduct) {
                    openEditModal(currentProduct);
                  }
                }}
                className="flex-1 bg-blue-600 py-3 rounded-lg">
                <Text className="text-white font-semibold text-center">Edit</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
