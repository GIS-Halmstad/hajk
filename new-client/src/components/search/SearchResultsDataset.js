import React from "react";
import { withStyles } from "@material-ui/core/styles";
import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
  Divider,
  Grid,
} from "@material-ui/core";
import SearchResultsDatasetFeature from "./SearchResultsDatasetFeature";
import SearchResultsDatasetFeatureDetails from "./SearchResultsDatasetFeatureDetails";
import Breadcrumbs from "@material-ui/core/Breadcrumbs";
import Link from "@material-ui/core/Link";

const styles = (theme) => ({
  datasetContainer: {
    boxShadow: "none",
    overflow: "hidden",
  },
  divider: {
    backgroundColor: theme.palette.divider,
    width: "100%",
  },
  datasetDetailsContainer: {
    padding: 0,
  },
  hover: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
});

const TightAccordionSummary = withStyles((theme) => ({
  root: {
    borderTop: `${theme.spacing(0.1)}px solid ${theme.palette.divider}`,
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    padding: "0px 10px",
    minHeight: 36,
    "&$expanded": {
      padding: "0px 10px",
      minHeight: 36,
      backgroundColor: theme.palette.action.selected,
    },
  },
  content: {
    maxWidth: "100%",
    margin: "5px 0",
    "&$expanded": {
      margin: "5px 0",
    },
  },
  expanded: {},
}))(AccordionSummary);

const TightAccordionDetails = withStyles((theme) => ({
  root: {
    padding: 0,
    cursor: "default",
    borderTop: `${theme.spacing(0.1)}px solid ${theme.palette.divider}`,
    boxShadow: "none",
    "&:before": {
      display: "none",
    },
  },
}))(AccordionDetails);

const TightBreadcrumbs = withStyles({
  root: {
    width: "100%",
    display: "inline-block",
  },
  ol: {
    width: "100%",
  },
  li: {
    display: "flex",
    maxWidth: (props) => (props.numelements > 2 ? "35%" : "90%"),
  },
})(Breadcrumbs);

class SearchResultsDataset extends React.PureComponent {
  //Some sources does not return numberMatched and numberReturned, falling back on features.length
  state = {
    numberOfResultsToDisplay: this.props.featureCollection.value.numberMatched
      ? this.props.featureCollection.value.numberMatched >
        this.props.featureCollection.value.numberReturned
        ? `${this.props.featureCollection.value.numberReturned}+`
        : this.props.featureCollection.value.numberReturned
      : this.props.featureCollection.value.features.length,
  };

  resultHasOnlyOneFeature = () => {
    const { featureCollection } = this.props;
    return featureCollection.value.features.length === 1;
  };

  getFeatureTitle = (feature) => {
    const { activeFeatureCollection } = this.props;

    return activeFeatureCollection.source.displayFields.reduce(
      (featureTitleString, df) => {
        let displayField = feature.properties[df];
        if (Array.isArray(displayField)) {
          displayField = displayField.join(", ");
        }

        if (displayField) {
          if (featureTitleString.length > 0) {
            featureTitleString = featureTitleString.concat(
              ` | ${displayField}`
            );
          } else {
            featureTitleString = displayField;
          }
        }

        return featureTitleString;
      },
      ""
    );
  };

  renderDatasetDetails = () => {
    const {
      featureCollection,
      classes,
      app,
      selectedItems,
      showClickResultInMap,
      activeFeatureCollection,
      activeFeature,
      handleOnFeatureClick,
      getOriginBasedIcon,
    } = this.props;

    const shouldRenderFeatureDetails =
      activeFeature && !activeFeature.onClickName;

    if (shouldRenderFeatureDetails) {
      return (
        <TightAccordionDetails
          id={`search-result-dataset-details-${featureCollection.source.id}`}
          className={classes.datasetDetailsContainer}
        >
          <SearchResultsDatasetFeatureDetails
            feature={activeFeature}
            featureTitle={this.getFeatureTitle(activeFeature)}
            app={app}
            source={activeFeatureCollection.source}
          />
        </TightAccordionDetails>
      );
    } else {
      return (
        <TightAccordionDetails
          id={`search-result-dataset-details-${featureCollection.source.id}`}
          className={classes.datasetDetailsContainer}
        >
          <Grid justify="center" container>
            {featureCollection.value.features.map((f) => {
              const featureTitle = this.getFeatureTitle(f);
              if (featureTitle.length > 0) {
                return (
                  <React.Fragment key={f.id}>
                    <Grid
                      role="button"
                      onClick={() => handleOnFeatureClick(f)}
                      className={classes.hover}
                      container
                      item
                    >
                      {
                        <Typography variant="srOnly">
                          Aktivera sökresultat
                        </Typography>
                      }
                      <SearchResultsDatasetFeature
                        feature={f}
                        featureTitle={this.getFeatureTitle(f)}
                        app={app}
                        source={featureCollection.source}
                        origin={featureCollection.origin}
                        visibleInMap={
                          selectedItems.findIndex(
                            (item) => item.featureId === f.id
                          ) > -1
                        }
                        showClickResultInMap={showClickResultInMap}
                        activeFeature={activeFeature}
                        getOriginBasedIcon={getOriginBasedIcon}
                      />
                    </Grid>
                    {!this.resultHasOnlyOneFeature() && (
                      <Divider className={classes.divider}></Divider>
                    )}
                  </React.Fragment>
                );
              } else {
                return null;
              }
            })}
          </Grid>
        </TightAccordionDetails>
      );
    }
  };

