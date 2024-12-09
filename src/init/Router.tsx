import { Route } from 'wouter';
import LoadScreen from "@/loadScreen/LoadScreen.tsx";
import HomeScreen from "@/homeScreen/HomeScreen.tsx";
import StartScreen from '@/startScreen/StartScreen';
import {START_URL, LOAD_URL, HOME_URL} from '@/common/urlUtil';

function Router() {
  return (
    <>
      <Route path={START_URL} component={StartScreen} />
      <Route path={LOAD_URL} component={LoadScreen} />
      <Route path={HOME_URL} component={HomeScreen} />
    </>
  )
}

export default Router