import React, {Component} from "react";
// react plugin for creating charts
import ChartistGraph from "react-chartist";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import Tooltip from "@material-ui/core/Tooltip";
import Icon from "@material-ui/core/Icon";

// @material-ui/icons
// import ContentCopy from "@material-ui/icons/ContentCopy";
import Store from "@material-ui/icons/Store";
// import InfoOutline from "@material-ui/icons/InfoOutline";
import Warning from "@material-ui/icons/Warning";
import DateRange from "@material-ui/icons/DateRange";
import LocalOffer from "@material-ui/icons/LocalOffer";
import Update from "@material-ui/icons/Update";
import ArrowUpward from "@material-ui/icons/ArrowUpward";
import AccessTime from "@material-ui/icons/AccessTime";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Table from "components/Table/Table.js";
import Button from "components/CustomButtons/Button.js";
import Danger from "components/Typography/Danger.js";
import Card from "components/Card/Card.js";
import CardHeader from "components/Card/CardHeader.js";
import CardIcon from "components/Card/CardIcon.js";
import CardBody from "components/Card/CardBody.js";
import CardFooter from "components/Card/CardFooter.js";
import Gram from "components/Gram";

import TONAPI from "components/API/api";

import {
  dailySalesChart,
  emailsSubscriptionChart,
  completedTasksChart
} from "variables/charts";

import {returnsChart, periodReturnsChart, aumChart} from "./ChartData";



import styles from "assets/jss/material-dashboard-react/views/dashboardStyle.js";
import { withStyles } from '@material-ui/styles';


const useStyles = makeStyles(styles);

class TonDashboard extends Component {

  state = {
    performanceLoading : false,
    aum_array : [],
    aum_labels : [],
    rate_array : [],
    return_array : [],
    return_labels :[],
    period_return_array : [],
    period_return_labels :[],
    intial_rate : 1,
    final_rate : 1,
    roi: 0,
    last_roi : 0,
    last_aum : 0
  }

  constructor(){
    super();
    this.loadTonData = this.loadTonData.bind(this);
  }

  async loadTonData(){
    let aum_array=[];
    let aum_labels=[];
    let return_array=[];
    let return_labels=[];
    let period_return_array=[];
    let period_return_labels=[];
    let rate_array=[];

    let roi = 0;
    let last_roi = 0;
    let last_aum = 0;

    let performance = await TONAPI.getPerformance();

    console.log("TONDashboard", performance);

    for(let i in performance){
      let p = performance[i];
      aum_array.push( parseInt(p.aum) );
      aum_labels.push( parseInt(p.period) );
      if( rate_array.length > 0 && parseInt( p.rate ) != 0  ){
        period_return_array.push( (parseFloat(parseInt( p.rate )) - parseFloat(rate_array[rate_array.length-1])) / parseFloat(rate_array[rate_array.length-1]) );       
        period_return_labels.push( parseInt(p.period) );
        return_array.push( ((parseFloat(parseInt( p.rate )) - parseFloat(rate_array[0])) / parseFloat(rate_array[0]) ));       
        return_labels.push( parseInt(p.period) );
        roi = return_array[return_array.length-1];
        last_roi = period_return_array[period_return_array.length-1];
      }
      last_aum = aum_array[aum_array.length-1];
      rate_array.push( parseInt(p.rate) );
    }
    this.setState({performanceLoading: false, roi, last_roi, last_aum, aum_array, rate_array,  return_array, return_labels, period_return_array, period_return_labels });


  }

  componentDidMount(){
    this.loadTonData();
  }

