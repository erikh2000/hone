import { useEffect, useState } from 'react';

import styles from './DecentBar.module.css';
import ContentButton from '@/components/contentButton/ContentButton';

export type Link = {
  description:string,
  url:string
}

type Props = {
  appName:string,
  appLinks?:Link[],
  contributorText?:string,
  onClickLink:(link:Link) => void
}

function _findFavIconLink() {
  return document.querySelector<HTMLLinkElement>('link[rel~="icon"][sizes="192x192"]') ||
    document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
}

function _appLinksContent(links:Link[], onClickLink:Function) {
  if (!links.length) return null;
  const linkButtons = links.map((link, buttonNo) => {
    return (
      <ContentButton key={buttonNo} text={link.description} onClick={() => {onClickLink(link)}}/>
     ); 
  });
  return <>Links:<br />{linkButtons}</>;
}

function DecentBar({ appName, appLinks, contributorText, onClickLink }: Props) {
  const [favIconUrl, setFavIconUrl] = useState<string | null>(null);

  useEffect(() => {
    const link = _findFavIconLink();
    if (!link) return;
    setFavIconUrl(link.href);
  }, []);

  if (!favIconUrl) return null;

  const appLinksContent = _appLinksContent(appLinks || [], onClickLink);

  return (
    <div className={styles.container}>
      <div className={styles.decentFacet}>  
        <img src={favIconUrl} className={styles.favIcon} draggable="false"/>
      </div>
      <div className={styles.appFacet}>
        <div className={styles.appName}>{appName}</div>
        <div className={styles.appButtonArea}>
          {appLinksContent}
        </div>
      </div>
      <div className={styles.appFacetSeparator} />
      <div className={styles.contributorFacet}>
        {contributorText}
      </div>
    </div>
  )
}

export default DecentBar;