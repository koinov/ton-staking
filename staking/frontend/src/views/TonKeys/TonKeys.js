import React, {Component} from "react";
import WalletWizardView from "../Forms/WalletWizard.js"
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
import GramStakeModal from "components/GramModal/gramStakeModal";
import GramRedeemModal from "components/GramModal/gramRedeemModal";
import GramWallet from "components/GramWallet";
//const useStyles = makeStyles(styles);
//const classes = useStyles();
//const classes = styles;
import CircularIndeterminate from 'components/Loading';



class TonWallet extends Component {

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
      keys : [],
      managers : {},
      wallets : [],
      newKey : false,
      newWallet : false
    }

    constructor(){
      super();
      this.loadTonData = this.loadTonData.bind(this);
      this.loadTonManagerData = this.loadTonManagerData.bind(this);
      this.onWalletCreated = this.onWalletCreated.bind(this);
      this.onKeyCreated = this.onKeyCreated.bind(this);
      this.useKeys = this.useKeys.bind(this);
      this.useWallet = this.useWallet.bind(this);
      this.confirmWallet = this.confirmWallet.bind(this);
    }

    async loadTonManagerData(managerAddress){
      const PublicKey = localStorage.getItem("PublicKey"); 
      const PrivateKey = localStorage.getItem("PrivateKey"); 
      const {ownerKeys, coownerKeys, poolContract} = this.context;
      
      const {contracts, queries} = this.context.tonClient;
      const keys = {
        secret : PrivateKey,
        public : PublicKey
      }
     
      let {managers} = this.state;

      managers[managerAddress] = {}

      console.log("TonWallet loadTonManagerData", managerAddress);

      const result0 = await contracts.runLocal({
        address: managerAddress,
        functionName: 'authorizationWalletRequestCounter',
        abi: WalletManagerPackage.abi,
        input: {
        },
        keyPair: keys,
      });
      console.log("TonWallet authorizationWalletRequestCounter ", result0);

      const result1 = await contracts.runLocal({
        address: managerAddress,
        functionName: 'walletsCounter',
        abi: WalletManagerPackage.abi,
        input: {
        },
        keyPair: keys,
      });
      console.log("TonWallet subscriptions_counter ", result1.output.value);


      managers[managerAddress]["requestsCounter"] = parseInt(result0.output.value0, 16);
      managers[managerAddress]["walletsCounter"] = parseInt(result1.output.value0, 16);
      this.setState(managers);

    }

    async loadTonData(){
      console.log("TonWallet loadTonData", this);
      const PublicKey = localStorage.getItem("PublicKey"); 
      const PrivateKey = localStorage.getItem("PrivateKey"); 
      const WalletAddress = localStorage.getItem("WalletAddress"); 
      const ManagerAddress = localStorage.getItem("ManagerAddress"); 
      let {subscriptions, transfers} = this.state;

      const {ownerKeys, coownerKeys, poolContract} = this.context;

      const keys = {
        secret : PrivateKey,
        public : PublicKey
      }
      
      const {contracts, queries} = this.context.tonClient;
      if(!WalletAddress){
        return null;
      }
      const deployed = await contracts.load({
        address: WalletAddress,
        includeImage: false,
      });

      this.setState({balance:deployed.balanceGrams});
      
      const result0 = await contracts.runLocal({
        address: ManagerAddress,
        functionName: 'walletsCounter',
        abi: WalletManagerPackage.abi,
        input: {},
        keyPair: keys,
      });
      console.log("TonKeys walletsCounter ", result0, ManagerAddress);

      let wallets=[]

      for(let i = parseInt(result0.output.value0,16); i > 0 ; i--){
        let result2 = await contracts.runLocal({
          address: ManagerAddress,
          functionName: 'wallet',
          abi: WalletManagerPackage.abi,
          input: {
              wallet_id : i-1
          },
          keyPair: keys, 
        });
        console.log("TonWallet wallet", result2 );
        wallets.push({address: result2.output.value0.slice(-64), state: 2});
        this.setState({wallets});
      }

      const result3 = await contracts.runLocal({
        address: ManagerAddress,
        functionName: 'authorizationWalletRequestCounter',
        abi: WalletManagerPackage.abi,
        input: {},
        keyPair: keys,
      });
      console.log("TonKeys authorizationWalletRequestCounter ", result3, ManagerAddress);

      for(let i = parseInt(result3.output.value0,16); i > 0 ; i--){
        let result4 = await contracts.runLocal({
          address: ManagerAddress,
          functionName: 'authorizationWalletRequest',
          abi: WalletManagerPackage.abi,
          input: {
              request_id : i-1
          },
          keyPair: keys, 
        });
        console.log("TonWallet authorizationWalletRequest", result4 );
        wallets.push({address: result4.output.value0.slice(-64), state: 1, request_id : i-1});
        this.setState({wallets});
      }



      this.setState({wallets});

    }



    onKeyCreated(){
      console.log("TonWallet onKeyCreated");
      const KeysItem = localStorage.getItem("Keys");
      if(KeysItem){
        this.setState({keys: JSON.parse(KeysItem), newKey : false});
      }
      this.loadTonData();
    }

    onWalletCreated(){
      console.log("TonWallet onWalletCreated");
      this.setState({ newWallet : false});
      this.loadTonData();
    }

    componentDidMount(){
      const KeysItem = localStorage.getItem("Keys");
      if( KeysItem ){
        const keys = JSON.parse(KeysItem)
        if(KeysItem){
          this.setState({keys});
        }
        for(let x of Object.keys(keys)){
          this.loadTonManagerData(keys[x].address);
        };
      }
      this.loadTonData();
    }



    useKeys(keys){
      console.log("TonKeys useKeys", keys);
      localStorage.setItem("PrivateKey", keys.secret);
      localStorage.setItem("PublicKey", keys.public);
      localStorage.setItem("ManagerAddress", keys.address);
      this.loadTonData();
    }

    useWallet(wallet){
      console.log("TonKeys useWallet", wallet);
      localStorage.setItem("WalletAddress", wallet);
      this.loadTonData();
    }

    async confirmWallet(request_id){
      console.log("TonKeys confirmWallet", request_id, this.state, this.props);
      const PublicKey = localStorage.getItem("PublicKey"); 
      const PrivateKey = localStorage.getItem("PrivateKey"); 
      const WalletAddress = localStorage.getItem("WalletAddress"); 
      const ManagerAddress = localStorage.getItem("ManagerAddress"); 
      let {subscriptions, transfers} = this.state;

      const {ownerKeys, coownerKeys, poolContract} = this.context;

      const keys = {
        secret : PrivateKey,
        public : PublicKey
      }
      
      const {contracts, queries} = this.context.tonClient;
      const result0 = await contracts.run({
        address: ManagerAddress,
        functionName: 'authorizeWalletRequestConfirm',
        abi: WalletManagerPackage.abi,
        input: {request_id : request_id},
        keyPair: keys,
      });
      console.log("authorizeWalletRequestConfirm ", result0, ManagerAddress);
      this.loadTonData();

    }

    renderKeysTable(){
      const {managers} = this.state;
      const {keys}=this.state;
      console.log("TonKeys renderKeysTable", keys);
      if(!keys){return []}
      return keys.map((x)=>([keys.indexOf(x), x.name, x.address, 
        managers[x.address] ? managers[x.address].walletsCounter || 0 : 0, 
        managers[x.address] ? managers[x.address].requestsCounter || 0 : 0,  
        <Button onClick={()=>{this.useKeys(x)}}>Use</Button>]))
    }

    renderWalletActions(wallet){
      if(wallet.state == 2){
        return(<Button onClick={()=>{this.useWallet(wallet.address)}}>Use</Button>)
      }
      if(wallet.state == 1){
        return(<Button onClick={()=>{this.confirmWallet(wallet.request_id)}}>Confirm</Button>)
      }
      return null;
    }

    renderWalletsTable(){
      const {wallets} = this.state;
      console.log("TonKeys renderWalletsTable", wallets);
      if(!wallets){return []}
      return wallets.map((x)=>([wallets.indexOf(x), x.address, this.renderWalletActions(x)]))
    }


    render(){
      const { classes } = this.props;
      const { poolContract} = this.context;
      const { newWallet, newKey} = this.state;
      const WalletAddress = localStorage.getItem("WalletAddress");
      const ManagerAddress = localStorage.getItem("ManagerAddress");

    return(

        <div>
        { newWallet ? <GramWallet address={ManagerAddress} keys={this.state.keys} onClose={this.onWalletCreated}/> : null }
        { newKey ? 
        <GridContainer>
          <GridItem xs={12} sm={6} md={6} lg={12}>

          <WalletWizardView onCreate={this.onKeyCreated}/>
          </GridItem>
        </GridContainer> : null}

        { !newKey & !newWallet ? <GridContainer>
          <GridItem xs={12}>
            <Card>
              <CardHeader color="rose" icon>
                <CardIcon color="rose">
                  <Assignment/>
                </CardIcon>
                <h4 className={classes.cardIconTitle}>Keys</h4>
                <GridContainer>
                  <GridItem xs={12} sm={6} md={6} lg={3}>
                  </GridItem>
                  <GridItem xs={12} sm={6} md={6} lg={3}>
                    <Button color="info" size="sm" onClick={()=>{this.setState({newKey : true}); }}>New Key</Button>
                    <Button color="info" size="sm" onClick={()=>{localStorage.setItem("Keys", JSON.stringify([]));this.setState({keys:[]}); }}>Delete all</Button>
                  </GridItem>
                </GridContainer>
              </CardHeader>
              <CardBody>
                <Table
                  tableHeaderColor="primary"
                  tableHead={["Id", "Name", "Address", "Wallets", "Requests","Actions"]}
                  tableData={this.renderKeysTable()}
                  coloredColls={[2]}
                  colorsColls={["primary"]}
                />
              </CardBody>
            </Card>
          </GridItem>

        </GridContainer> : null}

        { !newKey & !newWallet ? <GridContainer>
          <GridItem xs={12}>
            <Card>
              <CardHeader color="rose" icon>
                <CardIcon color="rose">
                  <Assignment />
                </CardIcon>
                <h4 className={classes.cardIconTitle}>Wallets</h4>
                <GridContainer>
                  <GridItem xs={12} sm={6} md={6} lg={3}>
                  </GridItem>
                  <GridItem xs={12} sm={6} md={6} lg={3}>
                    <Button color="info" size="sm" onClick={()=>{this.setState({newWallet : true}); }}>New Wallet</Button>
                  </GridItem>
                </GridContainer>
              </CardHeader>
              <CardBody>
                <Table
                  tableHeaderColor="primary"
                  tableHead={["Id", "Address"]}
                  tableData={this.renderWalletsTable()}
                  //coloredColls={[2]}
                  //colorsColls={["primary"]}
                />
              </CardBody>
            </Card>
          </GridItem>

        </GridContainer> : null}

      </div>
    )
    }
}

TonWallet.contextType = TonContext;



export default withStyles(styles)(TonWallet);