  renderDetailsHeader = () => {
    const {
      activeFeatureCollection,
      activeFeature,
      resetFeatureAndCollection,
      setActiveFeature,
    } = this.props;
    const shouldRenderFeatureDetails =
      activeFeature && !activeFeature.onClickName;
    const numElements = shouldRenderFeatureDetails ? 3 : 2;
    return (
      <Grid alignItems="center" style={{ maxWidth: "100%" }} container>
        <TightBreadcrumbs
          numelements={numElements}
          aria-label="breadcrumb"
          component="div"
        >
          <Tooltip title="Tillbaka till alla sökresultat">
            <Link
              noWrap
              component="div"
              onClick={(e) => {
                e.stopPropagation();
                resetFeatureAndCollection();
              }}
              onChange={resetFeatureAndCollection}
              variant="button"
            >
              Start
            </Link>
          </Tooltip>
          <Tooltip title={activeFeatureCollection.source.caption}>
            <Link
              onClick={(e) => {
                e.stopPropagation();
                setActiveFeature(undefined);
              }}
              noWrap
              component="div"
              variant="button"
            >
              {activeFeatureCollection.source.caption}
            </Link>
          </Tooltip>
          {shouldRenderFeatureDetails && (
            <Tooltip title={this.getFeatureTitle(activeFeature)}>
              <Link noWrap component="div" variant="button">
                {this.getFeatureTitle(activeFeature)}
              </Link>
            </Tooltip>
          )}
        </TightBreadcrumbs>
      </Grid>
    );
  };

  renderListHeader = () => {
    const { numberOfResultsToDisplay } = this.state;

    const { featureCollection, getOriginBasedIcon } = this.props;
    const { numberReturned, numberMatched, features } = featureCollection.value;
    const toolTipTitle = numberReturned
      ? `Visar ${numberReturned} av ${numberMatched} resultat`
      : `Visar ${features.length} resultat`;
    return (
      <Grid alignItems="center" container>
        <Grid item xs={1}>
          {getOriginBasedIcon(featureCollection.origin)}
        </Grid>
        <Grid item xs={9}>
          <Typography variant="button">
            {featureCollection.source.caption}
          </Typography>
        </Grid>
        <Grid container item justify="flex-end" xs={2}>
          <Tooltip title={toolTipTitle}>
            <Chip
              size="small"
              color="default"
              label={numberOfResultsToDisplay}
            />
          </Tooltip>
        </Grid>
      </Grid>
    );
  };

  renderDatasetSummary = () => {
    const { activeFeatureCollection, featureCollection } = this.props;

    return (
      <TightAccordionSummary
        id={`search-result-dataset-${featureCollection.source.id}`}
        aria-controls={`search-result-dataset-details-${featureCollection.source.id}`}
      >
        {activeFeatureCollection
          ? this.renderDetailsHeader()
          : this.renderListHeader()}
      </TightAccordionSummary>
    );
  };

  renderResultsDataset = () => {
    const {
      classes,
      featureCollection,
      setActiveFeatureCollection,
      activeFeatureCollection,
    } = this.props;
    return (
      <>
        <Accordion
          className={classes.datasetContainer}
          square
          expanded={activeFeatureCollection ? true : false}
          TransitionProps={{ timeout: 100 }}
          onChange={() => {
            setActiveFeatureCollection(featureCollection);
          }}
        >
          {this.renderDatasetSummary()}
          {activeFeatureCollection && this.renderDatasetDetails()}
        </Accordion>
      </>
    );
  };

  render() {
    const { numberOfResultsToDisplay } = this.state;
    return parseInt(numberOfResultsToDisplay) > 0
      ? this.renderResultsDataset()
      : null;
  }
}

export default withStyles(styles)(SearchResultsDataset);
