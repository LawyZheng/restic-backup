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

export interface Match {
    snapshot: string
    hits: number
    matches: File[]
}