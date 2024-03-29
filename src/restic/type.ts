export interface File {
    name: string
    type: string
    path: string
    uid: string
    gid: string
    size: string
    mode: string
    mtime: string
    atime: string
    ctime: string
}

export interface Snapshot {
    time: string;
    parent: string;
    tree: string;
    paths: string[];
    hostname: string;
    username: string;
    uid: number;
    gid: number;
    program_version: string;
    id: string;
    short_id: string;
  }

export interface Match {
    snapshot: string
    hits: number
    matches: File[]
}