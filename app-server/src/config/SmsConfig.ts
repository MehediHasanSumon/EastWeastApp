import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

interface SMSConfig {
  apiKey: string;
  senderId: string;
  apiUrl: string;
}

const smsConfig: SMSConfig = {
  apiKey: process.env.SMS_API_KEY as string,
  senderId: process.env.SMS_SENDER_ID as string,
  apiUrl: "http://bulksmsbd.net/api/smsapi",
};

export async function sendSMS(number: string | string[], message: string) {
  try {
    const numbers = Array.isArray(number) ? number.join(",") : number;

    const response = await axios.post(smsConfig.apiUrl, {
      api_key: smsConfig.apiKey,
      senderid: smsConfig.senderId,
      number: numbers,
      message: message,
    });

    console.log("SMS Sent:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("SMS Error:", error.response?.data || error.message);
    throw error;
  }
}
