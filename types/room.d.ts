export interface RoomInfo {
    roomId: string;
    status: RoomStatus;
    createdAt: number;
    lastUpdate?: number;
    provider: ProviderType;
    error?: string;
  }
  
  export interface RoomOptions {
    roomId?: string;
    maxUsers?: number;
    timeout?: number;
    [key: string]: any;
  }
  
  export type RoomStatus = 'creating' | 'running' | 'error' | 'terminated';
  export type ProviderType = 'cluster' | 'docker' | 'kubernetes';
  
  // Provider-specific room information
  export interface ClusterRoomInfo extends RoomInfo {
    workerId: number;
    pid: number;
  }
  
  export interface DockerRoomInfo extends RoomInfo {
    containerId: string;
    containerIp: string;
    containerStatus?: {
      Running: boolean;
      StartedAt: string;
      FinishedAt: string;
    };
  }
  
  export interface KubernetesRoomInfo extends RoomInfo {
    deploymentName: string;
    namespace: string;
    deploymentStatus?: {
      availableReplicas: number;
      readyReplicas: number;
      replicas: number;
    };
  }
  
  // Provider configuration interfaces
  export interface BaseProviderConfig {
    redisUrl?: string;
  }
  
  export interface ClusterProviderConfig extends BaseProviderConfig {
    maxWorkersPerRoom?: number;
  }
  
  export interface DockerProviderConfig extends BaseProviderConfig {
    dockerConfig?: any;
    networkName?: string;
    containerImage?: string;
  }
  
  export interface KubernetesProviderConfig extends BaseProviderConfig {
    namespace?: string;
    kubeConfig?: any;
  }
  
  export type ProviderConfig = 
    | ClusterProviderConfig 
    | DockerProviderConfig 
    | KubernetesProviderConfig;