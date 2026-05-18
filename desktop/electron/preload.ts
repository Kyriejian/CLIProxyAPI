import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  proxy: {
    start: () => Promise<{ success: boolean }>;
    stop: () => Promise<{ success: boolean }>;
    status: () => Promise<{ running: boolean; port: number }>;
    onMessage: (callback: (data: unknown) => void) => void;
    onStatus: (callback: (status: string) => void) => void;
  };
  app: {
    version: () => Promise<string>;
    platform: () => Promise<string>;
    onNavigate: (callback: (page: string) => void) => void;
  };
}

contextBridge.exposeInMainWorld('electronAPI', {
  proxy: {
    start: () => ipcRenderer.invoke('proxy:start'),
    stop: () => ipcRenderer.invoke('proxy:stop'),
    status: () => ipcRenderer.invoke('proxy:status'),
    onMessage: (callback: (data: unknown) => void) => {
      ipcRenderer.on('proxy-message', (_event, data) => callback(data));
    },
    onStatus: (callback: (status: string) => void) => {
      ipcRenderer.on('proxy-status', (_event, status) => callback(status));
    },
  },
  app: {
    version: () => ipcRenderer.invoke('app:version'),
    platform: () => ipcRenderer.invoke('app:platform'),
    onNavigate: (callback: (page: string) => void) => {
      ipcRenderer.on('navigate', (_event, page) => callback(page));
    },
  },
} satisfies ElectronAPI);
