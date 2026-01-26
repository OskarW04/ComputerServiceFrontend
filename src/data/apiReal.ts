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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const idToString = (obj: any): any => {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map(idToString);
  }
  if (typeof obj === "object") {
    const newObj = { ...obj };
    for (const key in newObj) {
      if (key === "id" || key.endsWith("Id")) {
        if (typeof newObj[key] === "number") {
          newObj[key] = newObj[key].toString();
        }
      } else if (typeof newObj[key] === "object" && newObj[key] !== null) {
        // Recursively handle nested objects/arrays
        newObj[key] = idToString(newObj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

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
      const authData = response.data;

      const meResponse = await axiosInstance.get("/api/auth/getMe", {
        headers: { Authorization: `Bearer ${authData.token}` },
      });
      const me = idToString(meResponse.data);

      return { ...me, ...authData };
    },
    loginClient: async (phone: string, pin: string) => {
      const response = await axiosInstance.post("/api/auth/login", {
        email: phone,
        password: pin,
      });
      const authData = response.data;

      const clientResponse = await axiosInstance.get("/api/auth/getMeClient", {
        headers: { Authorization: `Bearer ${authData.token}` },
      });
      const clientDetails = idToString(clientResponse.data);

      return {
        ...clientDetails,
        ...authData,
      };
    },
    generatePIN: async (phone: string) => {
      const response = await axiosInstance.post("/api/auth/generatePIN", {
        phone: phone,
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
  client: {
    acceptEstimate: async (orderId: string) => {
      const numId = idToNumber(orderId);
      await axiosInstance.put(`/api/client/accept/${numId}`);
      return { id: orderId, approved: true };
    },
    rejectEstimate: async (orderId: string) => {
      const numId = idToNumber(orderId);
      await axiosInstance.put(`/api/client/reject/${numId}`);
      return { id: orderId, approved: false };
    },
    pay: async (orderId: string, amount: number, method: PaymentMethod) => {
      const response = await axiosInstance.post(
        `/api/client/pay/${idToNumber(orderId)}`,
        {
          orderId: idToNumber(orderId),
          amount,
          method,
        },
      );
      return idToString(response.data);
    },
    getOrder: async (orderId: string) => {
      const numId = idToNumber(orderId);
      const response = await axiosInstance.get(`/api/client/getOrder/${numId}`);
      return idToString(response.data);
    },
    getOrders: async () => {
      const response = await axiosInstance.get("/api/client/getClientOrders");
      return response.data.map(idToString);
    },
    generatePdf: async (orderNumber: string) => {
      const response = await axiosInstance.get(
        `/api/client/order/${orderNumber}/generatePdf`,
        { responseType: "blob" },
      );
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
  tech: {
    getAssignedOrders: async () => {
      const response = await axiosInstance.get("/api/tech/getAssignedOrders");
      return response.data.map(idToString);
    },
    startDiagnosing: async (orderId: string) => {
      const numId = idToNumber(orderId);
      await axiosInstance.patch(`/api/tech/${numId}/startDiagnosing`);
      return { id: orderId, status: "DIAGNOSING" };
    },
    finishOrder: async (orderId: string) => {
      const numId = idToNumber(orderId);
      await axiosInstance.put(`/api/tech/finish/${numId}`);
      return { id: orderId, status: "READY_FOR_PICKUP" };
    },
    generateCostEstimate: async (
      orderId: string,
      data: {
        message: string;
        partRequestList: { sparePartId: number; quantity: number }[];
        serviceActionIds: number[];
      },
    ) => {
      const numId = idToNumber(orderId);
      const response = await axiosInstance.post(
        `/api/tech/${numId}/generateCostEst`,
        data,
      );
      return idToString(response.data);
    },
    getAllServices: async () => {
      const response = await axiosInstance.get("/api/tech/services/getAll");
      return response.data.map(idToString);
    },
    getOrder: async (id: string) => {
      const all = await api.tech.getAssignedOrders();
      return all.find((o: RepairOrder) => o.id === id);
    },
    confirmPartUsage: async (partOrderId: string) => {
      const numId = idToNumber(partOrderId);
      await axiosInstance.post(`/api/warehouse/order/${numId}/receive`);
      return { id: partOrderId, received: true };
    },
  },
  orders: {
    getAll: async () => {
      const response = await axiosInstance.get("/api/order/getAll");
      return response.data.map(idToString);
    },
    getAllNew: async () => {
      const response = await axiosInstance.get("/api/order/getAllNew");
      return response.data.map(idToString);
    },
    getById: async (id: string) => {
      const all = await api.orders.getAll();
      return all.find((o: RepairOrder) => o.id === id);
    },
    getByClientId: async (clientId: string) => {
      const all = await api.orders.getAll();
      return all.filter((o: RepairOrder) => o.clientId === clientId);
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getByTechnicianId: async (_techId: string) => {
      const all = await api.orders.getAll();
      return all;
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
      const response = await axiosInstance.post("/api/warehouse/withdraw", {
        sparePartId: idToNumber(partId),
        quantity,
      });
      return response.data;
    },
    create: async (part: Omit<SparePart, "id">) => {
      const response = await axiosInstance.post("/api/warehouse/addPart", part);
      return idToString(response.data);
    },
  },
  estimates: {
    getByOrderId: async (orderId: string) => {
      const order = await api.orders.getById(orderId);
      if (order && order.costEstimateResponse) {
        return [order.costEstimateResponse];
      }
      return [];
    },
    updateStatus: async (orderId: string, approved: boolean) => {
      const numId = idToNumber(orderId);
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
          message: "Cost Estimate",
          partRequestList: partRequests,
          serviceActionIds: serviceIds,
        },
      );
      return idToString(response.data);
    },
  },
  workLogs: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getByOrderId: async (_orderId: string) => [],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    startWork: async (_orderId: string, _technicianId: string) => ({}),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    stopWork: async (_logId: string) => ({}),
  },

  services: {
    getAll: async () => {
      const response = await axiosInstance.get("/api/tech/services/getAll");
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
    create: async (invoice: {
      orderId: string;
      paymentMethod: string;
      docType: "INVOICE" | "RECEIPT";
      nip?: string;
    }) => {
      const response = await axiosInstance.post(
        "/api/office/order/createSaleDocument",
        {
          orderId: idToNumber(invoice.orderId),
          docType: invoice.docType,
          nip: invoice.nip || "",
        },
      );
      return idToString(response.data);
    },
    generatePdf: async (orderNumber: string) => {
      const response = await axiosInstance.get(
        `/api/office/order/${orderNumber}/generatePdf`,
        { responseType: "blob" },
      );
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
          orderId: idToNumber(orderId),
          amount,
          method,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          client: true as any,
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
      return true;
    },
    getAllMissingParts: async () => {
      const response = await axiosInstance.get(
        "/api/warehouse/parts/getAllWaiting",
      );
      return response.data.map(idToString);
    },
  },
  manager: {
    deleteOrder: async (orderId: string) => {
      await axiosInstance.delete(`/api/manager/order/${idToNumber(orderId)}`);
      return true;
    },
  },
};
