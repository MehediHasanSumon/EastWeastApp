import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

export default function ReportsScreen() {
  // Default to current month and year
  const [month, setMonth] = useState(() => {
    return new Date().toLocaleString('default', { month: 'long' });
  });
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const months = [
    { label: 'January', value: 'January' },
    { label: 'February', value: 'February' },
    { label: 'March', value: 'March' },
    { label: 'April', value: 'April' },
    { label: 'May', value: 'May' },
    { label: 'June', value: 'June' },
    { label: 'July', value: 'July' },
    { label: 'August', value: 'August' },
    { label: 'September', value: 'September' },
    { label: 'October', value: 'October' },
    { label: 'November', value: 'November' },
    { label: 'December', value: 'December' },
  ];

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = 2000; y <= currentYear + 10; y++) {
    years.push({ label: y.toString(), value: y.toString() });
  }

  const data = [
    { id: '1', name: 'Product A', qty: 10, total: 2000 },
    { id: '2', name: 'Product B', qty: 5, total: 1500 },
  ];

  const handleFilter = () => {
    console.log('Filter:', month, year, startDate, endDate);
    // Add your filtering logic here
  };

  const onStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      setStartDate(selectedDate);
    }
    setShowStartPicker(false);
  };

  const onEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      setEndDate(selectedDate);
    }
    setShowEndPicker(false);
  };

  return (
    <View className="flex-1 bg-white p-4">
      <View className="m-auto h-full w-full">
        <View className="mb-3 flex-row gap-3">
          <View className="flex-1 rounded-lg border border-gray-300">
            <Picker
              selectedValue={month}
              onValueChange={(itemValue) => setMonth(itemValue)}
              mode="dropdown"
              style={{ height: 50 }}>
              <Picker.Item label="Select Month" value="" />
              {months.map((m) => (
                <Picker.Item key={m.value} label={m.label} value={m.value} />
              ))}
            </Picker>
          </View>

          <View className="flex-1 rounded-lg border border-gray-300">
            <Picker
              selectedValue={year}
              onValueChange={(itemValue) => setYear(itemValue)}
              mode="dropdown"
              style={{ height: 50 }}>
              <Picker.Item label="Select Year" value="" />
              {years.map((y) => (
                <Picker.Item key={y.value} label={y.label} value={y.value} />
              ))}
            </Picker>
          </View>
        </View>

        <View className="mb-3 flex-row gap-3">
          <TouchableOpacity
            onPress={() => setShowStartPicker(true)}
            className="flex-1 rounded-lg border border-gray-300 p-3">
            <Text>
              Start Date:{'\n'}
              {startDate.toDateString()}
            </Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={onStartDateChange}
            />
          )}

          <TouchableOpacity
            onPress={() => setShowEndPicker(true)}
            className="flex-1 rounded-lg border border-gray-300 p-3">
            <Text>
              End Date:{'\n'}
              {endDate.toDateString()}
            </Text>
          </TouchableOpacity>
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={onEndDateChange}
            />
          )}
        </View>

        <TouchableOpacity onPress={handleFilter} className="mb-4 rounded-lg bg-blue-500 py-3">
          <Text className="text-center font-bold text-white">Filter</Text>
        </TouchableOpacity>

        <View className="flex-row border-b border-gray-300 bg-gray-200 px-2 py-2">
          <Text className="flex-1 font-bold text-gray-700">Name</Text>
          <Text className="flex-1 font-bold text-gray-700">Qty</Text>
          <Text className="flex-1 font-bold text-gray-700">Total</Text>
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View
              className={`flex-row border-b border-gray-100 px-2 py-2 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}>
              <Text className="flex-1 text-gray-800">{item.name}</Text>
              <Text className="flex-1 text-gray-800">{item.qty}</Text>
              <Text className="flex-1 text-gray-800">{item.total}</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}
