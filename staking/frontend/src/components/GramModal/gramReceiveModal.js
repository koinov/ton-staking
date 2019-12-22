import React from 'react';
// material-ui components
import { makeStyles } from "@material-ui/core/styles";
import Slide from "@material-ui/core/Slide";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
// @material-ui/icons
import Close from "@material-ui/icons/Close";
// core components
import Button from "components/CustomButtons/Button.js";
import CustomInput from "components/CustomInput/CustomInput.js";

import styles from "./modalStyle.js";
import Gram from "../Gram";
const useStyles = makeStyles(styles);



const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} />;
});

export default function GramReceiveModal(props) {
  const {address}=props;
  const onClose = (transfer_data=null)=>{
      console.log("GramReceiveModal onClose")
      if(props.onClose){
          props.onClose();
      }
  }

  const classes = useStyles();
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
          <h4 className={classes.modalTitle}>Receive grams</h4>
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
                        defaultValue:address,
                        disabled : true
                    }
                }
            />
            <div>
               <div><small>Address : {address} </small></div>
            </div>
        </DialogContent>
        <DialogActions
          className={classes.modalFooter + " " + classes.modalFooterCenter}
        >
          <Button onClick={() => onClose()}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}