import { CSSProperties, forwardRef, Component, ReactNode, useEffect, useImperativeHandle, useState } from 'react';
import { Restic } from 'src/restic/restic';
import { Tree } from 'antd'
import type { TreeDataNode } from 'antd'

interface DataNode {
    title: string;
    key: string;
    isLeaf?: boolean;
    children?: DataNode[];
}

const initData: TreeDataNode[] = [ 
    { title: "111", key: "1", isLeaf: true },
    { title: "222", key: "2", isLeaf: true },
]
  
// It's just a simple demo. You can use tree map to optimize update perf.
const updateTreeData = (list: DataNode[], key: React.Key, children: DataNode[]): DataNode[] =>
list.map((node) => {
    if (node.key === key) {
    return {
        ...node,
        children,
    };
    }
    if (node.children) {
    return {
        ...node,
        children: updateTreeData(node.children, key, children),
    };
    }
    return node;
});

const getFileSnapshots = async (restic: Restic | undefined, pattern: string): Promise<TreeDataNode[]> => {
    const matches = await restic?.findFileInSnapshots(pattern)
    return []
}

const treeStyle: CSSProperties = {
    color: 'var(--nav-item-color)',
    background: 'var(--background-secondary)',
}
  

type FileSnapshotProps = {
    restic: Restic | undefined
}

export interface FileSnapshotMethod {
    refreshSnapshots: (pattern: string | undefined) => Promise<void>
}


export const FileSnapshot = forwardRef<FileSnapshotMethod, FileSnapshotProps>((props, ref) => {
    // getFileSnapshots(props.restic, "xxsf", setTreeData)
    // getFileSnapshots(props.restic, "")
    const [treeData, setTreeData] = useState(initData)

    const refreshSnapshots = async (pattern: string | undefined) => {
        if (pattern) {
            const nodes = await getFileSnapshots(props.restic, pattern)
            setTreeData(nodes)
        }else{
            setTreeData([])
        }

        // props.restic?.findFileInSnapshots("xxxxxx")
        // .then((matches)=> {
        //     console.log("matches: ", matches)
        //     setTreeData([
        //         { title: "333", key: "3", isLeaf: true },
        //         { title: "444", key: "4", isLeaf: true },
        //     ])
        // })
        // .catch((error) => {
        //     console.error(error)
        // })
    }

    useImperativeHandle(ref, ()=>{
        return {
            refreshSnapshots 
        }
    })
  
    return <Tree style={treeStyle} treeData={treeData} selectable={false} />;
})