import React, {Component} from "react";
import Card from "components/Card/Card.js";
import CardHeader from "components/Card/CardHeader.js";
import CardIcon from "components/Card/CardIcon.js";
import CardBody from "components/Card/CardBody.js";
import CardFooter from "components/Card/CardFooter.js";
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Table from "components/Table/Table.js";
import Button from "components/CustomButtons/Button.js";

import Store from "@material-ui/icons/Store";
import Icon from "@material-ui/core/Icon";

import styles from "assets/jss/material-dashboard-react/views/dashboardStyle.js";
import Assignment from "@material-ui/icons/Assignment";
import { withStyles } from '@material-ui/styles';


import Gram from "components/Gram";
import GramStakeModal from "components/GramModal/gramStakeModal";
import GramRedeemModal from "components/GramModal/gramRedeemModal";
import CircularIndeterminate from 'components/Loading';
import CustomInput from "components/CustomInput/CustomInput.js";
import TONAPI from "components/API/api";



class TonSubscriptions extends Component {

    state = {
      balance : 0,
      stake : 0, 
      transferVisible : false,
      receiveVisible : false,
      stakeVisible : false,
      redeemVisible : false,
      subscriptionsLoading : true,
      transfersLoading :true,
      transfers : [],
      subscriptions : [],
      pool : {address : null}
    }

    constructor(){
      super();
      this.loadTonData = this.loadTonData.bind(this);
      this.onWalletCreated = this.onWalletCreated.bind(this);
      this.stakeModalClose = this.stakeModalClose.bind(this);
      this.redeemModalClose = this.redeemModalClose.bind(this);
      this.setWalletAddress = this.setWalletAddress.bind(this);
      this.walletAddressOnChange = this.walletAddressOnChange.bind(this);
    }

    async loadTonData(){
      let new_subscriptions=[];
      const WalletAddress = localStorage.getItem("WalletAddress");
      console.log("TonSubscriptions loadTonData", WalletAddress);
      let pool_subscriber = [];
      const pool_state = await TONAPI.getState();
      let stake = 0;
      if( WalletAddress ){
        pool_subscriber = await TONAPI.getSubscriber(WalletAddress);
        console.log("TonSubscriptions loadTonData", pool_subscriber);
        for(let idx in pool_subscriber){
          let p = pool_subscriber[idx]; 
          new_subscriptions.push({
            id : parseInt(p.id),
            start_period : parseInt(p.start_period),
            end_period : parseInt(p.end_period),
            address: p.address,
            start_value: parseInt(p.start_value),
            end_value: parseInt(p.end_value),
            status: parseInt(p.status),
          })
          stake += parseInt(p.end_value);
        }
        this.setState({
          pool : pool_state,
          subscriptions : new_subscriptions,
          subscriptionsLoading: false,
          stake
        });

      }else{
        this.setState({pool : pool_state,
          subscriptionsLoading: false
        });

      }

    }

    onWalletCreated(){
      console.log("TonSubscription onWalletCreated");
      this.loadTonData();
    }

    componentDidMount(){
      this.loadTonData();
    }

    async redeemModalClose(redeem_data=null){
      this.setState({redeemVisible:false});
      console.log("redeemModalClose", redeem_data );

    }


    async stakeModalClose(stake_data){
      this.setState({stakeVisible:false});

      console.log('TonSubscription stakeModalClose', stake_data);

      this.loadTonData();
    }


    redeemSubscription(subscription_id){
      console.log("TonSubscription redeemSubscription", subscription_id);
    }

    renderTransferStatus(status){
      if(status == 1){
        return "Waiting confirmation"
      }
      if(status == 2){
        return "Done"
      }
      return "Unknown"
    }

    renderTransferActions(transactionId, status){
      return status == 1 ? 
      <span>
        <Button color="info" size="sm" onClick={()=>{this.confirmTransaction(transactionId)}}>Confirm</Button>
        <Button color="danger" size="sm" onClick={()=>{this.confirmTransaction(transactionId)}}>Reject</Button>
      </span>
      : null
    }

    renderTransfersTable(table_data){
      if(!table_data){return []}
      const result = table_data.map((x)=>([
        x.id,
        x.recepient, 
        <Gram hex={true} amount={x.value}/>, 
        this.renderTransferStatus(parseInt(x.status, 16)),
        this.renderTransferActions(x.id, parseInt(x.status, 16))
      ]))
      console.log('TonSubscription renderTransfersTable',  result);
      return result;
    }

