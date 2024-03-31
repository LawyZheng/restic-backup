import { CSSProperties, forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Restic } from 'src/restic/restic';
import { Tree } from 'antd'
import { TreeDataNode, Empty } from 'antd'
import { DateTime } from 'luxon';
import { useApp } from 'src/view/hook/app';
import { TFile } from 'obsidian';

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
        console.log("matches.length: ", matches.length)
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
                const t = DateTime.fromISO(snap.time)
                return {
                    title: t.toFormat('yyyy-MM-dd HH:mm:ss'),
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