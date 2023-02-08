import React, { useState } from "react";
import { useSnackbar } from "notistack";

import LocalStorageHelper from "utils/LocalStorageHelper";

import {
  IconButton,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import SettingsBackupRestoreOutlinedIcon from "@mui/icons-material/SettingsBackupRestoreOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import LayersClearOutlinedIcon from "@mui/icons-material/LayersClearOutlined";

export default function DrawOrderOptions({
  app,
  setSystemFilter,
  systemFilterActive,
  map,
}) {
  // Prepare the Snackbar - we want to display nice messages when
  // user saves/restores layers.
  const { enqueueSnackbar } = useSnackbar();

  // Element that we will anchor the options menu to is
  // held in state. If it's null (unanchored), we can tell
  // that the menu should be hidden.
  const [anchorEl, setAnchorEl] = useState(null);
  const optionsMenuIsOpen = Boolean(anchorEl);

  // Show the options menu by setting an anchor element
  const handleShowMoreOptionsClick = (e) => {
    setAnchorEl(e.currentTarget);
  };

  // Hides the options menu by resetting the anchor element
  const handleCloseOptionsMenu = () => {
    setAnchorEl(null);
  };

  // Removes all active layers from list, not applicable for "system" and "base" layers
  const handleClearLayers = () => {
    // Get all active layers
    const activeLayers = map.getAllLayers().filter((l) => {
      l.getZIndex() === undefined && l.setZIndex(-2);
      return l.get("active") === true && l.get("layerType") !== "base";
    });
    // Deactivate layers = remove from list
    activeLayers.forEach((l) => {
      l.set("visible", false);
      l.set("active", false);
    });
  };

  /**
   * Take care of saving active layers so that they can be restored layer.
   * For time being we're only saving in local storage, but this may change
   * in the future.
   * We take care of saving **all non-system layers**.
   * We save the opacity as well as the layers' internal order (by reading
   * the value of zIndex).
   */
  const handleSave = () => {
    // Grab layers to be saved by…
    const layers = map
      .getAllLayers() //
      .filter((l) => l.getVisible() === true && l.get("layerType") !== "system") // …filtering out system layers.
      .map((l) => {
        // Create an array of objects. For each layer, we want to read its…
        return { i: l.get("name"), z: l.getZIndex(), o: l.getOpacity() }; // …name, zIndex and opacity.
      });

    // Let's create some metadata about our saved layers. User might want to know
    // how many layers are saved and when they were saved.
    // First, we try to get the map's name. We can't be certain that this exists (not
    // all maps have the userSpecificMaps property), so we must be careful.
    const mapName =
      Array.isArray(app.config.userSpecificMaps) &&
      app.config.userSpecificMaps.find(
        (m) => m.mapConfigurationName === app.config.activeMap
      )?.mapConfigurationTitle;

    // Next, let's put together the metadata object…
    const metadata = {
      savedAt: new Date(),
      numberOfLayers: layers.length,
      ...(mapName && { mapName }), // …if we have a map name, let's add it too.
    };

    // Let's combine it all to an object that will be saved.
    const objectToSave = { layers, metadata };

    const currentLsSettings = LocalStorageHelper.get("layerswitcher");

    // TODO: Determine whether this should be a functional or required cookie,
    // add the appropriate hook and describe here https://github.com/hajkmap/Hajk/wiki/Cookies-in-Hajk.
    LocalStorageHelper.set("layerswitcher", {
      ...currentLsSettings,
      savedLayers: objectToSave,
    });

    enqueueSnackbar(`${metadata.numberOfLayers} lager sparades utan problem`, {
      variant: "success",
    });
  };

  const handleRestore = () => {
    // Let's be safe about parsing JSON
    try {
      const { metadata, layers } = LocalStorageHelper._experimentalGet(
        "layerswitcher.savedLayers"
      );

      map
        .getAllLayers() // Traverse all layers…
        .filter((l) => l.get("layerType") !== "system") // …ignore system layers.
        .forEach((l) => {
          // See if the current layer is in the list of saved layers.
          const match = layers.find((rl) => rl.i === l.get("name"));
          // If yes…
          if (match) {
            // …read and set some options.
            l.setZIndex(match.z);
            l.setOpacity(match.o);
            l.setVisible(true);
          } else {
            // If not, ensure that the layer is hidden.
            l.setVisible(false);
          }
        });

      enqueueSnackbar(
        `${metadata.numberOfLayers} lager återställdes från tidigare session`,
        {
          variant: "success",
        }
      );
    } catch (error) {
      enqueueSnackbar(
        "Innan du kan återställa måste du spara dina befintliga lager först."
      );
    }
  };

  // Handler function for the show/hide system layers toggle
  const handleSystemLayerSwitchChange = () => {
    setSystemFilter();
  };

  return (
    <>
      <IconButton
        aria-controls={optionsMenuIsOpen ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={optionsMenuIsOpen ? "true" : undefined}
        onClick={handleShowMoreOptionsClick}
      >
        <Tooltip title="Fler funktioner">
          <MoreVertOutlinedIcon />
        </Tooltip>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={optionsMenuIsOpen}
        onClose={handleCloseOptionsMenu}
      >
        <MenuItem
          onClick={() => {
            handleClearLayers();
            handleCloseOptionsMenu();
          }}
        >
          <ListItemIcon>
            <LayersClearOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rensa alla</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleSave();
            handleCloseOptionsMenu();
          }}
        >
          <ListItemIcon>
            <SaveOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Spara session</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleRestore();
            handleCloseOptionsMenu();
          }}
        >
          <ListItemIcon>
            <SettingsBackupRestoreOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Återställ session</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleSystemLayerSwitchChange();
            handleCloseOptionsMenu();
          }}
        >
          <ListItemIcon>
            <BuildOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{`${
            systemFilterActive ? "Dölj" : "Visa"
          } systemlager`}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