    renderSubscriptionStatus(status){
      if(status == 1){
        return "Active";
      }
      if(status == 2){
        return "Rejected";
      }
      return "Unknown";
    }

    renderSubscriptionsTable(subscriptions_data){
      if(!subscriptions_data){return[]}
      const result= subscriptions_data.map((x)=>([
          x.id,
          <Gram amount={x.start_value} hex={false}/>,
          <Gram amount={x.end_value} hex={false}/>,
          this.renderSubscriptionStatus(x.status),
          this.renderSubscriptionActions(x.id, x.status)

      ]))
      return result;
    }

    renderSubscriptionActions(subscriptionId, status){
      return status == 1 ? 
      <span>
        <Button color="danger" size="sm" onClick={()=>this.setState({redeemVisible:true, redeemId:subscriptionId})}>Redeem</Button>
      </span>
      : null
    }

    setWalletAddress(){
      const WalletAddress = localStorage.getItem("WalletAddress");
      const {updatedWalletAddress} = this.state;
      if( updatedWalletAddress && WalletAddress != updatedWalletAddress ){
        localStorage.setItem("WalletAddress", updatedWalletAddress);
        this.loadTonData();
        this.setState({updatedWalletAddress:null})
      }

    }

    walletAddressOnChange(value){
      this.setState({updatedWalletAddress : value});

    }


    render(){
      const { classes } = this.props;
      const { balance, stake, transferVisible, receiveVisible, stakeVisible, redeemVisible,
              transfers, subscriptions, subscriptionsLoading, transfersLoading, pool, redeemId} = this.state;
      const WalletAddress = localStorage.getItem("WalletAddress");

    return(

        <div>
        <GramRedeemModal address={pool.address || ""} redeemId={redeemId} subscriptions={subscriptions} open={redeemVisible} onClose={this.redeemModalClose}/>
        <GramStakeModal address={pool.address || ""} open={stakeVisible} onClose={this.stakeModalClose}/>
        <GridContainer>
        <GridItem xs={12} sm={6} md={6} lg={3}>
          <Card>
            <CardHeader color="success" stats icon>
              <CardIcon color="success">
                <Icon>account_balance</Icon>
              </CardIcon>
              <p className={classes.cardCategory}>Your stake</p>
              <h3 className={classes.cardTitle}><Gram amount={stake}/></h3>
            </CardHeader>
            <CardFooter stats>
               <div className={classes.stats}>
                    <Button color="info" size="sm" onClick={()=>this.setState({stakeVisible:true})}>New stake</Button>
                    <Button color="info" size="sm" onClick={()=>this.setState({redeemVisible:true, redeemId:0})}>Redeem</Button>
              </div>
            </CardFooter>
          </Card>
        </GridItem>

      </GridContainer>

      <GridContainer>
        <GridItem xs={12}>
          <Card>
            <CardHeader icon>
              <h4>Wallet address</h4>
            </CardHeader>
            <CardBody>
              <h4>Wallet address</h4>
              <p style={{fontSize:16}}>{WalletAddress}</p>
              <CustomInput 
                  labelText="Your wallet"
                  id="wallet"
                  formControlProps={{
                      fullWidth: false,
                      style : {width:400}
                  }}
                  inputProps={
                      {
                          onChange:(e)=>{this.walletAddressOnChange(e.target.value)},
                          defaultValue:""
                      }
                  }
              />
              <Button color="info" size="sm" onClick={()=>this.setWalletAddress()}>Set address</Button>

            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>

      <GridContainer>
      <GridItem xs={12}>
        <Card>
          <CardHeader color="rose" icon>
            <CardIcon color="rose">
              {subscriptionsLoading ? <CircularIndeterminate /> : <Assignment />}
            </CardIcon>
            <h4 className={classes.cardIconTitle}>Subscriptions</h4>
          </CardHeader>
          <CardBody>
            <Table
              tableHeaderColor="primary"
              tableHead={["Id", "Initial amount", "Current value", "Status", "Actions"]}
              tableData={this.renderSubscriptionsTable(subscriptions)}
              coloredColls={[3]}
              colorsColls={["primary"]}
            />
          </CardBody>
        </Card>
      </GridItem>

      </GridContainer>

      </div>
    )
    }
}



export default withStyles(styles)(TonSubscriptions);