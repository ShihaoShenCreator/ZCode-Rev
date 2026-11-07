import { create } from "zustand";
import type { ZCodeOffPeakTask } from "@s-agent/shared";
import type { IOffPeakTaskService } from "@s-agent/services";
import { logger } from "@/logger.js";

// 闲时任务已退役：store 只保留本地历史读取与删除，不再创建、编辑、调度，
// 也不再请求灰度、资格、额度或票据 API（Off-Peak 远端集成整体下线）。

interface OffPeakTaskState {
  tasks: ZCodeOffPeakTask[];
  loading: boolean;
  error: string | null;
  operationId: string | null;
  initialize(deps: {
    offPeakTaskService: IOffPeakTaskService;
  }): Promise<void>;
  refresh(service: IOffPeakTaskService): Promise<void>;
  deleteTask(offPeakTaskId: string, service: IOffPeakTaskService): Promise<void>;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

let initializeInFlight: Promise<void> | null = null;

export const useOffPeakTaskStore = create<OffPeakTaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  operationId: null,

  async initialize({ offPeakTaskService }) {
    if (initializeInFlight) return initializeInFlight;
    set({ loading: true, error: null });
    const run = offPeakTaskService
      .list()
      .catch((error) => {
        logger.warn("[off-peak] local history load failed", toErrorMessage(error));
        return [] as ZCodeOffPeakTask[];
      })
      .then((tasks) => {
        set({ tasks, error: null });
      });
    initializeInFlight = run;
    try {
      await run;
    } finally {
      if (initializeInFlight === run) {
        initializeInFlight = null;
        set({ loading: false });
      }
    }
  },

  async refresh(service) {
    try {
      const tasks = await service.list();
      set({ tasks, error: null });
    } catch (error) {
      set({ error: toErrorMessage(error) });
    }
  },

  async deleteTask(offPeakTaskId, service) {
    set({ operationId: `offpeak:delete:${offPeakTaskId}`, error: null });
    try {
      await service.deleteTask(offPeakTaskId);
      await get().refresh(service);
    } catch (error) {
      set({ error: toErrorMessage(error) });
    } finally {
      set({ operationId: null });
    }
  },
}));
