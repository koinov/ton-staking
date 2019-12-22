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

import { makeStyles } from "@material-ui/core/styles";
import styles from "assets/jss/material-dashboard-pro-react/views/dashboardStyle.js";
import Assignment from "@material-ui/icons/Assignment";
import {TonContext} from '../../toncontext';
import { withStyles } from '@material-ui/styles';

import Gram from "components/Gram";
import GramTransferModal from "components/GramModal/gramTranferModal";
import GramReceiveModal from "components/GramModal/gramReceiveModal";

import CircularIndeterminate from 'components/Loading';

import PoolContract from './../../assets/contracts/contracts/PoolContract';
import StakerContract from './../../assets/contracts/contracts/StakerContract';
import MultisigWalletContract from './../../assets/contracts/contracts/MultisigWalletContract';
import WalletManagerContract from './../../assets/contracts/contracts/WalletManagerContract';

const PoolPackage = PoolContract.package;
const StakerPackage = StakerContract.package;
const MultisigWalletPackage = MultisigWalletContract.package;
const WalletManagerPackage = WalletManagerContract.package;



class TonWallet extends Component {

    state = {
      balance : 0,
      transferVisible : false,
      receiveVisible : false,
      transfersLoading :true,
      transfers : [],
    }

    constructor(){
      super();
      this.loadTonData = this.loadTonData.bind(this);
      this.transferModalClose = this.transferModalClose.bind(this);
    }

    async isDeployed(client, address) {
      const accounts = await client.queries.accounts.query({
          addr: { AddrStd: { workchain_id: { eq: 0 }, address: { eq: address } } }
      }, `
              storage {
                  state {
                      ...on AccountStorageStateAccountActiveVariant {
                          AccountActive { split_depth } 
                      }
                  }
              }
          `);
      return (accounts.length > 0) && !!(accounts[0].storage.state.AccountActive);
  }


    async loadTonData(){
      const PublicKey = localStorage.getItem("PublicKey"); 
      const PrivateKey = localStorage.getItem("PrivateKey"); 
      const WalletAddress = localStorage.getItem("WalletAddress"); 
      let {subscriptions, transfers} = this.state;
      const ton = this.context.tonClient;
      const {contracts, queries} = ton;
      const {ownerKeys, coownerKeys, poolContract} = this.context;

      const keys = {
        secret : PrivateKey,
        public : PublicKey
      }
      console.log("TonWallet loadTonData", WalletAddress);
      
      if(!WalletAddress){
        return null;
      }
      const deployed = await contracts.load({
        address: WalletAddress,
        includeImage: true,
      });
      console.log("TonWallet deployed", deployed);

      this.setState({balance:deployed.balanceGrams});


      const isdeployed = await this.isDeployed(ton, deployed.address);
      console.log("TonWallet isDeployed", isdeployed); 

      const result2 = await contracts.runLocal({
        address: WalletAddress,
        functionName: 'transfers_counter',
        abi: MultisigWalletPackage.abi,
        input: {},
      });    
      console.log("TonWallet transfers_counter ", result2);      
      if( parseInt(result2.output.value0, 16) != transfers.length ){
        transfers=[]
        this.setState({transfersLoading: true});
        for(let i = parseInt(result2.output.value0, 16); i > 0 ; i--){
          const result3 = await contracts.runLocal({
            address: WalletAddress,
            functionName: 'transfers',
            abi: MultisigWalletPackage.abi,
            input: {transfer_id : i-1},
            keyPair: keys,
          });      
          console.log("TonWallet transfers ", i-1, result3);      
          transfers.push({...result3.output.value0, id:i-1});
          this.setState({transfers});
          
        }
      }
      this.setState({transfersLoading: false});

    }


    componentDidMount(){
      this.loadTonData();
    }


    async transferModalClose(transfer_data=null){
      this.setState({transferVisible:false});
      console.log("transferModalClose", transfer_data );
      if(transfer_data && transfer_data.address && transfer_data.amount){
        const WalletAddress = localStorage.getItem("WalletAddress");
        const ManagerAddress = localStorage.getItem("ManagerAddress");
        const PublicKey = localStorage.getItem("PublicKey"); 
        const PrivateKey = localStorage.getItem("PrivateKey"); 
        const {contracts} = this.context.tonClient;
        const walletKeys = { secret : PrivateKey, public : PublicKey}

        console.log("Begin transfer", ManagerAddress, WalletAddress, transfer_data);
        const result = await contracts.run({
          address: ManagerAddress,
          functionName: 'transferWallet',
          abi: WalletManagerPackage.abi,
          input: { wallet: "0x"+WalletAddress, recepient : "0x"+transfer_data.address, value : transfer_data.amount},
          keyPair: walletKeys,
        });
        console.log("TonWallet transfer result", result)
        this.loadTonData();
      }
    }


    async confirmTransaction(transaction_id){
        console.log('TonWallet confirmTransaction', transaction_id);
        const WalletAddress = localStorage.getItem("WalletAddress");
        const ManagerAddress = localStorage.getItem("ManagerAddress");
        const PublicKey = localStorage.getItem("PublicKey"); 
        const PrivateKey = localStorage.getItem("PrivateKey"); 
        const {contracts} = this.context.tonClient;
  
        const walletKeys = { secret : PrivateKey, public : PublicKey}
        
        const result = await contracts.run({
          address: ManagerAddress,
          functionName: 'authorizeTransfer',
          abi: WalletManagerPackage.abi,
          input: { wallet : "0x"+WalletAddress, transfer_id : transaction_id },
          keyPair: walletKeys,
        });
  
        console.log('TonWallet confirmTransaction authorizeTransfer',  result);
        this.loadTonData();
      }

      async redeemSubscription(subscription_id){
        console.log("TonWallet redeemSubscription", subscription_id);
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
      console.log('TonWallet renderTransfersTable',  result);
      return result;
    }




    render(){
      const { classes } = this.props;
      const { poolContract} = this.context;
      const { balance,  transferVisible, receiveVisible,
              transfers, transfersLoading} = this.state;
      const WalletAddress = localStorage.getItem("WalletAddress");

    return(

        <div>
        <GramTransferModal address={WalletAddress}  open={transferVisible} onClose={this.transferModalClose}/>
        <GramReceiveModal address={WalletAddress}  open={receiveVisible} onClose={()=>{this.setState({receiveVisible:false})}}/>
        <GridContainer>
        <GridItem xs={12} sm={6} md={6} lg={3}>
          <Card>
            <CardHeader color="warning" stats icon>
              <CardIcon color="warning">
                <Icon>account_balance_wallet</Icon>
              </CardIcon>
              <p className={classes.cardCategory}>Wallet</p>
              <h3 className={classes.cardTitle}>
                <Gram amount={balance}/>
              </h3>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.stats}>
                <Button color="info" size="sm" onClick={()=>this.setState({receiveVisible:true})}>Receive</Button>
                <Button color="info" size="sm" onClick={()=>this.setState({transferVisible:true})}>Transfer</Button>
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
              {transfersLoading ? <CircularIndeterminate/> : <Assignment />}
            </CardIcon>
            <h4 className={classes.cardIconTitle}>Transfer requests</h4>
          </CardHeader>
          <CardBody>
            <Table
              tableHeaderColor="primary"
              tableHead={["Id", "Recepient", "Amount", "Status", "Actions"]}
              tableData={this.renderTransfersTable(transfers)}
              coloredColls={[2]}
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

TonWallet.contextType = TonContext;



export default withStyles(styles)(TonWallet);