import {
  mockClients, mockEmployees, mockOrders, mockSpareParts, mockEstimates, mockWorkLogs, mockServiceActions, mockInvoices, mockPartOrders
} from './mockData';
import type { Client, RepairOrder, ServiceAction, Invoice, PartOrder, Employee, CostEstimate } from './schema';

// Simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  auth: {
    loginEmployee: async (email: string, password?: string) => {
      await delay(500);
      // In a real app, we would hash the password and compare
      // For mock, we'll just check if it matches the mock data or generic 'password'
      const employee = mockEmployees.find(e => e.email === email);
      if (!employee) throw new Error('Invalid credentials');
      
      // Simple mock password check
      if (password && password === 'wrong') throw new Error('Invalid password');
      
      return employee;
    },
    loginClient: async (phone: string, pin: string) => {
      await delay(500);
      const client = mockClients.find(c => c.phone === phone && c.pin === pin);
      if (!client) throw new Error('Invalid credentials');
      return client;
    }
  },
  clients: {
    getAll: async () => {
      await delay(500);
      return [...mockClients];
    },
    getById: async (id: string) => {
      await delay(300);
      return mockClients.find(c => c.id === id);
    },
    create: async (client: Omit<Client, 'id'>) => {
      await delay(500);
      const newClient = { ...client, id: Math.random().toString(36).substr(2, 9) };
      mockClients.push(newClient);
      return newClient;
    }
  },
  orders: {
    getAll: async () => {
      await delay(500);
      return [...mockOrders];
    },
    getById: async (id: string) => {
      await delay(300);
      return mockOrders.find(o => o.id === id);
    },
    getByClientId: async (clientId: string) => {
        await delay(300);
        return mockOrders.filter(o => o.clientId === clientId);
    },
    getByTechnicianId: async (techId: string) => {
        await delay(300);
        return mockOrders.filter(o => o.assignedTechnicianId === techId);
    },
    create: async (order: Omit<RepairOrder, 'id' | 'createdAt' | 'status'>) => {
      await delay(500);
      const newOrder: RepairOrder = {
        ...order,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        status: 'NEW'
      };
      mockOrders.push(newOrder);
      return newOrder;
    },
    updateStatus: async (id: string, status: RepairOrder['status']) => {
      await delay(300);
      const order = mockOrders.find(o => o.id === id);
      if (order) {
        order.status = status;
      }
      return order;
    },
    assignTechnician: async (id: string, techId: string) => {
        await delay(300);
        const order = mockOrders.find(o => o.id === id);
        if (order) {
            order.assignedTechnicianId = techId;
            order.status = 'WAITING_FOR_TECHNICIAN'; // Or whatever logic
        }
        return order;
    },
    update: async (id: string, data: Partial<RepairOrder>) => {
        await delay(300);
        const index = mockOrders.findIndex(o => o.id === id);
        if (index !== -1) {
            mockOrders[index] = { ...mockOrders[index], ...data };
            return mockOrders[index];
        }
        return null;
    }
  },
  employees: {
    getAll: async () => {
      await delay(500);
      return mockEmployees;
    },
    getById: async (id: string) => {
      await delay(500);
      return mockEmployees.find(e => e.id === id);
    },
    create: async (employee: Omit<Employee, 'id'>) => {
        await delay(500);
        const newEmployee = { ...employee, id: Math.random().toString(36).substr(2, 9) };
        mockEmployees.push(newEmployee);
        return newEmployee;
    },
    update: async (id: string, data: Partial<Employee>) => {
        await delay(500);
        const index = mockEmployees.findIndex(e => e.id === id);
        if (index !== -1) {
            mockEmployees[index] = { ...mockEmployees[index], ...data };
            return mockEmployees[index];
        }
        return null;
    },
    delete: async (id: string) => {
        await delay(500);
        const index = mockEmployees.findIndex(e => e.id === id);
        if (index !== -1) {
            mockEmployees.splice(index, 1);
            return true;
        }
        return false;
    }
  },
  parts: {
    getAll: async () => {
      await delay(500);
      return [...mockSpareParts];
    },
    consume: async (partId: string, quantity: number) => {
        await delay(300);
        const part = mockSpareParts.find(p => p.id === partId);
        if (part) {
            if (part.quantity < quantity) throw new Error(`Not enough stock for part ${part.name}`);
            part.quantity -= quantity;
            return part;
        }
        throw new Error('Part not found');
    }
  },
  estimates: {
    getByOrderId: async (orderId: string) => {
      await delay(300);
      return mockEstimates.filter(e => e.orderId === orderId);
    },
    updateStatus: async (id: string, approved: boolean) => {
      await delay(300);
      const estimate = mockEstimates.find(e => e.id === id);
      if (estimate) {
        estimate.approved = approved;
      }
      return estimate;
    },
    create: async (estimate: Omit<CostEstimate, 'id' | 'createdAt' | 'approved'>) => {
        await delay(300);
        const newEstimate: CostEstimate = {
            ...estimate,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            approved: null
        };
        mockEstimates.push(newEstimate);
        return newEstimate;
    }
  },
  workLogs: {
    getByOrderId: async (orderId: string) => {
      await delay(300);
      return mockWorkLogs.filter(l => l.orderId === orderId);
    },
    startWork: async (orderId: string, technicianId: string) => {
      await delay(300);
      const newLog = {
        id: Math.random().toString(36).substr(2, 9),
        orderId,
        technicianId,
        startTime: new Date().toISOString()
      };
      mockWorkLogs.push(newLog);
      return newLog;
    },
    stopWork: async (logId: string) => {
      await delay(300);
      const log = mockWorkLogs.find(l => l.id === logId);
      if (log && !log.endTime) {
        log.endTime = new Date().toISOString();
        const start = new Date(log.startTime).getTime();
        const end = new Date(log.endTime).getTime();
        log.durationMinutes = Math.round((end - start) / 1000 / 60);
        
        // Update total time on order
        const order = mockOrders.find(o => o.id === log.orderId);
        if (order) {
            order.totalWorkTimeMinutes = (order.totalWorkTimeMinutes || 0) + log.durationMinutes;
        }
      }
      return log;
    }
  },

  services: {
      getAll: async () => {
          await delay(300);
          return [...mockServiceActions];
      },
      create: async (service: Omit<ServiceAction, 'id'>) => {
          await delay(300);
          const newService = { ...service, id: Math.random().toString(36).substr(2, 9) };
          mockServiceActions.push(newService);
          return newService;
      },
      update: async (id: string, data: Partial<ServiceAction>) => {
          await delay(300);
          const index = mockServiceActions.findIndex(s => s.id === id);
          if (index !== -1) {
              mockServiceActions[index] = { ...mockServiceActions[index], ...data };
              return mockServiceActions[index];
          }
          return null;
      }
  },
  invoices: {
      create: async (invoice: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
          await delay(500);
          const newInvoice = {
              ...invoice,
              id: Math.random().toString(36).substr(2, 9),
              invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`
          };
          mockInvoices.push(newInvoice);
          return newInvoice;
      },
      getByOrderId: async (orderId: string) => {
          await delay(300);
          return mockInvoices.find(i => i.orderId === orderId);
      }
  },
  partOrders: {
      getAll: async () => {
          await delay(300);
          return [...mockPartOrders];
      },
      create: async (order: Omit<PartOrder, 'id' | 'status'>) => {
          await delay(300);
          const newOrder = {
              ...order,
              id: Math.random().toString(36).substr(2, 9),
              status: 'ORDERED' as const
          };
          mockPartOrders.push(newOrder);
          return newOrder;
      },
      updateStatus: async (id: string, status: PartOrder['status']) => {
          await delay(300);
          const order = mockPartOrders.find(o => o.id === id);
          if (order) {
              order.status = status;
              // If delivered, update inventory
              if (status === 'DELIVERED') {
                  const part = mockSpareParts.find(p => p.id === order.sparePartId);
                  if (part) {
                      part.quantity += order.quantity;
                  }
              }
          }
          return order;
      }
  },
  warehouse: {
      acceptDelivery: async (items: { partId: string; quantity: number }[]) => {
          await delay(500);
          
          for (const item of items) {
              // 1. Update Stock
              const part = mockSpareParts.find(p => p.id === item.partId);
              if (part) {
                  part.quantity += item.quantity;
              }

              // 2. Find pending part orders for this part
              const pendingOrders = mockPartOrders.filter(po => po.sparePartId === item.partId && po.status === 'ORDERED');
              
              for (const po of pendingOrders) {
                  // Check if we have enough stock now to fulfill this order
                  if (part && part.quantity >= po.quantity) {
                      po.status = 'DELIVERED';
                      
                      // 3. Check linked RepairOrder
                      if (po.repairOrderId) {
                          // Check if ALL part orders for this repair order are now DELIVERED
                          const allRepairPartOrders = mockPartOrders.filter(o => o.repairOrderId === po.repairOrderId);
                          const allDelivered = allRepairPartOrders.every(o => o.status === 'DELIVERED' || o.status === 'CANCELLED');
                          
                          if (allDelivered) {
                              const repairOrder = mockOrders.find(o => o.id === po.repairOrderId);
                              if (repairOrder && repairOrder.status === 'WAITING_FOR_PARTS') {
                                  repairOrder.status = 'WAITING_FOR_TECHNICIAN';
                              }
                          }
                      }
                  }
              }
          }
          return true;
      },
      reportDiscrepancy: async (data: { partId: string; quantity: number; reason: string }) => {
          await delay(500);
          console.log('Discrepancy reported:', data);
          // In a real app, this would save to a database table
          return true;
      }
  }
};
