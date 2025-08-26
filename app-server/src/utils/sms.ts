import { IInvoice } from "../interface/models/model_interfaces";

export function formatSms(template: string, data: IInvoice): string {
  let result = template;

  if (result.includes("{invoice_no}")) {
    result = result.replace(/\{invoice_no\}/g, String(data.invoice_no || ""));
  }
  if (result.includes("{date_time}")) {
    result = result.replace(/\{date_time\}/g, String(data.date_time || ""));
  }
  if (result.includes("{vehicle_no}")) {
    result = result.replace(/\{vehicle_no\}/g, String(data.vehicle_no || ""));
  }
  if (result.includes("{customer_name}")) {
    result = result.replace(/\{customer_name\}/g, String(data.customer_name || ""));
  }
  if (result.includes("{customer_phone_number}")) {
    result = result.replace(/\{customer_phone_number\}/g, String(data.customer_phone_number || ""));
  }
  if (result.includes("{payment_method}")) {
    result = result.replace(/\{payment_method\}/g, String(data.payment_method || ""));
  }
  if (result.includes("{product}")) {
    result = result.replace(/\{product\}/g, String(data.product || ""));
  }
  if (result.includes("{seller}")) {
    result = result.replace(/\{seller\}/g, String(data.seller || ""));
  }
  if (result.includes("{price}")) {
    result = result.replace(/\{price\}/g, String(data.price || ""));
  }
  if (result.includes("{quantity}")) {
    result = result.replace(/\{quantity\}/g, String(data.quantity || ""));
  }
  if (result.includes("{total_amount}")) {
    result = result.replace(/\{total_amount\}/g, String(data.total_amount || ""));
  }
  if (result.includes("{discount}")) {
    result = result.replace(/\{discount\}/g, String(data.discount || ""));
  }
  return result;
}
