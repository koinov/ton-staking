import React from 'react';
// material-ui components
import { makeStyles } from "@material-ui/core/styles";
import Slide from "@material-ui/core/Slide";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
// @material-ui/icons
import Close from "@material-ui/icons/Close";
// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";

import Button from "components/CustomButtons/Button.js";
//import Select from "components/CustomSelect/Select.js";
import CustomInput from "components/CustomInput/CustomInput.js";
import selectstyles from "assets/jss/material-dashboard-react/customSelectStyle.js";
import styles from "./modalStyle.js";
import Gram, {toNanoGrams} from "../Gram";
import QRCode from "react-qr-code";


//const useStyles = makeStyles( {...styles,...selectstyles});
const useStyles = makeStyles( styles);
const useSelectStyles = makeStyles( selectstyles );



const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} />;
});

export default function GramStakeModal(props) {
  const [amount, setAmount] = React.useState(props.amount || 10);
  const [measure, setMeasure] = React.useState(props.measure || "gr");
  const onClose = (transfer_data=null)=>{
      console.log("GramTransferModal onClose")
      if(props.onClose){
          props.onClose(transfer_data);
      }
  }

  const classes = useStyles();
  const selectclasses = useSelectStyles();
  return (
    <div>
      <Dialog
        fullWidth={true}
        maxWidth={"lg"}
        classes={{
          root: classes.center,
          paper: classes.modal
        }}
        open={props.open}
        transition={Transition}
        keepMounted
        onClose={() => onClose()}
        aria-labelledby="modal-slide-title"
        aria-describedby="modal-slide-description"
      >
        <DialogTitle
          id="classic-modal-slide-title"
          disableTypography
          className={classes.modalHeader}
        >
          <Button
            justIcon
            className={classes.modalCloseButton}
            key="close"
            aria-label="Close"
            color="transparent"
            onClick={() => onClose()}
          >
            <Close className={classes.modalClose} />
          </Button>
          <h4 className={classes.modalTitle}>Stake grams</h4>
        </DialogTitle>
        <DialogContent
          id="modal-slide-description"
          className={classes.modalBody}
        >
          <GridContainer>
            <GridItem xs={12} sm={8} md={8} lg={8}>

              <CustomInput
                  labelText="Amount"
                  id="amount"
                  formControlProps={{
                      fullWidth: false
                  }}
                  inputProps={
                      {
                          onChange:(e)=>{setAmount(e.target.value)},
                          defaultValue:amount
                      }
                  }
              />
              <FormControl className={selectclasses.selectFormControl} style={{width:100}}>
              <InputLabel
              htmlFor="measure-select"
              className={classes.labelRoot + " " + classes.inputLabel}
              >
                Units
              </InputLabel>
              <Select
                  MenuProps={{
                    className: selectclasses.selectMenu
                  }}
                  classes={{
                    select: selectclasses.select
                  }}
                  formControlProps={{
                    fullWidth: false,
                    style : {marginTop:23}
                  }}
                  value={measure}
                  onChange={(e)=>{setMeasure(e.target.value)}}
                  inputProps={{
                    name: 'measure',
                    id: 'measure-select',
                  }}
                >
                  <MenuItem value="gr" classes={{
                  root: selectclasses.selectMenuItem,
                  //selected: selectclasses.selectMenuItemSelected
                  }}>Grams</MenuItem>
                  <MenuItem value="mg" classes={{
                  root: selectclasses.selectMenuItem,
                  //selected: selectclasses.selectMenuItemSelected
                  }}>Milligrams</MenuItem>
                  <MenuItem value="ng" classes={{
                  root: selectclasses.selectMenuItem,
                  //selected: selectclasses.selectMenuItemSelected
                  }}>Nanograms</MenuItem>
                </Select>
                </FormControl>
              <div>
                <div><small>Value : {toNanoGrams(amount, measure)} ng</small></div>
              </div>
              </GridItem>
              <GridItem xs={12} sm={4} md={4} lg={4}>
                <div style={{margin:10}}> 
                  { props.address ? <QRCode size={128} level={'L'} value={"ton://transfer/"+props.address+"?amount="+toNanoGrams(amount, measure)} /> : null}
                </div>

              </GridItem>
            </GridContainer>
            <GridContainer>
              <GridItem xs={12} sm={12} md={12} lg={12}>
                  <p style={{fontSize:12}}>Please send amount of grams you want to stake to the following address:</p>
                  <p style={{fontSize:16, fontWeight: 400 }} >{props.address}</p>
              </GridItem>
            </GridContainer>
        </DialogContent>
        <DialogActions
          className={classes.modalFooter + " " + classes.modalFooterCenter}
        >
          <Button onClick={() => onClose()}>Close</Button>
          <Button onClick={() => onClose({amount: toNanoGrams(amount, measure)})} color="success">Send</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}