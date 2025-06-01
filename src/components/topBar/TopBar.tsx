// TopBar wraps the DecentBar with some props specific to the app.
import { DecentBar, Link, defaultOnClickLink } from "decent-portal";

const appLinks:Link[] = [
  {description:'About', url:'about'},
  {description:'Support', url:'https://github.com/erikh2000/hone/issues'},
];

const contributorText = "Erik Hermansen";

function _onClickLink(link:Link, onAboutClick: () => void) {
  const { url } = link;
  if (url === 'about') {onAboutClick(); return;}
  defaultOnClickLink(link);
}

type Props = { onAboutClick:() => void; }

function TopBar({ onAboutClick }:Props) {
  return <DecentBar 
    appName="Hone" 
    appLinks={appLinks} 
    contributorText={contributorText} 
    onClickLink={link => _onClickLink(link, onAboutClick)}
  />;
}

export default TopBar;