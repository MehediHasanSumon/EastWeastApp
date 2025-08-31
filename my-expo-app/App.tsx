// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import './global.css';

// Auth Context
import { AuthProvider } from './context/AuthContext';
import ThemeProvider from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';
import { ToastProvider } from './context/ToastContext';
import { UserStatusProvider } from './context/UserStatusContext';
import UserStatusErrorBoundary from './components/UserStatusErrorBoundary';

// Store
import { store } from './store';
import { RootState, useAppDispatch } from './store';
import { hydrateAuth } from './store/authSlice';

// Screens
import AccountCalculationScreen from './screens/AccountCalculationScreen';
import CompanyLogoScreen from './screens/CompanyLogoScreen';
import CustomerBillScreen from './screens/CustomerBillScreen';
import DashboardScreen from './screens/DashboardScreen';
import DipCalculationScreen from './screens/DipCalculationScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import EmployeeScreen from './screens/EmployeeScreen';
import InvoiceDetailScreen from './screens/InvoiceDetailScreen';
import LoginScreen from './screens/LoginScreen';
import MakeInvoiceScreen from './screens/MakeInvoiceScreen';
import PrintMakeInvoiceScreen from './screens/PrintMakeInvoiceScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import ConversationListScreen from './screens/ConversationListScreen';
import ChatScreen from './screens/ChatScreen';
import NewConversationScreen from './screens/NewConversationScreen';

// Types
import CreateProduct from 'components/CreateProduct';
import ProductScreen from './screens/ProductsScreen';
import ReportScreen from './screens/ReportScreen';
import { RootStackParamList } from './types/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, hydrated } = useSelector((state: RootState) => state.auth);

  // Hydrate auth state on app startup
  useEffect(() => {
    if (!hydrated) {
      dispatch(hydrateAuth());
    }
  }, [dispatch, hydrated]);

  // Show loading screen while checking authentication
  if (isLoading || !hydrated) {
    return null; // You can add a proper loading screen here
  }

  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={{
        headerShown: true,
      }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" options={{ headerShown: false }}>
          {(props: NativeStackScreenProps<RootStackParamList, 'Login'>) => (
            <LoginScreen {...props} />
          )}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CompanyLogo"
            component={CompanyLogoScreen}
            options={{ title: 'Company Logo' }}
          />
          <Stack.Screen
            name="AccountCalculation"
            component={AccountCalculationScreen}
            options={{ title: 'Account Calculation' }}
          />
          <Stack.Screen
            name="CustomerBill"
            component={CustomerBillScreen}
            options={{ title: 'Customer Bill' }}
          />
          <Stack.Screen
            name="DipCalculation"
            component={DipCalculationScreen}
            options={{ title: 'Dip Calculation' }}
          />
          <Stack.Screen name="Report" component={ReportScreen} />
          <Stack.Screen name="Products" component={ProductScreen} />
          <Stack.Screen
            name="CreateProduct"
            component={CreateProduct}
            options={{ title: 'Create Product' }}
          />
          <Stack.Screen name="Employee" component={EmployeeScreen} />
          <Stack.Screen
            name="MakeInvoice"
            component={MakeInvoiceScreen}
            options={{ title: 'MakeInvoice' }}
          />
          <Stack.Screen
            name="PrintMakeInvoice"
            component={PrintMakeInvoiceScreen}
            options={{ title: 'PrintMake Invoice' }}
          />
          <Stack.Screen
            name="InvoiceDetail"
            component={InvoiceDetailScreen}
            options={{ title: 'Invoice Details' }}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen 
            name="ConversationList" 
            component={ConversationListScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ChatScreen" 
            component={ChatScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="NewConversationScreen" 
            component={NewConversationScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AuthProvider>
          <UserStatusErrorBoundary>
            <UserStatusProvider>
              <ChatProvider>
                <ToastProvider>
                  <NavigationContainer>
                    <AppNavigator />
                  </NavigationContainer>
                </ToastProvider>
              </ChatProvider>
            </UserStatusProvider>
          </UserStatusErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
}
