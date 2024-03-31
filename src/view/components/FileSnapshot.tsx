import * as path from 'path'
import { CSSProperties, forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Restic } from 'src/restic/restic';
import { Flex, Tree } from 'antd'
import { TreeDataNode, Empty } from 'antd'
import { LogoutOutlined } from '@ant-design/icons';
import { DateTime } from 'luxon';
import { useApp } from 'src/view/hook/app';
import { Notice, TFile } from 'obsidian';

class context {
    isCancelled: boolean 
    cancel(){
        this.isCancelled = true
    }
}

const treeStyle: CSSProperties = {
    color: 'var(--nav-item-color)',
    background: 'var(--background-secondary)',
}

const emptyDescriptionStyle: CSSProperties = {
    color: 'var(--nav-item-color)',
}

const emptyImageStyle: CSSProperties = {
    height: 27,
}

const itemIconStyle: CSSProperties = {
    fontSize: '14px',
    paddingLeft: 20,
    color: 'var(--nav-item-color)',
}

const itemStyle: CSSProperties = {
    cursor: 'var(--cursor)',
    display: Flex,
    color: 'var(--nav-item-color)',
    backgroundColor: 'var(--nav-item-background)',
    fontWeight: 'var(--nav-item-weight)'
}

type FileSnapshotItemProps = {
    restic: Restic | undefined
    backupTime:  DateTime<true> | DateTime<false>
    snapshotId: string
    path: string
    fullVaultPath: string
}

const FileSnapshotItem = (props:FileSnapshotItemProps) => {
    const onMouseEnter = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const _cur = event.currentTarget;
        _cur.style.backgroundColor = 'var(--nav-item-background-hover)'
        _cur.style.fontWeight = 'var(--nav-item-weight-hover)'
    }
    
    const onMouseLeave = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const _cur = event.currentTarget;
        _cur.style.backgroundColor = 'var(--nav-item-background)'
        _cur.style.fontWeight = 'var(--nav-item-weight)'
    }

    const onIconEnter = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const _cur = event.currentTarget;
        _cur.style.color = 'var(--icon-color-hover)'
    }

    const onIconLeave = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const _cur = event.currentTarget;
        _cur.style.color = 'var(--nav-item-color)'
    }

    const restoreFile = () => {
        console.log('restore file -> id=' + props.snapshotId +'; vault=' + props.fullVaultPath + '; path=' + props.path)
        if (!props.restic) {
            return
        }
        const src = path.join(props.fullVaultPath, props.path)
        const dir = path.dirname(props.path)
        const ext = path.extname(props.path)
        const filename = path.basename(props.path, ext) + '.restic.' + props.backupTime.toFormat('yyyyMMddHHmmss')
        const dst = path.join(props.restic.getCurrentVault(), dir, filename + ext)

        props.restic.restoreFile(props.snapshotId, src, dst)
            .then(() => {
                new Notice('restored successfully.')
            })
            .catch((err) => {
                new Notice('failed to restore.')
            }
        )
    }

    return <div 
            style={itemStyle} 
            onMouseEnter={onMouseEnter} 
            onMouseLeave={onMouseLeave}
           >
            <div style={{width: 200, display: 'inline-block', textAlign: 'left'}} >
               {props.backupTime.toFormat('yyyy-MM-dd HH:mm:ss')}
            </div>
            <LogoutOutlined 
                style={itemIconStyle} 
                aria-label='Restore'
                onMouseEnter={onIconEnter}
                onMouseLeave={onIconLeave}
                onClick={restoreFile}
            />
           </div>
}

type FileSnapshotProps = {
    restic: Restic | undefined
}

export interface FileSnapshotMethods {
    refreshSnapshots: (pattern: string | undefined) => Promise<void>
}

export const FileSnapshot = forwardRef<FileSnapshotMethods, FileSnapshotProps>((props, ref) => {
    const [treeData, setTreeData] = useState<TreeDataNode[]>([])
    const [windowHeight, setWindowHeight] = useState(window.innerHeight)
    const _app = useApp()
    let _ctx : context = new context()

    const getFileSnapshots = async (ctx: context, restic: Restic | undefined, pattern: string) => {
        // empty data
        setTreeData([])

        let matches = await restic?.findFileInSnapshots(pattern)
        if (!matches) {
            return
        }
        
        // filter the path with ending string
        const reg = new RegExp(pattern + '$')
        matches = matches.filter( (match) => {
            for (let i=0; i<match.matches.length; i++) {
                const file = match.matches[i]
                if (reg.test(file.path)) {
                    return true
                }
            }
            return false
        })

        const nodes : TreeDataNode[]  = []
        const pace = 3
        const chunks = []
        console.log("find " + matches.length + " snapshots by [" + pattern + "]")
        for (let i=0; i<matches.length; i+=pace) {
            chunks.push(matches.slice(i, i+pace))
        }

        if (chunks.length === 0) {
            setTreeData([])
            return
        }

        for (const chunk of chunks) {
            const result = await Promise.all(chunk.map(async(match): Promise<TreeDataNode|null> =>{
                const _match = match
                const snap = await restic?.getSnapshotById(_match.snapshot)
                if (!snap) {
                    return null
                }
                const backupTime = DateTime.fromISO(snap.time)
                return {
                    title: <FileSnapshotItem 
                                restic={props.restic}
                                snapshotId={_match.snapshot}
                                backupTime={backupTime}
                                path={pattern}
                                fullVaultPath={snap.paths[0]}
                            /> ,
                    key: _match.snapshot,
                }
            }))

            if (ctx.isCancelled) {
                console.log("find ["+ pattern +"] snapshots cancelled.")
                return
            }

            const noNullResult: TreeDataNode[] = result.filter((node): node is TreeDataNode=> {
                return node !== null
            })

            nodes.push(...noNullResult)
            setTreeData([...nodes])
        }
    }

    const refreshSnapshots = async (pattern: string | undefined ) => {
        _ctx.cancel()
        _ctx = new context()
        if (!pattern) {
            setTreeData([])
            return
        }
        await getFileSnapshots(_ctx, props.restic, pattern)
    }

    const handleBackupSuccess = () => {
        const _cur = _app?.workspace.getActiveFile()?.path
        refreshSnapshots(_cur)
    }

    const handleResize = () => {
        setWindowHeight(window.innerHeight)
    }

    const handleFileChange = (file: TFile) => {
        console.log("active file changed: ", file.path)
        refreshSnapshots(file.path)
    }

    useImperativeHandle(ref, ()=>{
        return {
            refreshSnapshots 
        }
    })

    useEffect(() => {
        const _cur = _app?.workspace.getActiveFile()?.path
        refreshSnapshots(_cur)

        _app?.workspace.on('file-open', handleFileChange)
        window.addEventListener('resize', handleResize)
        window.addEventListener('backup-success', handleBackupSuccess)

        return () => {
            _app?.workspace.off('file-open', handleFileChange)
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('backup-success', handleBackupSuccess)
        }

    }, [])

    return <div>
            { treeData.length !== 0 ? 
                <Tree 
                    height={windowHeight * 0.85}
                    style={treeStyle} 
                    treeData={treeData} 
                    selectable={false} 
                /> :
                <Empty 
                    description={
                        <span style={emptyDescriptionStyle}>NoData</span>
                    }
                    imageStyle={emptyImageStyle}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                /> 
            }
            </div>
})