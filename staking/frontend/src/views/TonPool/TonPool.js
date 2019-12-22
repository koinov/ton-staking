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

import Assignment from "@material-ui/icons/Assignment";

import { withStyles } from '@material-ui/styles';


import Gram from "components/Gram";
import styles from "assets/jss/material-dashboard-react/views/dashboardStyle.js";

import TONAPI from "components/API/api";


class TonPool extends Component {

  state = {
    total_stakes : 0,
    nodes : []
  }

  constructor(){
    super();
    this.loadTonData = this.loadTonData.bind(this)
    this.backgroundCheck = this.backgroundCheck.bind(this)

  }

  async loadTonData(){
    console.log("TonStakes loadTonData", this);


    let total_stakes = 0;
    let total_balance = 0;
    let total_nodes = 0;
    let nodes = [];

    
    const pool_nominators = await TONAPI.getNominators();
    
    for(let idx in pool_nominators){
      let p = pool_nominators[idx]; 
      nodes.push({
        address : p.address,
        balance : parseInt(p.balance),
        stake : parseInt(p.stake),
        status : parseInt(p.status)
      })
      total_stakes += parseInt(p.stake);
      if( parseInt(p.stake) > 0 ){
        total_nodes += 1;
      } 
    }

    this.setState({
      total_stakes, total_balance, total_nodes, nodes
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


  renderNodesTable(tabledata){
    return tabledata.map( (x)=>([x.address, <Gram amount={x.stake}/>, <Gram amount={x.balance}/>, x.status == 1 ? "Active" : "Inactive"]));
  }

  render(){
      const { classes } = this.props;
      const { total_stakes, total_nodes, nodes } = this.state;

      return (
        <div>
          <GridContainer>
            <GridItem xs={12} sm={6} md={6} lg={3}>
              <Card>
                <CardHeader color="warning" stats icon>
                  <CardIcon color="warning">
                    <Icon>content_copy</Icon>
                  </CardIcon>
                  <p className={classes.cardCategory}>Stake</p>
                  <h3 className={classes.cardTitle}>
                    <Gram amount={total_stakes}/>
                  </h3>
                </CardHeader>
                <CardFooter stats>
                  <div className={classes.stats}>
                    <Warning />
                      Grams at stake
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
                  <p className={classes.cardCategory}>Active nodes</p>
                  <h3 className={classes.cardTitle}>{total_nodes}</h3>
                </CardHeader>
                <CardFooter stats>
                  <div className={classes.stats}>
                    <Update />
                      Nodes validating now
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
                <h4 className={classes.cardIconTitle}>Nodes</h4>
              </CardHeader>
              <CardBody>
                <Table
                  tableHeaderColor="primary"
                  tableHead={["Nominator address", "Stake", "Balance", "Status"]}
                  tableData={this.renderNodesTable(nodes)}
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

export default withStyles(styles)(TonPool);