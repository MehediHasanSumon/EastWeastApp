// types.ts



export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  EditProfile: undefined;
  CompanyLogo: undefined;
  AccountCalculation: undefined;
  CustomerBill: undefined;
  DipCalculation: undefined;
  Report: undefined;
  Products: undefined;
  CreateProduct: undefined;
  Employee: undefined;
  MakeInvoice: undefined;
  Messenger: undefined;

  PrintMakeInvoice: {
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
    totalAmount?: string;
  };
  InvoiceDetail: {
    invoice: {
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
    };
  };
  Settings: undefined;
  Profile: undefined;
};

export type SafeRoutes = Exclude<
  {
    [K in keyof RootStackParamList]: RootStackParamList[K] extends undefined ? K : never;
  }[keyof RootStackParamList],
  'Dashboard'
>;


