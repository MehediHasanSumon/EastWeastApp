import { Contact, Message } from '../types/types';

export const contacts: Contact[] = [
  {
    id: '1',
    name: 'Alice Smith',
    lastMessage: 'Hey, how are you?',
    time: '10:45 AM',
    online: true,
    unread: true,
    avatarText: 'AS',
  },
  {
    id: '2',
    name: 'Bob Johnson',
    lastMessage: 'Meeting at 3 PM',
    time: 'Yesterday',
    online: true,
    avatarText: 'BJ',
  },
  {
    id: '3',
    name: 'Charlie Rose',
    lastMessage: 'Thanks for your help!',
    time: 'Yesterday',
    online: false,
    avatarText: 'CR',
  },
  {
    id: '4',
    name: 'Diana Wilson',
    lastMessage: 'project_update.pdf',
    time: 'Wed',
    online: true,
    avatarText: 'DW',
  },
  {
    id: '5',
    name: 'Ethan Miller',
    lastMessage: 'See you tomorrow!',
    time: 'Tue',
    online: false,
    avatarText: 'EM',
  },
  {
    id: '6',
    name: 'Faisal Khan',
    lastMessage: 'See you tomorrow!',
    time: 'Tue',
    online: false,
    avatarText: 'EM',
  },
  {
    id: '7',
    name: 'Amir Khan',
    lastMessage: 'See you tomorrow!',
    time: 'Tue',
    online: false,
    avatarText: 'EM',
  },
  {
    id: '8',
    name: 'badshah',
    lastMessage: 'See you tomorrow!',
    time: 'Tue',
    online: false,
    avatarText: 'EM',
  },
  {
    id: '9',
    name: 'Hamjson Lee',
    lastMessage: 'See you tomorrow!',
    time: 'Tue',
    online: false,
    avatarText: 'EM',
  },
];

export const initialMessages: Message[] = [
  {
    id: '1',
    text: 'Hey there! How are you doing?',
    time: '10:30 AM',
    isSent: false,
  },
  {
    id: '2',
    text: "I'm doing great, thanks for asking!",
    time: '10:32 AM',
    isSent: true,
  },
  {
    id: '3',
    text: 'Want to meet for coffee later?',
    time: '10:33 AM',
    isSent: false,
  },
  {
    id: '4',
    text: 'Sure, how about 2 PM at the usual place?',
    time: '10:35 AM',
    isSent: true,
  },
];
export const generateAvatar = (name: string) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
};
