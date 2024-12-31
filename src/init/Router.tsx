import { Route } from 'wouter';
import LoadScreen from "@/loadScreen/LoadScreen.tsx";
import HomeScreen from "@/homeScreen/HomeScreen.tsx";
import TestScreen from '@/testScreen/TestScreen';
import {LOAD_URL, HOME_URL, TEST_URL} from '@/common/urlUtil';

function Router() {
  return (
    <>
      <Route path={LOAD_URL} component={LoadScreen} />
      <Route path={HOME_URL} component={HomeScreen} />
      <Route path={TEST_URL} component={TestScreen} />
    </>
  )
}

export default Router