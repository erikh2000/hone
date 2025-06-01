import { Route } from 'wouter';
import LoadScreen from "@/loadScreen/LoadScreen.tsx";
import HomeScreen from "@/homeScreen/HomeScreen.tsx";
import {LOAD_URL, HOME_URL} from '@/init/theUrls.ts';

function Router() {
  return (
    <>
      <Route path={LOAD_URL} component={LoadScreen} />
      <Route path={HOME_URL} component={HomeScreen} />
    </>
  )
}

export default Router;