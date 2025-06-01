import styles from './Pane.module.css';
import PaneHeaderButton from "./PaneHeaderButton";

import {PropsWithChildren, JSX} from "react";

export type ButtonDefinition = {
  text:string,
  onClick:() => void,
  disabled?:boolean
}

interface IProps {
  caption?:string,
  className?:string,
  comment?:string,
  buttons?:ButtonDefinition[]
}

function _renderButtonElements(buttons:ButtonDefinition[]):JSX.Element {
  const buttonElements:JSX.Element[] = buttons.map(buttonDefinition => {
    const { text, onClick, disabled } = buttonDefinition;
    return <PaneHeaderButton key={text} text={text} onClick={onClick} disabled={disabled} />;
  });
  return <span className={styles.buttonBar}>{buttonElements}</span>;
}

function Pane(props:PropsWithChildren<IProps>) {
  const { children, className, caption, comment, buttons } = props;
  const captionElement = caption ? <span className={styles.caption}>{caption}</span> : null;
  const footerElement = comment ? <div className={styles.footer}>{comment}</div> : null;
  const buttonElements = buttons ? _renderButtonElements(buttons) : null;
  const headerElement = captionElement || buttonElements ? <div className={styles.header}>{captionElement}{buttonElements}</div> : null;

  return (
    <div className={className}>
      <div className={styles.container}>
        {headerElement}
        {children}
        {footerElement}
      </div>
    </div>
  );
}

export default Pane;