
import { CSSProperties } from 'react';
import { Layout } from 'antd';
import { Notice } from 'obsidian'
import { CaretRightOutlined, FolderViewOutlined, FileSearchOutlined } from '@ant-design/icons';
import { Restic } from 'src/restic/restic';

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

const iconMouseEnter = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
  const _cur = event.currentTarget;
  _cur.style.color = 'var(--icon-color-hover)'
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

type ViewAppProps = {
  restic: Restic | undefined
}

export const ViewApp = (props: ViewAppProps) =>  {
  const _restic = props.restic

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
      {/* <Greeting /> */}
    </Content>
    <Footer style={footerStyle}></Footer>
  </Layout>
}

