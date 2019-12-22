import React, {Component} from "react";
import ReactTable from "react-table";

// react plugin for creating charts

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import Icon from "@material-ui/core/Icon";

// @material-ui/icons
// import ContentCopy from "@material-ui/icons/ContentCopy";
import Store from "@material-ui/icons/Store";
// import InfoOutline from "@material-ui/icons/InfoOutline";
import Warning from "@material-ui/icons/Warning";
import DateRange from "@material-ui/icons/DateRange";
import LocalOffer from "@material-ui/icons/LocalOffer";
import Update from "@material-ui/icons/Update";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Table from "components/Table/Table.js";
import Card from "components/Card/Card.js";
import CardHeader from "components/Card/CardHeader.js";
import CardIcon from "components/Card/CardIcon.js";
import CardBody from "components/Card/CardBody.js";
import CardFooter from "components/Card/CardFooter.js";
import Button from "components/CustomButtons/Button.js";

import Assignment from "@material-ui/icons/Assignment";

import { withStyles } from '@material-ui/styles';


import Gram from "components/Gram";
import styles from "assets/jss/material-dashboard-react/views/dashboardStyle.js";

import TONAPI from "components/API/api";


class TonPerformance extends Component {

  state = {
    aum : 0,
    units : 0,
    rate : 0,
    performance : []
  }

  constructor(){
    super();
    this.loadTonData = this.loadTonData.bind(this);
    this.backgroundCheck = this.backgroundCheck.bind(this);
  }

  async loadTonData(){
    console.log("TonPerformance loadTonData", this);

    let {performance} = this.state;

    let newperformance = [];
    const pool_state = await TONAPI.getState();
    const pool_performance = await TONAPI.getPerformance();
    console.log("TonPerformance loadTonData", pool_performance);


    for(let idx in pool_performance){
      let p = pool_performance[idx]; 
      newperformance.push({
        id : p.period,
        aum: p.aum,
        units: parseInt(p.units),
        rate: parseInt(p.rate),
        deposits: parseInt(p.deposits),
        withdrawals : parseInt(p.withdrawals)  
      })
    }

    this.setState({
      performance:newperformance,
      aum: parseInt( pool_performance[pool_performance.length-2].aum),
      units: parseInt( pool_performance[pool_performance.length-2].units),
      rate: parseInt( pool_performance[pool_performance.length-2].rate)
    
    });

  }

  sleep = m => new Promise(r => setTimeout(r, m))

  async backgroundCheck() {
    console.log("Background check");
    await this.sleep(30000);
    this.loadTonData();
    this.backgroundCheck()
}

  componentDidMount(){
    //this.backgroundCheck();
    this.loadTonData();
  }


  renderPerformanceTable(tabledata){
    return tabledata.map( (x)=>([x.id,  <Gram amount={x.aum}/>, x.units, x.rate, <Gram amount={x.deposits}/>, x.withdrawals]));
  }


  render(){
      const { classes } = this.props;
      const { performance, aum, units, rate } = this.state;

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
                    <Gram amount={aum}/>
                  </h3>
                </CardHeader>
                <CardFooter stats>
                  <div className={classes.stats}>
                    <Warning />
                      Grams under managament
                  </div>
                </CardFooter>
              </Card>
            </GridItem>
            <GridItem xs={12} sm={6} md={6} lg={3}>
              <Card>
                <CardHeader color="danger" stats icon>
                  <CardIcon color="danger">
                    <Icon>info_outline</Icon>
                  </CardIcon>
                  <p className={classes.cardCategory}>Units</p>
                  <h3 className={classes.cardTitle}>{units}</h3>
                </CardHeader>
                <CardFooter stats>
                  <div className={classes.stats}>
                    <LocalOffer />
                        Units issued
                  </div>
                </CardFooter>
              </Card>
            </GridItem>
            <GridItem xs={12} sm={6} md={6} lg={3}>
              <Card>
                <CardHeader color="info" stats icon>
                  <CardIcon color="info">
                    <i className="fab fa-twitter" />
                  </CardIcon>
                  <p className={classes.cardCategory}>Rate</p>
                  <h3 className={classes.cardTitle}>{<Gram amount={rate}/>}</h3>
                </CardHeader>
                <CardFooter stats>
                  <div className={classes.stats}>
                    <Update />
                      Grams per unit
                  </div>
                </CardFooter>
              </Card>
            </GridItem>
          </GridContainer>


          <GridContainer>
          <GridItem xs={12}>
            <Card>
              <CardHeader color="rose" icon>
                <CardIcon color="rose">
                  <Assignment />
                </CardIcon>
                <h4 className={classes.cardIconTitle}>Performance</h4>
              </CardHeader>
              <CardBody>
                <Table
                  tableHeaderColor="primary"
                  tableHead={["Id", "AUM", "Units", "Rate", "Deposits", "Withdrawals"]}
                  tableData={this.renderPerformanceTable(performance)}
                  coloredColls={[3]}
                  colorsColls={["primary"]}
                />
              </CardBody>
            </Card>
          </GridItem>

        </GridContainer>
      <br />
    </div>
  );}
}


export default withStyles(styles)(TonPerformance);