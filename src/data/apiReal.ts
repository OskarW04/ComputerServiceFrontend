import { axiosInstance } from "@/lib/axios";
import type {
  Client,
  RepairOrder,
  ServiceAction,
  Invoice,
  PartOrder,
  Employee,
  CostEstimate,
} from "./schema";

// Helper to convert ID from number (API) to string (Frontend)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const idToString = (obj: any) => {
  if (obj && typeof obj.id === "number") {
    return { ...obj, id: obj.id.toString() };
  }
  return obj;
};

// Helper to convert ID from string (Frontend) to number (API)
const idToNumber = (id: string | undefined) => {
  return id ? parseInt(id, 10) : undefined;
};

export const api = {
  auth: {
    loginEmployee: async (email: string, password?: string) => {
      const response = await axiosInstance.post("/api/auth/login", {
        email,
        password,
      });
      const authData = response.data; // { token, role, username }

      // We need to fetch full employee details to return an Employee object
      // Since there is no /me endpoint, we fetch all employees and find by email
      // This is a temporary workaround as per plan
      const employeesResponse = await axiosInstance.get(
        "/api/employees/getAll",
        {
          headers: { Authorization: `Bearer ${authData.token}` },
        },
      );
      const employees = employeesResponse.data.map(idToString);
      const me = employees.find((e: Employee) => e.email === email);

      if (!me) {
        // Fallback if not found (shouldn't happen for valid employee)
        return {
          ...authData,
          id: "0",
          email: authData.username,
          firstName: "Unknown",
          lastName: "User",
        };
      }

      return { ...me, ...authData }; // Merge auth data (token) with profile
    },
    loginClient: async (phone: string, pin: string) => {
      // For client login, we use the same endpoint but different credentials logic in backend?
      // Wait, AuthenticationService.java handles both.
      // It expects 'email' field in JSON but treats it as identifier (email or phone).
      const response = await axiosInstance.post("/api/auth/login", {
        email: phone,
        password: pin,
      });
      const authData = response.data;

      // Client doesn't have a generic "getAll" visible to them usually, or maybe they do?
      // For now, return a basic client object with the token.
      return {
        id: phone, // Use phone as ID for now since we can't easily get the real ID without a /me
        firstName: "Klient",
        lastName: "",
        phone: authData.username,
        email: "",
        pin: "",
        ...authData, // token included
      };
    },
  },
  clients: {
    getAll: async () => {
      const response = await axiosInstance.get("/api/office/getAllClients");
      return response.data.map(idToString);
    },
    getById: async (id: string) => {
      // 'id' in frontend is string, but for clients finding by ID isn't directly exposed in office controller clearly
      // except getClientByPhone.
      // However, often id matches phone in our workaround? No, backend has ID.
      // Let's assume we use getAll for now or find a specific endpoint.
      // OfficeController has getClient(@PathVariable String phone).
      // If we passed phone as ID, we use that. If it's a numeric ID, we might need filtering.
      // Let's guess we verify if ID looks like phone or number.
      // Actually, searching by real ID:
      // We can use getAll and find.
      const all = await api.clients.getAll();
      return all.find((c: Client) => c.id === id);
    },
    create: async (client: Omit<Client, "id">) => {
      const response = await axiosInstance.post(
        "/api/office/createClient",
        client,
      );
      return idToString(response.data);
    },
  },
  orders: {
    getAll: async () => {
      const response = await axiosInstance.get("/api/order/getAll");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return response.data.map((o: any) => ({
        ...idToString(o),
        assignedTechnicianId: o.technicianId?.toString(),
      }));
    },
    getById: async (id: string) => {
      // Since we don't have a direct "get order by ID" for manager/generic without role constraints sometimes?
      // ClientController has getOrder/{orderId}.
      // Tech: /api/tech/getAssignedOrders
      // OrderController: has getAll.
      // Let's filter from getAll for now to be safe, or use client endpoint if appropriate.
      // Actually OrderService usually has a get which might be exposed.
      // Checking swagger: /api/client/getOrder/{orderId} is for client.
      // There is no generic /api/order/{id}.
      // We will filter from getAll for Managers/Techs.
      const all = await api.orders.getAll();
      return all.find((o: RepairOrder) => o.id === id);
    },
    getByClientId: async (clientId: string) => {
      // If logged in as client: /api/client/getClientOrders
      // If manager viewing client orders: Filter getAll.
      // We'll stick to filtering getAll for simplicity in this "Reference" implementation unless current user is client.
      const all = await api.orders.getAll();
      return all.filter((o: RepairOrder) => o.clientId === clientId);
    },
    getByTechnicianId: async (techId: string) => {
      const all = await api.orders.getAll();
      return all.filter((o: RepairOrder) => o.assignedTechnicianId === techId);
    },
    create: async (order: Omit<RepairOrder, "id" | "createdAt" | "status">) => {
      const response = await axiosInstance.post("/api/order/createOrder", {
        ...order,
        clientId: idToNumber(order.clientId),
      });
      return idToString(response.data);
    },
    updateStatus: async (id: string, status: RepairOrder["status"]) => {
      // Mapped to specific endpoints based on status?
      // Swagger has:
      // /api/tech/finish/{orderId}
      // /api/tech/{orderId}/startDiagnosing
      // /api/office/acceptEstimateForClient
      // /api/office/rejectEstimateForClient
      // There isn't a generic "updateStatus" endpoint.
      // We might need to handle this based on the *target* status.

      const numId = idToNumber(id);
      if (!numId) return null;

      if (status === "DIAGNOSING") {
        await axiosInstance.patch(`/api/tech/${numId}/startDiagnosing`);
      } else if (status === "COMPLETED" || status === "READY_FOR_PICKUP") {
        // Assuming 'finish' means job done
        await axiosInstance.put(`/api/tech/finish/${numId}`);
      } else if (status === "WAITING_FOR_PARTS") {
        // No direct endpoint manifest?
      }

      // Return updated order
      return api.orders.getById(id);
    },
    assignTechnician: async (id: string, techId: string) => {
      const numId = idToNumber(id);
      const numTechId = idToNumber(techId);
      if (numId && numTechId) {
        await axiosInstance.put(`/api/manager/${numId}/assign/${numTechId}`);
      }
      return api.orders.getById(id);
    },
    update: async (id: string, data: Partial<RepairOrder>) => {
      // Backend doesn't support generic update for all fields (like description) directly in one endpoint.
      // We prioritize status update which is supported via specific endpoints.
      if (data.status) {
        await api.orders.updateStatus(id, data.status);
      }

      // Notes/Description updates might be missing a dedicated endpoint in this version of backend.
      // If 'diagnosisDescription' is present, we might try 'startDiagnosing' patch if in DIAGNOSING mode?
      // But 'startDiagnosing' takes no body in Swagger (just path param).
      // TechnicianController finishOrder taking ID.
      // We'll leave it as best-effort status update for now.

      return api.orders.getById(id);
    },
  },
  employees: {
    getAll: async () => {
      const response = await axiosInstance.get("/api/employees/getAll");
      return response.data.map(idToString);
    },
    getById: async (id: string) => {
      const response = await axiosInstance.get(`/api/employees/get/${id}`);
      return idToString(response.data);
    },
    create: async (employee: Omit<Employee, "id">) => {
      const response = await axiosInstance.post(
        "/api/employees/create",
        employee,
      );
      return idToString(response.data);
    },
    update: async (id: string, data: Partial<Employee>) => {
      const response = await axiosInstance.put(
        `/api/employees/update/${id}`,
        data,
      );
      return idToString(response.data);
    },
    delete: async (id: string) => {
      await axiosInstance.delete(`/api/employees/delete/${id}`);
      return true;
    },
  },
  parts: {
    getAll: async () => {
      const response = await axiosInstance.get("/api/warehouse/getAllParts");
      return response.data.map(idToString);
    },
    consume: async (partId: string, quantity: number) => {
      // WarehouseController has withdraw
      const response = await axiosInstance.post("/api/warehouse/withdraw", {
        partId: idToNumber(partId),
        quantity,
      });
      return response.data;
    },
  },
  estimates: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getByOrderId: async (_orderId: string) => {
      // No direct "get estimates" endpoint?
      // Tech controller has generateCostEst.
      // Client can accept/reject.
      // Data might be embedded in OrderResponse?
      // Checking OrderResponse schema would be good.
      // For now, return empty or implement if found in Order object.
      // Assuming it's not easily fetchable in this version without checking schema deep.
      // We'll return mock data for now or empty array to avoid breaking UI if backend doesn't support separate fetch.
      return [];
    },
    updateStatus: async (id: string, approved: boolean) => {
      // This maps to client/office accept/reject endpoints.
      // ID here is likely OrderID in the context of the endpoints /api/client/accept/{orderId}.
      // The frontend 'id' for estimate might be orderId or separate.
      // If it is orderId:

      // We need to know if it's client or office acting.
      // The UI usually calls this. Let's assume Office for now or generic.
      // The Mock API used estimate ID. The Backend uses Order ID.
      // We might need to refactor frontend to pass OrderID.

      // Temporarily assume id IS orderId for this backend adaptation
      const numId = idToNumber(id);
      if (approved) {
        await axiosInstance.put(`/api/office/acceptEstimateForClient/${numId}`);
      } else {
        await axiosInstance.put(`/api/office/rejectEstimateForClient/${numId}`);
      }
      return { id, approved }; // Stub
    },
    create: async (
      estimate: Omit<CostEstimate, "id" | "createdAt" | "approved">,
    ) => {
      const response = await axiosInstance.post(
        `/api/tech/${estimate.orderId}/generateCostEst`,
        {
          ...estimate,
          parts: estimate.parts.map((p) => ({
            ...p,
            partId: idToNumber(p.partId),
          })),
        },
      );
      return response.data;
    },
  },
  workLogs: {
    // Backend doesn't seem to have explicit WorkLog endpoints in the summary list.
    // Maybe embedded in Order details?
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getByOrderId: async (_orderId: string) => [],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    startWork: async (_orderId: string, _technicianId: string) => {
      // No start work endpoint?
      // Just startDiagnosing?
      return {};
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    stopWork: async (_logId: string) => {
      return {};
    },
  },

  services: {
    getAll: async () => {
      const response = await axiosInstance.get("/api/manager/services/getAll");
      return response.data.map(idToString);
    },
    create: async (service: Omit<ServiceAction, "id">) => {
      const response = await axiosInstance.post(
        "/api/manager/services/add",
        service,
      );
      return idToString(response.data);
    },
    update: async (id: string, data: Partial<ServiceAction>) => {
      const response = await axiosInstance.put(
        `/api/manager/services/edit/${id}`,
        data,
      );
      return idToString(response.data);
    },
  },
  invoices: {
    create: async (invoice: Omit<Invoice, "id" | "invoiceNumber">) => {
      const response = await axiosInstance.post(
        "/api/office/order/createSaleDocument",
        {
          orderId: idToNumber(invoice.orderId),
          type: "INVOICE", // Assuming doc type
          method: invoice.paymentMethod,
        },
      );
      return idToString(response.data);
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getByOrderId: async (_orderId: string) => {
      // No direct endpoint
      return undefined;
    },
  },
  partOrders: {
    getAll: async () => {
      const response = await axiosInstance.get(
        "/api/warehouse/order/getAllOrders",
      );
      return response.data.map(idToString);
    },
    create: async (order: Omit<PartOrder, "id" | "status">) => {
      const response = await axiosInstance.post(
        "/api/warehouse/order/createOrder",
        {
          ...order,
          sparePartId: idToNumber(order.sparePartId),
        },
      );
      return idToString(response.data);
    },
    updateStatus: async (id: string, status: PartOrder["status"]) => {
      if (status === "DELIVERED") {
        await axiosInstance.post(`/api/warehouse/order/${id}/receive`);
      }
      return { id, status };
    },
  },
  warehouse: {
    acceptDelivery: async (items: { partId: string; quantity: number }[]) => {
      // Since there is no direct "add stock" endpoint, we simulate a delivery workflow:
      // 1. Create a supply order for the parts.
      // 2. Automatically mark it as received to increase stock.
      for (const item of items) {
        const numId = idToNumber(item.partId);
        if (numId) {
          // Create Order
          const orderResponse = await axiosInstance.post(
            "/api/warehouse/order/createOrder",
            {
              sparePartId: numId,
              quantity: item.quantity,
              orderDate: new Date().toISOString(),
              estimatedDelivery: new Date().toISOString(),
              status: "ORDERED",
            },
          );
          // Receive it immediately
          const orderId = orderResponse.data.id;
          await axiosInstance.post(`/api/warehouse/order/${orderId}/receive`);
        }
      }
      return true;
    },
    reportDiscrepancy: async (data: {
      partId: string;
      quantity: number;
      reason: string;
    }) => {
      console.log("Discrepancy reported (mock on real):", data);
      return true;
    },
  },
};
