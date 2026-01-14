export type EmployeeRole = "OFFICE" | "TECHNICIAN" | "WAREHOUSE" | "MANAGER";
export type SkillLevel = "JUNIOR" | "MID" | "SENIOR";
export type OrderStatus =
  | "NEW"
  | "WAITING_FOR_TECHNICIAN"
  | "DIAGNOSING"
  | "WAITING_FOR_ACCEPTANCE"
  | "WAITING_FOR_PARTS"
  | "IN_PROGRESS"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED";
export type PartOrderStatus =
  | "ORDERED"
  | "IN_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";
export type InvoiceStatus = "ISSUED" | "PAID" | "CANCELLED";
export type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER";
export type PaymentStatus = "ACCEPTED" | "REJECTED" | "PENDING_SYNC";

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: EmployeeRole;
  skillLevel?: SkillLevel;
  password?: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  pin: string;
}

export interface SparePart {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  price: number;
}

export interface ServiceAction {
  id: string;
  name: string;
  price: number;
}

export interface PartUsage {
  id: string;
  orderId: string;
  sparePartId: string;
  quantity: number;
  unitPrice: number;
}

export interface ActionUsage {
  id: string;
  orderId: string;
  actionId: string;
  discount: number;
}

export interface WorkLog {
  id: string;
  orderId: string;
  technicianId: string;
  startTime: string; // ISO date
  endTime?: string; // ISO date, undefined if currently running
  durationMinutes?: number;
}

export interface RepairOrder {
  id: string;
  orderNumber: string;
  createdAt: string; // ISO date
  startDate?: string;
  endDate?: string;
  deviceDescription: string;
  problemDescription: string;
  status: OrderStatus;
  clientId: string;
  assignedTechnicianId?: string;
  managerNotes?: string;
  totalWorkTimeMinutes?: number; // Aggregated work time
  diagnosisDescription?: string; // Technical diagnosis details
}

export interface CostEstimate {
  id: string;
  orderId: string;
  partsCost: number;
  labourCost: number;
  totalCost: number;
  parts: { partId: string; quantity: number; name: string; price: number }[];
  approved: boolean | null; // null = pending
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  totalAmount: number;
  status: InvoiceStatus;
  orderId: string;
  clientId: string;
  paymentMethod: PaymentMethod;
}

export interface PartOrder {
  id: string;
  sparePartId: string;
  orderDate: string;
  estimatedDelivery: string;
  status: PartOrderStatus;
  quantity: number;
  repairOrderId?: string;
}
