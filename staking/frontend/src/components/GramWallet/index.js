import React, {Component} from "react";
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import withStyles from "@material-ui/core/styles/withStyles";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import Card from "components/Card/Card.js";
import CardHeader from "components/Card/CardHeader.js";
import CardIcon from "components/Card/CardIcon.js";
import CardBody from "components/Card/CardBody.js";
import CardFooter from "components/Card/CardFooter.js";
import Assignment from "@material-ui/icons/Assignment";
import Button from "components/CustomButtons/Button.js";
import {TonContext} from '../../toncontext';

import FilledInput from "@material-ui/core/FilledInput";

// core components
import CustomInput from "components/CustomInput/CustomInput.js";

import customSelectStyle from "assets/jss/material-dashboard-pro-react/customSelectStyle.js";
import styles from "assets/jss/material-dashboard-pro-react/views/dashboardStyle.js";


import MultisigWalletContract from './../../assets/contracts/contracts/MultisigWalletContract';
import WalletManagerContract from './../../assets/contracts/contracts/WalletManagerContract';

const MultisigWalletPackage = MultisigWalletContract.package;
const WalletManagerPackage = WalletManagerContract.package; 

const style = {
  infoText: {
    fontWeight: "300",
    margin: "10px 0 30px",
    textAlign: "center"
  },
  ...customSelectStyle, ...styles
};

class CreateWallet extends Component{
    state = {
        k:2,
        n:3,
        inputManagers:{},
        publickeys:[]
    }
    constructor(props){
        super();
        this.renderManagers = this.renderManagers.bind(this);
        this.handleInputManager = this.handleInputManager.bind(this);
        this.checkInput = this.checkInput.bind(this);
        this.deployMultisig = this.deployMultisig.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.state.inputManagers = {"manager0":props.address};
    }

    componentDidMount(){
        /*
        const manager0=this.props.address;
        this.setState({inputManagers:{
            manager0 : manager0
            }

        })*/
    }

    async deployMultisig(){
        const {k, n, publickeys} = this.state;
        
        console.log("GramWallet deployMultisig");

        const PublicKey = localStorage.getItem("PublicKey"); 
        const PrivateKey = localStorage.getItem("PrivateKey"); 
        const ManagerAddress = localStorage.getItem("ManagerAddress"); 
        const {giver} = this.context;
        const ton = this.context.tonClient;
        const {contracts} = ton;
  
        const keys = { secret : PrivateKey, public : PublicKey}

        const coowners = publickeys.map((x)=>(`0x${x}`));


        const deployMessage = await contracts.createDeployMessage({
            package: MultisigWalletPackage,
            constructorParams: {k : k, n : n, coowners : coowners},
            keyPair: keys,
        });

        const deployedContract = await contracts.load({
            address : deployMessage.address,
            includeImage : false
        });

        let deployedAddress = null

        if( deployedContract.id == null ){
            console.log("GramWallet deployMultisig Deploy new wallet");
            await giver(ton, deployMessage.address);

            const deployed = await contracts.deploy({
                package: MultisigWalletPackage,
                constructorParams: {k : k, n : n, coowners : coowners},
                keyPair: keys,
            });
            deployedAddress = deployed.address;


        }else{
            console.log("GramWallet deployMultisig : Use already deployed wallet");
            deployedAddress = deployMessage.address;
        }


        localStorage.setItem("WalletAddress", deployedAddress.slice(-64));
        /*
        const result0 = await contracts.run({
            address: ManagerAddress,
            functionName: 'initializeWallet',
            abi: WalletManagerPackage.abi,
            input: {
                wallet : `0x${deployedAddress}`,
                k : k,
                n : n
            },
            keyPair: keys,
        });
        console.log("GramWallet deployMultisig initialize", result0, ManagerAddress, k, n);

        for( let i = 1; i < n ; i++){
            const result1 = await contracts.run({
                address: ManagerAddress,
                functionName: 'authorizeCoowner',
                abi: WalletManagerPackage.abi,
                input: {
                    wallet : `0x${deployedAddress}`,
                    coowner : `0x${publickeys[i]}`
                },
                keyPair: keys,
            });
            console.log("GramWallet deployMultisig authorize owner ", result1);
        }*/
        if(this.props.onClose){
            this.props.onClose();
        }

    }

    onCancel(){
        if(this.props.onClose){
            this.props.onClose();
        }
    }

    checkInput(){
        const {inputManagers} = this.state;
        let publickeys = [];
        const keynames = this.props.keys.map((x)=>(x.name));
        console.log("CheckInput", this.state, this.props);
        for( let i = 0 ; i < this.state.n; i++){
            const cm=inputManagers["manager"+i.toString()];
            if( !cm ){
                publickeys.push(null);
            }else if(cm.length == 64){
                publickeys.push(cm);
            } else if( keynames.indexOf(cm) != -1 ){
                publickeys.push(this.props.keys[keynames.indexOf(cm)].address )
            }else{
                publickeys.push(null);
            }
        }
        this.setState({publickeys})
    }

