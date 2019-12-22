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
import selectstyles from "assets/jss/material-dashboard-react/customSelectStyle.js";
import styles from "./modalStyle.js";
import Gram, { toNanoGrams } from "../Gram";
import QRCode from "react-qr-code";
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";

//const useStyles = makeStyles( {...styles,...selectstyles});
const useStyles = makeStyles(styles);
const useSelectStyles = makeStyles(selectstyles);



const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} />;
});

export default function GramRedeemModal(props) {
  const [subscriptionId, setSubscriptionId] = React.useState(props.redeemId || null);
  console.log("GramRedeemModal", props.redeemId, subscriptionId);

  if( !subscriptionId  && typeof props.redeemId !== "undefined" && props.redeemId != 0){
    console.log("GramRedeemModal2", props.redeemId, subscriptionId);
    setSubscriptionId(props.redeemId);
  }

  const onClose = (subscription_data = null) => {
    console.log("GramTransferModal onClose")
    if (props.onClose) {
      props.onClose(subscription_data);
    }
  }
  const { subscriptions } = props;

  const renderSubscriptioOptions = (subscriptions) => {
    return subscriptions.map((x) => (
      <MenuItem key={x.id} value={x.id.toString()} classes={{
        root: selectclasses.selectMenuItem,
        //selected: selectclasses.selectMenuItemSelected
      }}>{x.id.toString()} : <Gram amount={x.end_value} hex={false} /></MenuItem>))
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
              <FormControl className={selectclasses.selectFormControl} style={{ width: 300 }}>
                <InputLabel
                  htmlFor="measure-select"
                  className={classes.labelRoot + " " + classes.inputLabel}
                >
                  Subscriptions
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
                  value={subscriptionId}
                  onChange={(e) => { setSubscriptionId(e.target.value) }}
                  inputProps={{
                    name: 'measure',
                    id: 'measure-select',
                  }}
                >
                  {renderSubscriptioOptions(props.subscriptions)}
                </Select>
              </FormControl>
              <div>
                <div><small>Value : {subscriptions && subscriptions[subscriptionId] ? toNanoGrams(subscriptions[subscriptionId].amount, "ng") : 0} ng</small></div>
              </div>
            </GridItem>
            <GridItem xs={12} sm={4} md={4} lg={4}>
              <div style={{ margin: 10 }}>
                {subscriptionId && props.address ? <QRCode size={128} level={'L'} value={"ton://transfer/" + props.address + "?amount=" + toNanoGrams(0.1, "gr") + "&text=R" + subscriptionId.toString()} /> : null}
              </div>
            </GridItem>
            <GridContainer>
              {subscriptionId ? <GridItem xs={12} sm={12} md={12} lg={12}>
                <p style={{ fontSize: 12 }}>Please send 0.1 gramm to the following address:</p>
                <p style={{ fontSize: 16, fontWeight: 400 }}>{props.address}</p>
                <p style={{ fontSize: 12 }}>With the following comment:</p>
                <p style={{ fontSize: 16, fontWeight: 400 }}>R{subscriptionId}</p>
              </GridItem> : null}
            </GridContainer>


          </GridContainer>

        </DialogContent>
        <DialogActions
          className={classes.modalFooter + " " + classes.modalFooterCenter}
        >
          <Button onClick={() => onClose()}>Close</Button>
          <Button onClick={() => onClose({ subscription_id: parseInt(subscriptionId) })} color="success">Redeem</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}