import type { Client, Employee, RepairOrder, SparePart, ServiceAction, CostEstimate, PartOrder, WorkLog, Invoice } from './schema';

export const mockEmployees: Employee[] = [
  { id: '1', firstName: 'Jan', lastName: 'Kowalski', email: 'jan.kowalski@service.com', role: 'MANAGER' },
  { id: '2', firstName: 'Anna', lastName: 'Nowak', email: 'anna.nowak@service.com', role: 'OFFICE' },
  { id: '3', firstName: 'Piotr', lastName: 'Wiśniewski', email: 'piotr.wisniewski@service.com', role: 'TECHNICIAN', skillLevel: 'SENIOR' },
  { id: '4', firstName: 'Krzysztof', lastName: 'Zieliński', email: 'krzysztof.zielinski@service.com', role: 'TECHNICIAN', skillLevel: 'MID' },
  { id: '5', firstName: 'Marek', lastName: 'Wójcik', email: 'marek.wojcik@service.com', role: 'WAREHOUSE' },
];

export const mockClients: Client[] = [
  { id: '1', firstName: 'Adam', lastName: 'Małysz', phone: '123456789', email: 'adam@example.com', pin: '1234' },
  { id: '2', firstName: 'Robert', lastName: 'Kubica', phone: '987654321', email: 'robert@example.com', pin: '4321' },
];

export const mockSpareParts: SparePart[] = [
  { id: '1', name: 'Screen 15.6"', category: 'Screen', quantity: 10, minQuantity: 5, price: 300.00 },
  { id: '2', name: 'SSD 512GB', category: 'Storage', quantity: 5, minQuantity: 2, price: 200.00 },
  { id: '3', name: 'RAM 8GB DDR4', category: 'Memory', quantity: 20, minQuantity: 5, price: 150.00 },
  { id: '4', name: 'Thermal Paste', category: 'Consumable', quantity: 50, minQuantity: 10, price: 20.00 },
];

export const mockServiceActions: ServiceAction[] = [
  { id: '1', name: 'Laptop Cleaning + Thermal Paste', price: 200 },
  { id: '2', name: 'OS Installation', price: 120 },
  { id: '3', name: 'Data Recovery', price: 500 },
  { id: '4', name: 'Disk Replacement', price: 70 },
];

export const mockOrders: RepairOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-2023-001',
    createdAt: '2023-10-25T10:00:00Z',
    deviceDescription: 'Dell XPS 15',
    problemDescription: 'Overheating and shutting down',
    status: 'DIAGNOSING',
    clientId: '1',
    assignedTechnicianId: '3',
  },
  {
    id: '2',
    orderNumber: 'ORD-2023-002',
    createdAt: '2023-10-26T14:30:00Z',
    deviceDescription: 'MacBook Pro 2019',
    problemDescription: 'Battery not charging',
    status: 'WAITING_FOR_TECHNICIAN',
    clientId: '2',
  },
  {
    id: '3',
    orderNumber: 'ORD-2023-003',
    createdAt: '2023-10-27T09:15:00Z',
    deviceDescription: 'Lenovo ThinkPad',
    problemDescription: 'Broken screen',
    status: 'COMPLETED',
    clientId: '1',
    assignedTechnicianId: '4',
  }
];

export const mockEstimates: CostEstimate[] = [
  {
    id: '1',
    orderId: '3',
    partsCost: 600,
    labourCost: 150,
    totalCost: 750,
    parts: [
        { partId: '1', quantity: 1, name: 'Screen 15.6"', price: 300 },
        { partId: '2', quantity: 1, name: 'SSD 512GB', price: 200 } // Example parts matching cost
    ],
    approved: null,
    createdAt: '2023-10-27T11:00:00Z',
  }
];

export const mockPartOrders: PartOrder[] = [];

export const mockInvoices: Invoice[] = [];

export const mockWorkLogs: WorkLog[] = [];
