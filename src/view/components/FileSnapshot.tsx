import { CSSProperties, forwardRef, useRef, Component, ReactNode, useEffect, useImperativeHandle, useState } from 'react';
import { Restic } from 'src/restic/restic';
import { Tree } from 'antd'
import { TreeDataNode, Empty } from 'antd'
import { DateTime } from 'luxon';

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
    initFile: string| undefined
}

export interface FileSnapshotMethods {
    refreshSnapshots: (pattern: string | undefined) => Promise<void>
}

export const FileSnapshot = forwardRef<FileSnapshotMethods, FileSnapshotProps>((props, ref) => {
    const [treeData, setTreeData] = useState<TreeDataNode[]>([])
    const [windowHeight, setWindowHeight] = useState(window.innerHeight)

    const getFileSnapshots = async (restic: Restic | undefined, pattern: string) => {
        let matches = await restic?.findFileInSnapshots(pattern)
        if (!matches) {
            return []
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

        console.log('matches: ', matches)
        const nodes : TreeDataNode[]  = []
        for(let i=0; i< matches.length ; i++)  {
            const match = matches[i]
            const snap = await restic?.getSnapshotById(match.snapshot)
            if (!snap) {
                continue
            }
            // console.log('snap: ', snap)
            const t = DateTime.fromISO(snap.time)
            const node = {
                title: t.toFormat('yyyy-MM-dd HH:mm:ss'),
                key: match.snapshot,
            }
            // return {
            //     title: t.toFormat('yyyy-MM-dd HH:mm:ss'),
            //     key: match.snapshot,
            // }
            console.log("nodes.length: ",  nodes.length)
            console.log('treeData.length: ', treeData.length)
            setTreeData(() => {
                return [...nodes, node]
                // console.log(preData)
                // return [...treeData, node]
            })
            nodes.push(node)
        }
        return

        const pace = 5
        const chunks = []
        for (let i=0; i<matches.length; i+=pace) {
            chunks.push(matches.slice(i, i+pace))
        }



        for (const chunk of chunks) {
            const result = await Promise.all(chunk.map(async(match): Promise<TreeDataNode|null> =>{
                const snap = await restic?.getSnapshotById(match.snapshot)
                if (!snap) {
                    return null
                }
                const t = DateTime.fromISO(snap.time)
                return {
                    title: t.toFormat('yyyy-MM-dd HH:mm:ss'),
                    key: match.snapshot,
                }
            }))

            const noNullResult: TreeDataNode[] = result.filter((node): node is TreeDataNode=> {
                return node !== null
            })

            console.log("result: ", noNullResult)

            nodes.push(...noNullResult)
            console.log("nodes: ", nodes)

            setTreeData(nodes)
        }

        // const promises = matches.map(async(match): Promise<TreeDataNode> => {
        //     for (let i=0; i<match.matches.length; i++) {
        //         const file = match.matches[i]
        //         if (!reg.test(file.path)) {
        //             continue
        //         }
    
        //         const snap = await restic?.getSnapshotById(match.snapshot)
        //         if (!snap) {
        //             continue
        //         }
        //         const t = DateTime.fromISO(snap.time)
        //         return {
        //             title: t.toFormat('yyyy-MM-dd HH:mm:ss'),
        //             key: match.snapshot,
        //         }
        //     }
    
        //     return {title: '', key: ''}
        // })
        // const nodes = await Promise.all(promises)
        // console.log('nodes: ', nodes)
        // return nodes
    
        // for(let i=0; i<matches.length; i++) {
        //     const match = matches[i]
        //     for (let j=0; j<match.matches.length; j++) {
        //         const file = match.matches[j]
        //         if (reg.test(file.path)) {
        //             // create node
        //             const snap =  await restic?.getSnapshotById(match.snapshot)
        //             if (!snap) {
        //                 continue
        //             }
        //             const t = DateTime.fromISO(snap.time)
        //             nodes.push({
        //                 title: t.toFormat('yyyy-MM-dd HH:mm:ss'),
        //                 key: match.snapshot, 
        //             })
        //             break
        //         }
        //     }
        // }
        // return nodes
    }

    const refreshSnapshots = async (pattern: string | undefined) => {
        if (pattern) {
            await getFileSnapshots(props.restic, pattern)
        }else{
            setTreeData([])
        }
    }

    const handleResize = ()=> {
        setWindowHeight(window.innerHeight)
    }

    useImperativeHandle(ref, ()=>{
        return {
            refreshSnapshots 
        }
    })


    useEffect(() => {
        refreshSnapshots(props.initFile)

        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
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