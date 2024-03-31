import { Restic } from 'src/restic/restic'

type VaultSnapshotProps = {
    restic: Restic | undefined
}

export const VaultSnapshot = (props: VaultSnapshotProps) => {
    return <div>this a vault snapshot</div>
}