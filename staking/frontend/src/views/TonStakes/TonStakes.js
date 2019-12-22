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



class TonStakes extends Component {

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

    //console.log("TonStakes stakers_counter ", result0);

    let total_stakes = 0;
    let total_balance = 0;
    let nodes = []
    /*
    for(let i = 1 ; i < parseInt(result0.output.value0,16);  i++){
      let result2 = await contracts.runLocal({
        address: poolContract.address,
        functionName: 'get_staker_address',
        abi: PoolPackage.abi,
        input: {
            staker_id : i
        },
        keyPair: keys, 
      });
      console.log("TonStakes staker_address", result2 );
      
      let result20 = await contracts.run({
        address: result2.output.value0.slice(-64),
        functionName: 'get_pool',
        abi: StakerPackage.abi,
        input: {
        },
        keyPair: keys, 
      });
      console.log("TonStakes pool", result20 );

      let result3 = await contracts.run({
        address: result2.output.value0.slice(-64),
        functionName: 'balance',
        abi: StakerPackage.abi,
        input: {
        },
        keyPair: keys, 
      });
      console.log("TonStakes staker balance", result3 );

      let result4 = await contracts.run({
        address: result2.output.value0.slice(-64),
        functionName: 'stake',
        abi: StakerPackage.abi,
        input: {
        },
        keyPair: keys, 
      });
      console.log("TonStakes staker stake", result4 );

      nodes.push({id : i,
        address : result2.output.value0.slice(-64), 
        balance : parseInt(result3.output.value0,16),
        stake : parseInt(result4.output.value0,16) })

      total_stakes += parseInt(result4.output.value0,16);
      total_balance += parseInt(result3.output.value0,16);

    }
    this.setState({total_stakes, total_balance, nodes});
    */
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
    return tabledata.map( (x)=>([x.id, x.address, <Gram amount={x.stake}/>, <Gram amount={x.balance}/>, <Gram amount={x.balance-x.stake}/>]));
  }

  render(){
      const { classes } = this.props;
      const { total_stakes, total_balance, nodes } = this.state;

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
                      Total at stake
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
                  <p className={classes.cardCategory}>Reward</p>
                  <h3 className={classes.cardTitle}><Gram amount={total_balance - total_stakes}/></h3>
                </CardHeader>
                <CardFooter stats>
                  <div className={classes.stats}>
                    <LocalOffer />
                    Since inception
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
                  <p className={classes.cardCategory}>Nodes</p>
                  <h3 className={classes.cardTitle}>{nodes.length}</h3>
                </CardHeader>
                <CardFooter stats>
                  <div className={classes.stats}>
                    <Update />
                      Trusted us
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
                  tableHead={["Node", "Address", "Stake", "Balance", "Reward"]}
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


export default withStyles(styles)(TonStakes);