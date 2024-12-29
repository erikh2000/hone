import { Route } from 'wouter';
import LoadScreen from "@/loadScreen/LoadScreen.tsx";
import HomeScreen from "@/homeScreen/HomeScreen.tsx";
import StartScreen from '@/startScreen/StartScreen';
import TestScreen from '@/testScreen/TestScreen';
import {START_URL, LOAD_URL, HOME_URL, TEST_URL} from '@/common/urlUtil';

function Router() {
  return (
    <>
      <Route path={START_URL} component={StartScreen} />
      <Route path={LOAD_URL} component={LoadScreen} />
      <Route path={HOME_URL} component={HomeScreen} />
      <Route path={TEST_URL} component={TestScreen} />
    </>
  )
}

export default Router