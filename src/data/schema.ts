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

export type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER";
export type PaymentStatus = "ACCEPTED" | "REJECTED" | "PENDING_SYNC";
export type DocumentStatus = "ISSUED" | "PAID" | "CANCELLED";

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
  pin?: string;
}

export interface SparePart {
  id: string;
  name: string;
  type: string;
  stockQuantity: number;
  price: number;
  minQuantity?: number;
}

export interface ServiceAction {
  id: string;
  name: string;
  price: number;
}

export interface PartResponse {
  id: string;
  name: string;
  type: string;
  quantity: number;
  price: number;
}

export interface ActionResponse {
  id: string;
  name: string;
  price: number;
}

export interface CostEstimate {
  id: string;
  approved: boolean | null;
  createdAt: string;
  partsCost: number;
  labourCost: number;
  totalCost: number;
  parts: PartResponse[];
  actions: ActionResponse[];
}

export interface RepairOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  deviceDescription: string;
  problemDescription: string;
  status: OrderStatus;
  clientId: string;
  clientName: string;
  clientPhone: string;
  technicianName?: string;
  managerNotes?: string;
  costEstimateResponse?: CostEstimate;
  assignedTechnicianId?: string;
  totalWorkTimeMinutes?: number;
}

export interface Invoice {
  documentNumber: string;
  issueDate: string;
  totalAmount: number;
  status: DocumentStatus;
  orderId?: string;
}

export interface PartOrder {
  id: string;
  orderDate: string;
  estimatedDelivery: string;
  quantity: number;
  status: PartOrderStatus;
  sparePart: SparePart;
}

export interface AuthResponse {
  token: string;
  role: string;
  username: string;
}