  render(){
    const { classes } = this.props;
    const { aum_array, aum_labels, period_return_array, period_return_labels, return_array, return_labels, roi, last_roi, last_aum} = this.state;
    console.log("TonDashboard", this.props, this.state);
    returnsChart.options.high = Math.max(...return_array) * 100;
    returnsChart.options.low = Math.min(...return_array) * 100;
    periodReturnsChart.options.high = Math.max(...period_return_array) * 100;
    periodReturnsChart.options.low = Math.min(...period_return_array) * 100;
    aumChart.options.high = Math.max(...aum_array) / 1000000000;
    aumChart.options.low = Math.min(...aum_array) / 1000000000;

    console.log("TonDashboard", period_return_array, returnsChart, periodReturnsChart);


  return (
    <div>
      <GridContainer>
        <GridItem xs={12} sm={6} md={6} lg={3}>
          <Card>
            <CardHeader color="warning" stats icon>
              <CardIcon color="warning">
                <Icon>content_copy</Icon>
              </CardIcon>
              <p className={classes.cardCategory}>AUM</p>
              <h3 className={classes.cardTitle}>
                  <Gram amount={last_aum}/>
              </h3>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.stats}>
                <Warning />
                  Grams under management
              </div>
            </CardFooter>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={4} md={4} lg={3}>
          <Card>
            <CardHeader color="success" stats icon>
              <CardIcon color="success">
                <Store />
              </CardIcon>
              <p className={classes.cardCategory}>Return</p>
              <h3 className={classes.cardTitle}>{(last_roi * 100).toFixed(2)}<small>%</small></h3>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.stats}>
                <DateRange />
                Last period
              </div>
            </CardFooter>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={4} md={4} lg={3}>
          <Card>
            <CardHeader color="danger" stats icon>
              <CardIcon color="danger">
                <Icon>info_outline</Icon>
              </CardIcon>
              <p className={classes.cardCategory}>Return</p>
              <h3 className={classes.cardTitle}>{(roi * 100).toFixed(2)} <small>%</small></h3>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.stats}>
                <LocalOffer />
                Since inception
              </div>
            </CardFooter>
          </Card>
        </GridItem>
      </GridContainer>
      <GridContainer>
        <GridItem xs={12} sm={12} md={4}>
          <Card chart className={classes.cardHover}>
            <CardHeader color="info" className={classes.cardHeaderHover}>
              <ChartistGraph
                className="ct-chart-white-colors"
                data={{labels : return_labels, series : [return_array.map((x)=>(x*100))]}}
                type="Line"
                options={returnsChart.options}
                listener={returnsChart.animation}
              />
            </CardHeader>
            <CardBody>
              <div className={classes.cardHoverUnder}>
                {/*<Button color="info">
                    Join
                   </Button>*/}
              </div>
              <h4 className={classes.cardTitle}>Returns</h4>
              <p className={classes.cardCategory}>
                <span className={classes.successText}>
                  <ArrowUpward className={classes.upArrowCardCategory} /> {(roi * 100).toFixed(2)} %
                </span>{" "}
                since inception
              </p>
            </CardBody>
            {/*<CardFooter chart>
              <div className={classes.stats}>
                <AccessTime /> updated 1 day ago
              </div>
            </CardFooter>*/}
          </Card>
        </GridItem>
        <GridItem xs={12} sm={12} md={4}>
          <Card chart className={classes.cardHover}>
            <CardHeader color="warning" className={classes.cardHeaderHover}>
              <ChartistGraph
                className="ct-chart-white-colors"
                data={{labels : period_return_labels, series : [period_return_array.map((x)=>(x*100))]}}
                type="Bar"
                options={periodReturnsChart.options}
                responsiveOptions={periodReturnsChart.responsiveOptions}
                listener={periodReturnsChart.animation}
              />
            </CardHeader>
            <CardBody>
              <div className={classes.cardHoverUnder}>
                {/*<Button color="info">
                    Join
                   </Button>*/}

              </div>
              <h4 className={classes.cardTitle}>Returns by periods</h4>
              <p className={classes.cardCategory}>Staking returns in %</p>
            </CardBody>
            {/*<CardFooter chart>
              <div className={classes.stats}>
                <AccessTime /> campaign sent 2 days ago
              </div>
            </CardFooter>*/}
          </Card>
        </GridItem>
        <GridItem xs={12} sm={12} md={4}>
          <Card chart className={classes.cardHover}>
            <CardHeader color="danger" className={classes.cardHeaderHover}>
              <ChartistGraph
                className="ct-chart-white-colors"
                data={{labels : aum_labels, series : [aum_array.map((x)=>(x/1000000000))]}}
                type="Line"
                options={aumChart.options}
                listener={aumChart.animation}
              />
            </CardHeader>
            <CardBody>
              <div className={classes.cardHoverUnder}>
                {/*<Button color="info">
                    Join
                   </Button>*/}

              </div>
              <h4 className={classes.cardTitle}>AUM</h4>
              <p className={classes.cardCategory}>Grams in pool</p>
            </CardBody>
            {/*<CardFooter chart>
              <div className={classes.stats}>
                <AccessTime /> Grams in fund
              </div>
            </CardFooter>*/}
          </Card>
        </GridItem>
      </GridContainer>
      <br />
    </div>
  );}
}



export default withStyles(styles)(TonDashboard);
