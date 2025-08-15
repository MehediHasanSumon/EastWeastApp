// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import './global.css';

// Auth Context
import { AuthProvider } from './context/AuthContext';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from './store';
import { hydrateAuth, refreshSession } from './store/authSlice';
import ThemeProvider from './context/ThemeContext';

// Screens
import AccountCalculationScreen from './screens/AccountCalculationScreen';
import CallScreen from './screens/CallScreen';
import ChatScreen from './screens/ChatScreen';
import CompanyLogoScreen from './screens/CompanyLogoScreen';
import CreateGroupScreen from './screens/CreateGroupScreen';
import CustomerBillScreen from './screens/CustomerBillScreen';
import DashboardScreen from './screens/DashboardScreen';
import DipCalculationScreen from './screens/DipCalculationScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import EmployeeScreen from './screens/EmployeeScreen';
import GroupChatScreen from './screens/GroupChatScreen';
import ImageViewerScreen from './screens/ImageViewerScreen';
import LoginScreen from './screens/LoginScreen';
import MakeInvoiceScreen from './screens/MakeInvoiceScreen';
import MessagesScreen from './screens/MessagesScreen';
import PrintMakeInvoiceScreen from './screens/PrintMakeInvoiceScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';

// Types
import CreateProduct from 'components/CreateProduct';
import ProductScreen from './screens/ProductsScreen';
import ReportsScreen from './screens/ReportScreen';
import { RootStackParamList } from './types/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, hydrated } = useAppSelector((s) => s.auth);

  useEffect(() => {
    // On mount, hydrate from storage then attempt to refresh access token
    const init = async () => {
      await dispatch(hydrateAuth());
      // Only try refresh after hydration; ignore failures unless 401 handled in slice
      try {
        await dispatch(refreshSession());
      } catch {}
    };
    init();
  }, [dispatch]);

  if (!hydrated) {
    return null;
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
            <LoginScreen {...props} onLoginSuccess={() => {}} />
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
          <Stack.Screen name="Report" component={ReportsScreen} />
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
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Messages" component={MessagesScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CallScreen" component={CallScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ImageViewer" component={ImageViewerScreen} />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
          <Stack.Screen
            name="GroupChat"
            component={GroupChatScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Provider store={store}>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </Provider>
      </AuthProvider>
    </ThemeProvider>
  );
}
