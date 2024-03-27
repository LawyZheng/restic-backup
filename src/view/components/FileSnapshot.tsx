import { CSSProperties, useState } from 'react';
import { Restic } from 'src/restic/restic';
import { Tree } from 'antd'
import type { TreeDataNode } from 'antd'

interface DataNode {
    title: string;
    key: string;
    isLeaf?: boolean;
    children?: DataNode[];
}

const getFileSnapshots = (restic: Restic | undefined, file: string): TreeDataNode[] => {
    return [ 
        { title: "111", key: "1", isLeaf: true },
        { title: "222", key: "2", isLeaf: true },
    ]
}
  
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

const treeStyle: CSSProperties = {
    color: 'inherit',
    background: 'inherit',
}
  

type FileSnapshotProps = {
    restic: Restic | undefined
}

export const FileSnapshot = (props: FileSnapshotProps) =>  {
    const initData = getFileSnapshots(props.restic, "")
    const [treeData, setTreeData] = useState(initData);

    // getFileSnapshots(props.restic, "")
  
    return <Tree style={treeStyle} treeData={treeData} selectable={false} />;
}