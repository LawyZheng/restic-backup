
import { CSSProperties, useRef } from 'react';
import { Layout } from 'antd';
import { Notice } from 'obsidian'
import { CaretRightOutlined, FolderViewOutlined, FileSearchOutlined } from '@ant-design/icons';
import { Restic } from 'src/restic/restic';

import { FileSnapshot, FileSnapshotMethod } from 'src/view/components/FileSnapshot';
import { useApp } from '../hook/app';

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
  color: 'inherit',
}



type ViewAppProps = {
  restic: Restic | undefined
}

export const ViewApp = (props: ViewAppProps) =>  {
  const _restic = props.restic
  const _fileSnapshotRef = useRef<FileSnapshotMethod>()
  const app = useApp()

  const iconMouseEnter = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const _cur = event.currentTarget;
    _cur.style.color = 'var(--icon-color-hover)'

    console.log(app?.workspace.getActiveFile()?.path)

    _fileSnapshotRef.current?.refreshSnapshots(app?.workspace.getActiveFile()?.path)
  }
  
  const iconMouseLeave = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const _cur = event.currentTarget;
    _cur.style.color = 'inherit'
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

  return <Layout style={layoutStyle}>
    <Header style={headerStyle}>
      <CaretRightOutlined 
        style={iconStyle} 
        aria-label='Backup' 
        onMouseEnter={iconMouseEnter}
        onMouseLeave={iconMouseLeave}
        onClick={clickBackup(_restic)}
      />
      <FileSearchOutlined 
        style={iconStyle} 
        aria-label='File Snapshot' 
        onMouseEnter={iconMouseEnter}
        onMouseLeave={iconMouseLeave}
      />
      <FolderViewOutlined 
        style={iconStyle} 
        aria-label='Vault Snapshot' 
        onMouseEnter={iconMouseEnter}
        onMouseLeave={iconMouseLeave}
      />
    </Header>
    <Content style={contentStyle}>
      <FileSnapshot restic={_restic} ref={_fileSnapshotRef}/>
    </Content>
    <Footer style={footerStyle}></Footer>
  </Layout>
}

