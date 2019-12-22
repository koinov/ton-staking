import TonDashboard from "views/TonDashboard/TonDashboard.js";
import TonSubscriptions from "views/TonSubscriptions/TonSubscriptions.js";
import TonStakes from "views/TonStakes/TonStakes.js";
// import TonFaq from "views/TonFaq/TonFaq.js";
import TonPerformance from "views/TonPerformance/TonPerformance.js";
import TonPool from "views/TonPool/TonPool.js";

//import UserProfile from "views/Pages/TonUserProfile.js";

import DashboardIcon from "@material-ui/icons/Dashboard";
import WalletIcon from "@material-ui/icons/AccountBalanceWallet";
import StakingIcon from "@material-ui/icons/MonetizationOn";
import SettingsIcon from "@material-ui/icons/Settings";
import FaqIcon from "@material-ui/icons/QuestionAnswer";
import PerformanceIcon from "@material-ui/icons/InsertChartOutlined";
import PoolIcon from "@material-ui/icons/SupervisedUserCircle";
import KeysIcon from "@material-ui/icons/Lock";

var tonRoutes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    icon: DashboardIcon,
    component: TonDashboard,
    layout: "/ton"
  },
  {
    path: "/subscriptions",
    name: "Subscriptions",
    icon: WalletIcon,
    component: TonSubscriptions,
    layout: "/ton"
  },
  /*{
    path: "/staking",
    name: "Staking",
    icon: StakingIcon,
    component: TonStakes,
    layout: "/ton"
  },*/
  {
    path: "/performance",
    name: "Performance",
    icon: PerformanceIcon,
    component: TonPerformance,
    layout: "/ton"
  },
  {
    path: "/pool",
    name: "Pool",
    icon: PoolIcon,
    component: TonPool,
    layout: "/ton"
  }/*,
  {
    path: "/faq",
    name: "FAQ",
    icon: FaqIcon,
    component: TonFaq,
    layout: "/ton"
  } */
];
export default tonRoutes;
