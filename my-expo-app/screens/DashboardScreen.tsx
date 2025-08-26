import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useContext } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { RootStackParamList, SafeRoutes } from '../types/types';

type DashboardItem = {
  title: string;
  route: SafeRoutes | 'Messages';
  icon: any;
};

const dashboardItems: DashboardItem[] = [
  { title: 'Profile', route: 'Profile', icon: require('../assets/profile.png') },
  { title: 'Company Logo', route: 'CompanyLogo', icon: require('../assets/company.png') },
  {
    title: 'Account Calculation',
    route: 'AccountCalculation',
    icon: require('../assets/account.png'),
  },
  { title: 'Customer Bill Details', route: 'CustomerBill', icon: require('../assets/bill.png') },
  { title: 'Dip Calculation', route: 'DipCalculation', icon: require('../assets/dip.png') },
  { title: 'Report', route: 'Report', icon: require('../assets/report.png') },
  { title: 'Products', route: 'Products', icon: require('../assets/product.png') },
  { title: 'Employee', route: 'Employee', icon: require('../assets/employee.png') },
  { title: 'Make Invoice', route: 'MakeInvoice', icon: require('../assets/invoice.png') },
  { title: 'General Settings', route: 'Settings', icon: require('../assets/settings.png') },
  { title: 'Messages', route: 'Messenger', icon: require('../assets/convartion.png') },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const DashboardScreen = ({ navigation }: Props) => {
  const { theme } = useContext(ThemeContext);

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="mt-12 px-4"
      style={{ backgroundColor: theme.bgColor }}>
      <Text
        className=" my-5 text-center font-bold"
        style={{ color: theme.fontColor, fontSize: theme.fontSize + 10 }}>
        Dashboard
      </Text>

      <View className="flex-row flex-wrap justify-between">
        {dashboardItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            className="my-2 aspect-square w-[48%] items-center justify-center rounded-xl border"
            style={{
              backgroundColor: theme.mode === 'dark' ? '#333' : '#f9f9f9',
              borderColor: theme.mode === 'dark' ? '#555' : '#ccc',
            }}
            onPress={() => {
              navigation.navigate(item.route, undefined);
            }}>
            <Image source={item.icon} className="mb-2 h-16 w-16" resizeMode="contain" />
            <Text
              className="text-center font-semibold"
              style={{ color: theme.fontColor, fontSize: theme.fontSize }}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default DashboardScreen;
