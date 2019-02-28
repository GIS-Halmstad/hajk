import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { IconButton } from "@material-ui/core";
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import SatelliteIcon from "@material-ui/icons/Satellite";
import Typography from "@material-ui/core/Typography";
import Window from "../../components/Window.js";
import InformativeView from "./InformativeView.js";
import InformativeModel from "./InformativeModel.js";
import Observer from "react-event-observer";
import { isMobile } from "../../utils/IsMobile.js";

const styles = theme => {
  return {
    button: {
      width: "50px",
      height: "50px",
      marginRight: "30px",
      outline: "none",
      background: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      "&:hover": {
        background: theme.palette.primary.main
      }
    },
    card: {
      cursor: "pointer",
      width: "180px",
      borderRadius: "4px",
      background: "white",
      padding: "10px 20px",
      marginBottom: "10px",
      display: "flex",
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      boxShadow:
        "0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)",
      "&:hover": {
        background: "#e9e9e9"
      },
      [theme.breakpoints.down("md")]: {
        margin: "5px",
        width: "auto",
        justifyContent: "inherit"
      }
    },
    title: {
      fontSize: "10pt",
      fontWeight: "bold",
      marginBottom: "5px"
    },
    text: {}
  };
};

class Informative extends React.PureComponent {
  state = {
    panelOpen: this.props.options.visibleAtStart
  };

  onClick = e => {
    this.app.onPanelOpen(this);
    this.setState({
      panelOpen: true
    });
  };

  open = chapter => {
    this.app.onPanelOpen(this);
    this.setState(
      {
        panelOpen: true
      },
      () => {
        this.observer.publish("changeChapter", chapter);
      }
    );
  };

  closePanel = () => {
    this.setState({
      panelOpen: false
    });
  };

  constructor(spec) {
    super(spec);
    this.type = "informative";
    this.options = spec.options;
    this.title = this.options.title || "Översiktsplan";
    this.abstract =
      this.options.abstract || "Läs mer om vad som planeras i kommunen";
    this.caption = this.options.caption || "Titel";
    this.html = this.options.html || "<div>Html</div>";
    this.position = spec.options.panel ? spec.options.panel : undefined;
    this.app = spec.app;
    this.observer = Observer();
    this.informativeModel = new InformativeModel({
      map: spec.map,
      app: spec.app,
      observer: this.observer,
      url: spec.options.serviceUrl + "/" + spec.options.document
    });
    this.app.registerPanel(this);
  }

  renderWindow(mode) {
    var left = this.position === "right" ? (window.innerWidth - 410) / 2 : 5;
    return createPortal(
      <Window
        globalObserver={this.props.app.globalObserver}
        title={this.title}
        onClose={this.closePanel}
        open={this.state.panelOpen}
        position={this.position}
        height="auto"
        width={400}
        top={210}
        left={left}
        mode={mode}
      >
        <InformativeView
          app={this.app}
          map={this.map}
          parent={this}
          observer={this.observer}
          caption={this.caption}
          abstract={this.html}
        />
      </Window>,
      document.getElementById(isMobile ? "app" : "toolbar-panel")
    );
  }

  renderAsWidgetItem() {
    const { classes } = this.props;
    return (
      <>
        <div className={classes.card} onClick={this.onClick}>
          <div>
            <IconButton className={classes.button}>
              <SatelliteIcon />
            </IconButton>
          </div>
          <div>
            <Typography className={classes.title}>{this.title}</Typography>
            <Typography className={classes.text}>{this.abstract}</Typography>
          </div>
        </div>
        {this.renderWindow("window")}
      </>
    );
  }

  renderAsToolbarItem() {
    return (
      <div>
        <ListItem
          button
          divider={true}
          selected={this.state.panelOpen}
          onClick={this.onClick}
        >
          <ListItemIcon>
            <SatelliteIcon />
          </ListItemIcon>
          <ListItemText primary={this.title} />
        </ListItem>
        {this.renderWindow("panel")}
      </div>
    );
  }

  render() {
    if (this.props.type === "toolbarItem") {
      return this.renderAsToolbarItem();
    }

    if (this.props.type === "widgetItem") {
      return this.renderAsWidgetItem();
    }

    return null;
  }
}

export default withStyles(styles)(Informative);
