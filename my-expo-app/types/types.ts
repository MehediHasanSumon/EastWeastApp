// types.ts

export type Contact = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  online: boolean;
  unread?: boolean;
  avatarText: string;
};

export type Message = {
  id: string;
  text: string;
  time: string;
  isSent: boolean;
  image?: string;
  file?: string;
  attachment?: Attachment;
  sender?: {
    name: string;
    avatar: string;
  };
  contactId?: string;
};

export type Attachment = {
  id: string;
  uri: string;
  name: string;
  type: 'image' | 'document' | 'audio';
  size?: number;
};

export type Member = {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  lastSeen?: string;
  phone?: string;
  role?: 'Admin' | 'Member'; // Added role for group members
};

export type UserRole = 'Admin' | 'Member';

export interface User {
  id: string;
  name: string;
  avatarText: string;
  online: boolean;
  lastActive?: string;
}

export interface SelectedUser extends User {
  role: UserRole;
}

export type GroupMember = User & {
  role: UserRole;
  id: string;
  name: string;
};

export interface GroupTag {
  id: string;
  name: string;
  color: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: Member[]; // Member টাইপ ব্যবহার হচ্ছে
  tags?: GroupTag[];
  icon?: string;
  createdAt: string;
  isMuted?: boolean;
}

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
  People: undefined;
  Groups: undefined;
  group: Group;

  Conversation: {
    userId: string;
    userName: string;
    userImage: any;
  };
  Chat: {
    userId: string;
    userName: string;
    contactId: string;
    contactName: string;
  };
  GroupChat: {
    group: Group;
  };
  ForwardScreen: { message: Message };
  CallScreen:
    | { type: 'audio' | 'video'; group: Group }
    | { type: 'audio' | 'video'; contactId: string; contactName: string };
  ContactDetails: {
    contactName: string;
    contactId: string;
  };
  GroupConversation: {
    groupId: string;
    groupName: string;
    groupMembers: {
      id: string;
      name: string;
      image: any;
    }[];
  };
  GroupCreated: { group: Group };
  Messages: { newGroup?: Group } | undefined;
  CreateGroup: undefined;
  AddGroupMembers: {
    groupId: string;
    existingMembers: string[];
  };
  Profile: undefined;
  ImageViewer: {
    uri: string;
  };
  Messenger: undefined;
};

export type SafeRoutes = Exclude<
  {
    [K in keyof RootStackParamList]: RootStackParamList[K] extends undefined ? K : never;
  }[keyof RootStackParamList],
  'Dashboard'
>;
