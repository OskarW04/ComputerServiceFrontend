import { axiosInstance } from "@/lib/axios";
import type {
  Client,
  RepairOrder,
  ServiceAction,
  PartOrder,
  Employee,
  CostEstimate,
  SparePart,
  PaymentMethod,
} from "./schema";

// Helper to convert ID from number (API) to string (Frontend)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const idToString = (obj: any): any => {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map(idToString);
  }
  if (typeof obj === "object") {
    const newObj = { ...obj };
    if (typeof newObj.id === "number") {
      newObj.id = newObj.id.toString();
    }
    // Recursively handle nested objects/arrays if needed?
    // For now shallow + id check is mostly enough, but let's check some known nested structs
    if (newObj.sparePart) newObj.sparePart = idToString(newObj.sparePart);
    if (newObj.costEstimateResponse) {
      newObj.costEstimateResponse = idToString(newObj.costEstimateResponse);
      // Cost estimate parts?
      if (newObj.costEstimateResponse.parts) {
        newObj.costEstimateResponse.parts = idToString(
          newObj.costEstimateResponse.parts,
        );
      }
    }
    return newObj;
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
      // Explicitly remove Authorization header for login to avoid sending stale tokens
      const response = await axiosInstance.post(
        "/api/auth/login",
        {
          email,
          password,
        },
        {
          headers: { Authorization: "" },
        },
      );
      const authData = response.data; // { token, role, username }

      // Fetch employee details using /api/auth/getMe
      const meResponse = await axiosInstance.get("/api/auth/getMe", {
        headers: { Authorization: `Bearer ${authData.token}` },
      });
      const me = idToString(meResponse.data);

      return { ...me, ...authData };
    },
    loginClient: async (phone: string, pin: string) => {
      // Backend uses same login endpoint
      const response = await axiosInstance.post(
        "/api/auth/login",
        {
          email: phone, // Maps to 'username' in backend logic often
          password: pin,
        },
        {
          headers: { Authorization: "" },
        },
      );
      const authData = response.data;

      // Fetch client details.
      const clientResponse = await axiosInstance.get(
        `/api/office/get/${phone}`,
        {
          headers: { Authorization: `Bearer ${authData.token}` },
        },
      );
      const clientDetails = idToString(clientResponse.data);

      return {
        ...clientDetails,
        ...authData,
      };
    },
    generatePIN: async (phone: string) => {
      const response = await axiosInstance.post("/api/auth/generatePIN", {
        phoneNumber: phone,
      });
      return response.data;
    },
  },
  clients: {
    getAll: async () => {
      const response = await axiosInstance.get("/api/office/getAllClients");
      return response.data.map(idToString);
    },
    getById: async (id: string) => {
      // ID is phone or numeric?
      // Usually numeric ID.
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
      return response.data.map(idToString);
    },
    getById: async (id: string) => {
      // Try fetching as client first? No, generic fetch
      // Uses getAll filtering for now as direct ID endpoint by generic ID is vague
      const all = await api.orders.getAll();
      return all.find((o: RepairOrder) => o.id === id);
    },
    getByClientId: async (clientId: string) => {
      // use getAll filtering
      const all = await api.orders.getAll();
      return all.filter((o: RepairOrder) => o.clientId === clientId);
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getByTechnicianId: async (_techId: string) => {
      // use getAll filtering
      // Note: RepairOrder now has technicianName, not always ID.
      // But backend sends ID in filtered views potentially?
      // Let's rely on technician-controller endpoints for tech-specific views if used.
      // For general "get by tech", filtering is safe if we can map back.
      // Actually, RepairOrder no longer has assignedTechnicianId populated directly in all cases in schema I wrote?
      // I put `assignedTechnicianId?: string` as helper.
      // `OrderResponse` from backend has `technicianName`.
      // If we strictly need ID, we might have issues.
      // But let's check: /api/tech/getAssignedOrders exists.

      // If the current user is the technician requesting their orders:
      // return api.orders.getAssignedToMe();

      // If manager viewing:
      const all = await api.orders.getAll();
      // We lack technicianId in Response. We only have Name.
      // This is a limitation of current API.
      // We can't filter reliably by ID unless we match Name or backend adds ID.
      return all; // Fallback or empty?
    },
    getAssignedToMe: async () => {
      const response = await axiosInstance.get("/api/tech/getAssignedOrders");
      return response.data.map(idToString);
    },
    create: async (
      order: Omit<
        RepairOrder,
        "id" | "createdAt" | "status" | "clientName" | "clientPhone"
      >,
    ) => {
      const response = await axiosInstance.post("/api/order/createOrder", {
        clientId: idToNumber(order.clientId),
        deviceDescription: order.deviceDescription,
        problemDescription: order.problemDescription,
      });
      return idToString(response.data);
    },
    updateStatus: async (id: string, status: RepairOrder["status"]) => {
      const numId = idToNumber(id);
      if (!numId) return null;

      if (status === "DIAGNOSING") {
        await axiosInstance.patch(`/api/tech/${numId}/startDiagnosing`);
      } else if (status === "COMPLETED" || status === "READY_FOR_PICKUP") {
        // "finish"
        await axiosInstance.put(`/api/tech/finish/${numId}`);
      }

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
      // Best effort status update
      if (data.status) {
        await api.orders.updateStatus(id, data.status);
      }
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
    create: async (employee: Omit<Employee, "id"> & { password?: string }) => {
      const response = await axiosInstance.post(
        "/api/employees/create",
        employee,
      );
      return idToString(response.data);
    },
    update: async (
      id: string,
      data: Partial<Employee> & { password?: string },
    ) => {
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
      // Warehouse withdraw
      const response = await axiosInstance.post("/api/warehouse/withdraw", {
        sparePartId: idToNumber(partId), // Note: API says 'sparePartId' in PartRequest
        quantity,
      });
      return response.data;
    },
    create: async (part: Omit<SparePart, "id" | "stockQuantity">) => {
      // /api/warehouse/addPart
      const response = await axiosInstance.post("/api/warehouse/addPart", {
        ...part,
        stockQuantity: 0, // Initial
      });
      return idToString(response.data);
    },
  },
  estimates: {
    getByOrderId: async (orderId: string) => {
      // Extract from order
      const order = await api.orders.getById(orderId);
      if (order && order.costEstimateResponse) {
        return [order.costEstimateResponse];
      }
      return [];
    },
    updateStatus: async (orderId: string, approved: boolean) => {
      const numId = idToNumber(orderId);
      // NOTE: Using OrderID as per API spec for accept/reject
      if (approved) {
        await axiosInstance.put(`/api/office/acceptEstimateForClient/${numId}`);
      } else {
        await axiosInstance.put(`/api/office/rejectEstimateForClient/${numId}`);
      }
      return { id: orderId, approved };
    },
    create: async (
      estimate: Omit<CostEstimate, "id" | "createdAt" | "approved"> & {
        orderId: string;
      },
    ) => {
      // /api/tech/{orderId}/generateCostEst
      // Body: { message, partRequestList, serviceActionIds }

      const partRequests = estimate.parts.map((p) => ({
        sparePartId: idToNumber(p.id),
        quantity: p.quantity,
      }));

      const serviceIds = estimate.actions
        .map((a) => idToNumber(a.id))
        .filter(Boolean);

      const response = await axiosInstance.post(
        `/api/tech/${estimate.orderId}/generateCostEst`,
        {
          message: "Cost Estimate", // Hardcoded or passed?
          partRequestList: partRequests,
          serviceActionIds: serviceIds,
        },
      );
      return idToString(response.data);
    },
  },
  workLogs: {
    // No API support yet
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getByOrderId: async (_orderId: string) => [],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    startWork: async (_orderId: string, _technicianId: string) => ({}),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    stopWork: async (_logId: string) => ({}),
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
    delete: async (id: string) => {
      await axiosInstance.delete(`/api/manager/services/delete/${id}`);
      return true;
    },
  },
  invoices: {
    create: async (invoice: { orderId: string; paymentMethod: string }) => {
      const response = await axiosInstance.post(
        "/api/office/order/createSaleDocument",
        {
          orderId: idToNumber(invoice.orderId),
          docType: "INVOICE",
          nip: "", // Optional?
        },
      );
      return idToString(response.data);
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getByOrderId: async (_orderId: string) => {
      // Backend doesn't have a direct "get invoice by order id" endpoint in OfficeController,
      // but maybe it's missing? Or we use `createSaleDocument` to check?
      // Actually `financeService.getDocumentPdf` takes orderNumber.
      // Let's assume for now we don't fetch invoice details often or use a different endpoint if exists.
      // For now returning null to satisfy interface.
      return null;
    },
    generatePdf: async (orderNumber: string) => {
      const response = await axiosInstance.get(
        `/api/office/order/${orderNumber}/generatePdf`,
        { responseType: "blob" },
      );
      // Create a blob URL and open it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `dokument_zlecenia_${orderNumber.replace("/", "-")}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
  },
  payments: {
    create: async (payment: {
      orderId: string;
      amount: number;
      method: PaymentMethod;
    }) => {
      const response = await axiosInstance.post("/api/office/payment", {
        orderId: idToNumber(payment.orderId),
        amount: payment.amount,
        method: payment.method,
      });
      return idToString(response.data);
    },
    payClient: async (
      orderId: string,
      amount: number,
      method: PaymentMethod,
    ) => {
      const response = await axiosInstance.post(
        `/api/client/pay/${idToNumber(orderId)}`,
        {
          orderId: idToNumber(orderId), // Redundant in body if path has it? Swagger says body has PaymentRequest
          amount,
          method,
        },
      );
      return idToString(response.data);
    },
  },
  partOrders: {
    getAll: async () => {
      const response = await axiosInstance.get(
        "/api/warehouse/order/getAllOrders",
      );
      return response.data.map(idToString);
    },
    create: async (
      order: Omit<PartOrder, "id" | "status" | "estimatedDelivery">,
    ) => {
      const response = await axiosInstance.post(
        "/api/warehouse/order/createOrder",
        {
          quantity: order.quantity,
          status: "ORDERED",
          sparePartId: idToNumber(order.sparePart.id),
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
      for (const item of items) {
        const numId = idToNumber(item.partId);
        if (numId) {
          const orderResponse = await axiosInstance.post(
            "/api/warehouse/order/createOrder",
            {
              sparePartId: numId,
              quantity: item.quantity,
              status: "ORDERED",
            },
          );
          const orderId = orderResponse.data.id;
          await axiosInstance.post(`/api/warehouse/order/${orderId}/receive`);
        }
      }
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reportDiscrepancy: async (_data: unknown) => {
      // console.log("Discrepancy", data);
      return true;
    },
  },
};