    handleInputManager = event => {
        let {inputManagers} = this.state;
        inputManagers[event.target.name] = event.target.value;
        this.setState({ inputManagers });
        this.checkInput()
    };
    

    renderManagers(){
        console.log("GramWallet render", this.state, this.props);
        const {n, publickeys} = this.state;
        let ret = []
        for(let i = 0; i < n ; i++){
            ret.push(
                <GridContainer key={`manager-input-${i.toString()}`}>
                <GridItem xs={12} sm={6} md={6} lg={6}>
                <CustomInput
                  labelText={`Manager ${(i+1).toString()}`} 
                  id={`manager${i.toString()}`}
                  formControlProps={{
                    fullWidth: true,
                  }}
                  inputProps={{
                    name:`manager${i.toString()}`,
                    defaultValue : this.state.inputManagers[`manager${i.toString()}`] ,
                    disabled : i == 0,
                    onChange : this.handleInputManager
                }}
                />
                </GridItem>
                <GridItem xs={12} sm={6} md={6} lg={6}>
                    {publickeys[i]}
                </GridItem>
                </GridContainer>
            )
        }
        return ret;
    }

    render(){
        const { classes } = this.props;

        return(
            <div>
                <GridContainer>
                <GridItem xs={12} sm={12} md={12} lg={12}>
                <Card>
                <CardHeader color="rose" icon>
                    <CardIcon color="rose">
                    <Assignment />
                    </CardIcon>
                    <h4 className={classes.cardIconTitle}>Create wallet</h4>
                </CardHeader>
                <CardBody>
                <GridContainer>
                <GridItem xs={6} sm={3} md={2} lg={1}>
                    <FormControl fullWidth className={classes.selectFormControl}>
                        <InputLabel htmlFor="k-select" className={classes.selectLabel}>
                        Choose K
                        </InputLabel>
                        <Select
                        MenuProps={{
                            className: classes.selectMenu
                        }}
                        classes={{
                            select: classes.select
                        }}
                        value={this.state.k}
                        onChange={(e)=>{this.setState({k:e.target.value})  } }
                        inputProps={{
                            name: "kSelect",
                            id: "k-select"
                        }}
                        >
                        <MenuItem
                            disabled
                            classes={{
                            root: classes.selectMenuItem
                            }}
                        >
                            1
                        </MenuItem>
                        <MenuItem
                            classes={{
                            root: classes.selectMenuItem,
                            selected: classes.selectMenuItemSelected
                            }}
                            value="2"
                        >
                            2
                        </MenuItem>
                        <MenuItem
                            classes={{
                            root: classes.selectMenuItem,
                            selected: classes.selectMenuItemSelected
                            }}
                            value="3"
                        >
                            3
                        </MenuItem>
                        </Select>
                    </FormControl>   
                    </GridItem>
                    <GridItem xs={6} sm={3} md={2} lg={1}>
                    <FormControl fullWidth className={classes.selectFormControl}>
                        <InputLabel htmlFor="n-select" className={classes.selectLabel}>
                        Choose N
                        </InputLabel>
                        <Select
                        MenuProps={{
                            className: classes.selectMenu
                        }}
                        classes={{
                            select: classes.select
                        }}
                        value={this.state.n}
                        onChange={(e)=>{this.setState({n:e.target.value})  } }
                        inputProps={{
                            name: "kSelect",
                            id: "n-select"
                        }}
                        >
                        <MenuItem
                            disabled
                            classes={{
                            root: classes.selectMenuItem
                            }}
                        >
                            1
                        </MenuItem>
                        <MenuItem
                            classes={{
                            root: classes.selectMenuItem,
                            selected: classes.selectMenuItemSelected
                            }}
                            value="2"
                        >
                            2
                        </MenuItem>
                        <MenuItem
                            classes={{
                            root: classes.selectMenuItem,
                            selected: classes.selectMenuItemSelected
                            }}
                            value="3"
                        >
                            3
                        </MenuItem>
                        <MenuItem
                            classes={{
                            root: classes.selectMenuItem,
                            selected: classes.selectMenuItemSelected
                            }}
                            value="4"
                        >
                            4
                        </MenuItem>
                        <MenuItem
                            classes={{
                            root: classes.selectMenuItem,
                            selected: classes.selectMenuItemSelected
                            }}
                            value="5"
                        >
                            5
                        </MenuItem>
                        </Select>
                    </FormControl>                      
                </GridItem>
                </GridContainer>
                {this.renderManagers()}
                <GridContainer>
                    <GridItem xs={12} sm={6} md={6} lg={3}>
                        <Button onClick={this.onCancel}>Cancel</Button>
                        <Button color="info" onClick={this.deployMultisig}>Create Wallet</Button>
                    </GridItem>
                </GridContainer>
                </CardBody>
                </Card>
                </GridItem>
                </GridContainer>
                </div>
        )
    }
}

CreateWallet.contextType = TonContext;


export default withStyles(style)(CreateWallet);
