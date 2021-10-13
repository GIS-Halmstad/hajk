import React from "react";
import { IconButton, Paper, Tooltip } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";

import withStyles from "@mui/styles/withStyles";

const styles = (theme) => ({
  paper: {
    marginBottom: theme.spacing(1),
  },
  button: {
    minWidth: "unset",
  },
});

/**
 * @summary Resets map to initial zoom level, centrum coordinate and active layers.
 *
 * @param {object} props
 * @returns {object} React
 */
class MapResetter extends React.PureComponent {
  // TODO: Also reset layers to default visibility!
  handleClick = (e) => {
    const { map } = this.props;
    if (map !== undefined) {
      const view = map.getView();
      const { zoom, center } = this.props.mapConfig.map;
      view.animate({ zoom, center });
    }
  };

  render() {
    const { classes } = this.props;

    return (
      <Tooltip disableInteractive title="Återställ kartan till startläget">
        <Paper className={classes.paper}>
          <IconButton
            aria-label="Återställ kartan till startläget"
            className={classes.button}
            onClick={this.handleClick}
          >
            <HomeIcon />
          </IconButton>
        </Paper>
      </Tooltip>
    );
  }
}

export default withStyles(styles)(MapResetter);
