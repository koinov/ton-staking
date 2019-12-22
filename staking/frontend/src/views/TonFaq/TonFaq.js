import React from "react";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardHeader from "components/Card/CardHeader.js";
import CardBody from "components/Card/CardBody.js";
import Accordion from "components/Accordion/Accordion.js";


import {cardTitle} from "assets/jss/material-dashboard-react.js";



const styles = {
  cardTitle,
  pageSubcategoriesTitle: {
    color: "#3C4858",
    textDecoration: "none",
    textAlign: "center"
  },
  cardCategory: {
    margin: "0",
    color: "#999999"
  }
};

const useStyles = makeStyles(styles);

export default function TonFaq() {
  const classes = useStyles();
  return (
    <div>
      <GridContainer>
        <GridItem xs={12} sm={12} md={12} lg={12}>
        <Card>
            <CardHeader>
              <h4 className={classes.cardTitle}>FAQ</h4>
            </CardHeader>
            <CardBody>
              <Accordion
                active={0}
                collapses={[
                  {
                    title: "Problematics",
                    content:
                      "Telegram Open Network (TON) consensus is based on Byzantine Fault Tolerant Proof of Stake that involves sending certain amount of grams to take part in validators elections. Election result depends on size of stake and there’s also the minimum amount of grams required. Running the validation node requires technical skills and extra hosting costs."
                  },
                  {
                    title: "Solution",
                    content:
                      <div>
                        <p>
                      Pool of nominators, who want to take a part in validation process by providing Grams to validators made as Decentralized Application (DAPP) autonomously operated by persons who do not actually have access to Grams except the predefined share in validators reward. 
                        </p>
                        <p>
                      The aim of the pool is to achieve the maximum of the function ( (R1-C1) +.. + (Rn - Cn) ) / G  in every validation period where: 
                        </p>
                      <ul>
                      <li>G - total amount of Grams operated by the pool</li>
                      <li>Rn - is reward of n-node in a certain period</li>
                      <li>Cn - cost of running n-node in a certain period</li>
                      </ul>
                      </div>
                  },
                  {
                    title: "Assumptions",
                    content:
                      <div>
                        <p>
                        We do not consider this as any kind of mutual investment facility but technical solution that improves quality of TON network by running additional validators and providing Grams in return. Reward in Grams in this case should not be considered as any kind of speculative instrument but a required option for running other DAPPs developed by participants. 
                        </p>
                        <p>
                        For example, if person is running DAPP based on smart contract it is required to have Gram balance on it to perform certain operations, so getting reward from the pool allows putting Grams to such smart contract.  
                        </p>
                      </div>
                  }
                ]}
              />
            </CardBody>
          </Card>
        </GridItem>

    </GridContainer>
      <br />
    </div>
  );
}
