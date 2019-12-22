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
import Button from "components/CustomButtons/Button.js";
//import Select from "components/CustomSelect/Select.js";
import CustomInput from "components/CustomInput/CustomInput.js";
import selectstyles from "assets/jss/material-dashboard-pro-react/customSelectStyle.js";
import styles from "./modalStyle.js";
import Gram, {toNanoGrams} from "../Gram";
//const useStyles = makeStyles( {...styles,...selectstyles});
const useStyles = makeStyles( styles);
const useSelectStyles = makeStyles( selectstyles );



const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} />;
});

export default function GramTransferModal(props) {
  const [address, setAddress] = React.useState(props.address);
  const [amount, setAmount] = React.useState(props.amount || 0);
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
          <h4 className={classes.modalTitle}>Transfer grams</h4>
        </DialogTitle>
        <DialogContent
          id="modal-slide-description"
          className={classes.modalBody}
        >
            <CustomInput
                labelText="Address"
                id="address"
                formControlProps={{
                    fullWidth: true
                }}
                inputProps={
                    {
                        onChange:(e)=>{setAddress(e.target.value)},
                        defaultValue:address
                    }
                }
            />
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
                  fullWidth: false
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
               <div><small>Address : {address} </small></div>
              <div><small>Value : {toNanoGrams(amount, measure)} ng</small></div>
            </div>
        </DialogContent>
        <DialogActions
          className={classes.modalFooter + " " + classes.modalFooterCenter}
        >
          <Button onClick={() => onClose()}>Close</Button>
          <Button onClick={() => onClose({address:address, amount: toNanoGrams(amount, measure)})} color="success">Send</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}