import React from "react";
import { createPortal } from "react-dom";
import withStyles from "@mui/styles/withStyles";
import propTypes from "prop-types";

import { IconButton, Paper, Tooltip } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

import Dialog from "../components/Dialog.js";

const styles = (theme) => {
  return {
    paper: {
      marginBottom: theme.spacing(1),
    },
    button: {
      minWidth: "unset",
    },
  };
};

class Information extends React.PureComponent {
  static propTypes = {
    classes: propTypes.object.isRequired,
    options: propTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.type = "Information"; // Special case - plugins that don't use BaseWindowPlugin must specify .type here
    this.options = props.options;
    this.title = this.options.title || "Om kartan";
    this.state = {
      dialogOpen: false,
    };
  }

  componentDidMount() {
    let dialogOpen = this.options.visibleAtStart;

    if (this.options.visibleAtStart === true) {
      if (
        this.options.showInfoOnce === true &&
        parseInt(
          window.localStorage.getItem("pluginInformationMessageShown")
        ) === 1
      ) {
        dialogOpen = false;
      } else {
        if (this.options.showInfoOnce === true) {
          window.localStorage.setItem("pluginInformationMessageShown", 1);
        }
        dialogOpen = true;
      }
    } else {
      dialogOpen = false;
    }

    this.setState({
      dialogOpen,
    });
  }

  onClose = () => {
    this.setState({
      dialogOpen: false,
    });
  };

  handleOnClick = () => {
    this.setState({
      dialogOpen: true,
    });
  };

  renderDialog() {
    const { headerText, text, buttonText } = this.props.options;

    return createPortal(
      <Dialog
        options={{ headerText, text, buttonText }}
        open={this.state.dialogOpen}
        onClose={this.onClose}
      />,
      document.getElementById("windows-container")
    );
  }

  render() {
    const { classes } = this.props;
    return (
      <>
        {this.renderDialog()}
        <Tooltip disableInteractive title={this.title}>
          <Paper className={classes.paper}>
            <IconButton
              aria-label={this.title}
              className={classes.button}
              onClick={this.handleOnClick}
            >
              <InfoIcon />
            </IconButton>
          </Paper>
        </Tooltip>
      </>
    );
  }
}

export default withStyles(styles)(Information);
