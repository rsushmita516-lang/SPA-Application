export type RecordStatus = 'Open' | 'In Progress' | 'Completed';

export interface PortalRecord {
  _id?: string;
  recordId: string;
  title: string;
  category: string;
  status: RecordStatus;
  lastUpdated: string;
  ownerId: string;
  ownerName: string;
  description: string;
}

export interface RecordsQueryOptions {
  delayMs?: number;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface RecordsResponse {
  records: PortalRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  serverDurationMs?: number;
}
