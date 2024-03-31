
import { CSSProperties, useRef, useState } from 'react';
import { Layout } from 'antd';
import { Notice } from 'obsidian'
import { CaretRightOutlined, FolderViewOutlined, FileSearchOutlined } from '@ant-design/icons';
import { Restic } from 'src/restic/restic';

import { FileSnapshot, FileSnapshotMethods } from 'src/view/components/FileSnapshot';
import { VaultSnapshot } from 'src/view/components/VaultSnapshot';

const { Header, Footer, Content } = Layout;

const headerStyle: CSSProperties = {
  textAlign: 'center',
  color: '#fff',
  height: 40,
  paddingInline: 48,
  lineHeight: '30px',
  backgroundColor: 'transparent',
  borderBottom: '1px var(--background-primary) groove'
};

const contentStyle: CSSProperties = {
  paddingTop: 10,
  textAlign: 'center',
  minHeight: 120,
  lineHeight: '120px',
  color: '#fff',
  background: 'transparent'
};

const footerStyle: CSSProperties = {
  textAlign: 'center',
  color: '#fff',
  background: 'transparent'
};

const layoutStyle: CSSProperties = {
  height: '100%',
  overflow: 'hidden',
  backgroundColor: 'transparent',
};

const iconStyle: CSSProperties = {
  fontSize: '18px',
  padding: '0 5px',
  color: 'var(--nav-item-color)',
}

type ViewAppProps = {
  restic: Restic | undefined
}

export const ViewApp = (props: ViewAppProps) =>  {
  const FILE_SNAPSHOT_VIEW = 1
  const VAULT_SNAPSHOT_VIEW = 2

  const _fileSnapshotRef = useRef<FileSnapshotMethods>(null)

  const [viewPage, setViewPage] = useState(FILE_SNAPSHOT_VIEW)
  const swithToFileSnapshotView = () => {
    setViewPage(FILE_SNAPSHOT_VIEW)
  }
  const swithToVaultSnapshotView = () => {
    setViewPage(VAULT_SNAPSHOT_VIEW)
  }

  const iconMouseEnter = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const _cur = event.currentTarget;
    _cur.style.color = 'var(--icon-color-hover)'
  }
  
  const iconMouseLeave = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const _cur = event.currentTarget;
    _cur.style.color = 'var(--nav-item-color)'
  }

  const clickBackup = (restic: Restic | undefined) => () => {
    new Notice('starting backup...')
    restic?.backup()
      .then(()=> {
        new Notice('backup successfully!!')
        dispatchEvent(new CustomEvent("backup-success"));
      })
      .catch((error)=>{
        new Notice(error)
      })
  }

  const renderComponent = () => {
    switch (viewPage) {
      case FILE_SNAPSHOT_VIEW:
        return <FileSnapshot restic={props.restic} ref={_fileSnapshotRef}/>
      case VAULT_SNAPSHOT_VIEW:
        return <VaultSnapshot restic={props.restic} />
    }
  }

  return <Layout style={layoutStyle}>
    <Header style={headerStyle}>
      <CaretRightOutlined 
        style={iconStyle} 
        aria-label='Backup' 
        onMouseEnter={iconMouseEnter}
        onMouseLeave={iconMouseLeave}
        onClick={clickBackup(props.restic)}
      />
      <FileSearchOutlined 
        style={iconStyle} 
        aria-label='File Snapshot' 
        onMouseEnter={iconMouseEnter}
        onMouseLeave={iconMouseLeave}
        onClick={swithToFileSnapshotView}
      />
      <FolderViewOutlined 
        style={iconStyle} 
        aria-label='Vault Snapshot' 
        onMouseEnter={iconMouseEnter}
        onMouseLeave={iconMouseLeave}
        onClick={swithToVaultSnapshotView}
      />
    </Header>
    <Content style={contentStyle}>
      { renderComponent() }
    </Content>
    <Footer style={footerStyle}></Footer>
  </Layout>
}

