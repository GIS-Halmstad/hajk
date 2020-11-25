import React from "react";
import {
  EditorState,
  RichUtils,
  Modifier,
  AtomicBlockUtils,
  getDefaultKeyBinding,
  KeyBindingUtil,
  convertToRaw
} from "draft-js";
import Editor from "draft-js-plugins-editor";
import { stateToHTML } from "draft-js-export-html";
import { stateFromHTML } from "draft-js-import-html";
import Button from "@material-ui/core/Button";
import DoneIcon from "@material-ui/icons/DoneOutline";
import { withStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import FormatBoldIcon from "@material-ui/icons/FormatBold";
import FormatItalicIcon from "@material-ui/icons/FormatItalic";
import FormatUnderlinedIcon from "@material-ui/icons/FormatUnderlined";
import FormatListBulletedIcon from "@material-ui/icons/FormatListBulleted";
import FormatListNumberedIcon from "@material-ui/icons/FormatListNumbered";
import FormatQuoteIcon from "@material-ui/icons/FormatQuote";
import ImageIcon from "@material-ui/icons/Image";
import DescriptionIcon from "@material-ui/icons/Description";
import MapIcon from "@material-ui/icons/Map";
import LaunchIcon from "@material-ui/icons/Launch";

import addLinkPlugin from "./addLinkPlugin";
import { mediaBlockRenderer } from "./addMediaPlugin";

import StyleButton from "./StyleButton";

const ColorButtonGreen = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700]
    },
    marginRight: "28px",
    float: "left"
  }
}))(Button);

export default class DocumentTextEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createWithContent(
        stateFromHTML(this.props.html)
      ),
      html: this.props.html,
      showURLInput: false,
      showLinkInput: false,
      url: "",
      urlType: "",
      imageList: this.props.imageList,
      documents: this.props.documents,
      isReadOnly: false
    };
    this.plugins = [addLinkPlugin];
    this.focus = () => this.refs.editor.focus();
    this.logState = () => {
      const content = this.state.editorState.getCurrentContent();
      console.log(stateToHTML(content));
      console.log(convertToRaw(content));
    };
    this.onChange = editorState => this.setState({ editorState });
    this.onURLChange = e => this.setState({ urlValue: e.target.value });
    this.onTitleChange = e => this.setState({ urlTitle: e.target.value });
    this.onTitleIdChange = e => this.setState({ urlTitleId: e.target.value });
    this.onWidthChange = e => this.setState({ mediaWidth: e.target.value });
    this.onHeightChange = e => this.setState({ mediaHeight: e.target.value });
    this.onDataCaptionChange = e =>
      this.setState({ mediaCaption: e.target.value });
    this.onDataSourceChange = e =>
      this.setState({ mediaSource: e.target.value });
    this.onDataPopupChange = e =>
      this.setState({ mediaPopup: !this.state.mediaPopup });
    this.onBlockBackgroundChange = e =>
      this.setState({ blockBackground: e.target.value });
    this.onBlockDividerChange = e =>
      this.setState({ blockDivider: e.target.value });
    this.addAudio = this._addAudio.bind(this);
    this.addImage = this._addImage.bind(this);
    this.addVideo = this._addVideo.bind(this);
    this.addMapLink = this._addMapLink.bind(this);
    this.addDocumentLink = this._addDocumentLink.bind(this);
    this.addWebLink = this._addWebLink.bind(this);
    this.closeURLInput = this._closeURLInput.bind(this);
    this.closeLinkInput = this._closeLinkInput.bind(this);
    this.confirmMedia = this._confirmMedia.bind(this);
    this.confirmLink = this._confirmLink.bind(this);
    this.handleKeyCommand = this._handleKeyCommand.bind(this);
    this.handlePastedText = this._handlePastedText.bind(this);
    this.handleReturn = this._handleReturn.bind(this);
    this.mapKeyToEditorCommand = this._mapKeyToEditorCommand.bind(this);
    this.onURLInputKeyDown = this._onURLInputKeyDown.bind(this);
    this.onLinkInputKeyDown = this._onLinkInputKeyDown.bind(this);
    this.toggleBlockType = this._toggleBlockType.bind(this);
    this.toggleInlineStyle = this._toggleInlineStyle.bind(this);
  }
  _handleKeyCommand(command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return "handled";
    }
    return "not-handled";
  }
  _toggleBlockType(blockType) {
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType));
  }
  _toggleInlineStyle(inlineStyle) {
    this.onChange(
      RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle)
    );
  }
  _confirmMedia(e) {
    e.preventDefault();
    const {
      editorState,
      urlValue,
      urlType,
      mediaWidth,
      mediaHeight,
      mediaCaption,
      mediaSource,
      mediaPopup
    } = this.state;
    const contentState = editorState.getCurrentContent();

    const contentStateWithEntity = contentState.createEntity(
      urlType,
      "IMMUTABLE",
      {
        src: urlValue,
        "data-image-width": mediaWidth ? mediaWidth + "px" : null,
        "data-image-height": mediaHeight ? mediaHeight + "px" : null,
        "data-caption": mediaCaption,
        "data-source": mediaSource,
        "data-popup": mediaPopup
      }
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.push(
      editorState,
      contentStateWithEntity,
      "create-entity"
    );
    this.setState(
      {
        editorState: AtomicBlockUtils.insertAtomicBlock(
          newEditorState,
          entityKey,
          " "
        ),
        showURLInput: false,
        showLinkInput: false,
        urlValue: "",
        mediaWidth: "",
        mediaHeight: "",
        mediaCaption: "",
        mediaSource: "",
        mediaPopup: false
      },
      () => {
        setTimeout(() => this.focus(), 0);
      }
    );
  }
  _onURLInputKeyDown(e) {
    if (e.which === 13) {
      this._confirmMedia(e);
    }
  }
  _closeURLInput() {
    this.setState(
      {
        showURLInput: false,
        showLinkInput: false,
        urlValue: "",
        mediaWidth: "",
        mediaHeight: "",
        mediaCaption: "",
        mediaSource: "",
        mediaPopup: false
      },
      () => {
        setTimeout(() => this.focus(), 0);
      }
    );
  }

  _confirmLink(e) {
    e.preventDefault();
    const { editorState, urlValue, urlType, urlTitle, urlTitleId } = this.state;
    const data = {
      url: urlValue,
      type: urlType
    };

    if (urlType === "urllink") {
      data["data-link"] = urlValue;
    } else if (urlType === "documentlink") {
      data["data-header-identifier"] = urlTitleId;
      data["data-document"] = urlValue;
    } else if (urlType === "maplink") {
      data["data-maplink"] = urlValue;
    }

    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      "LINK",
      "MUTABLE",
      data
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.push(
      editorState,
      contentStateWithEntity,
      "create-entity"
    );
    this.setState(
      {
        editorState: AtomicBlockUtils.insertAtomicBlock(
          newEditorState,
          entityKey,
          urlTitle
        ),
        showURLInput: false,
        showLinkInput: false,
        urlValue: "",
        urlTitle: "",
        urlTitleId: ""
      },
      () => {
        setTimeout(() => this.focus(), 0);
      }
    );
    return "handled";
  }

  _onLinkInputKeyDown(e) {
    if (e.which === 13) {
      this._confirmLink(e);
    }
  }
  _closeLinkInput() {
    this.setState(
      {
        showLinkInput: false,
        urlValue: "",
        urlTitle: "",
        urlTitleId: ""
      },
      () => {
        setTimeout(() => this.focus(), 0);
      }
    );
  }

  _handleReturn = evt => {
    // Handle soft break on Shift+Enter
    const blockType = RichUtils.getCurrentBlockType(this.state.editorState);
    if (evt.shiftKey) {
      this.setState({
        editorState: RichUtils.insertSoftNewline(this.state.editorState)
      });
      return "handled";
    }
    if (blockType !== "blockquote" || !KeyBindingUtil.isSoftNewlineEvent(evt)) {
      return "not_handled";
    }
  };
  _promptForMedia(type) {
    this.setState(
      {
        showURLInput: true,
        showLinkInput: false,
        urlValue: this.state.urlValue,
        urlType: type,
        mediaWidth: this.state.mediaWidth,
        mediaHeight: this.state.mediaHeight,
        mediaCaption: this.state.mediaCaption,
        mediaSource: this.state.mediaSource,
        mediaPopup: this.state.mediaPopup
      },
      () => {
        setTimeout(() => this.refs.url.focus(), 0);
      }
    );
  }
  _promptForLink(type) {
    this.setState(
      {
        showURLInput: false,
        showLinkInput: true,
        urlValue: this.state.urlValue,
        urlType: type,
        urlTitle: "",
        urlTitleId: ""
      },
      () => {
        setTimeout(() => this.refs.link.focus(), 0);
      }
    );
  }
  _addAudio() {
    this._promptForMedia("audio");
  }
  _addImage() {
    this._promptForMedia("image");
  }
  _addVideo() {
    this._promptForMedia("video");
  }
  _addMapLink() {
    this._promptForLink("maplink");
  }
  _addDocumentLink() {
    this._promptForLink("documentlink");
  }
  _addWebLink() {
    this._promptForLink("urllink");
  }

  _mapKeyToEditorCommand(e) {
    if (e.keyCode === 9 /* TAB */) {
      const newEditorState = RichUtils.onTab(
        e,
        this.state.editorState,
        4 /* maxDepth */
      );
      if (newEditorState !== this.state.editorState) {
        this.onChange(newEditorState);
      }
      return;
    }
    return getDefaultKeyBinding(e);
  }
  _handlePastedText = (text = "", html) => {
    // If clipboard contains unformatted text, the first parameter
    // is used, while the second is empty. In the code below, we
    // only take care for the second parameter. So to handle
    // those cases where unformatted text is pasted in, we must
    // ensure that the second paramter always is defined.
    // That can be done by copying the contents of the first parameter
    // if the second parameter is empty/undefined.
    if (html?.trim().length === 0 || html === undefined) {
      html = text;
    }
    const { editorState } = this.state;
    const generatedState = stateFromHTML(html);
    const generatedHtml = stateToHTML(generatedState);
    const el = document.createElement("div");
    el.innerHTML = generatedHtml;

    const images = el.getElementsByTagName("img");

    for (let i = 0; i < images.length; i++) {
      let img = images[i];
      img.src = img.alt;
      img.alt = "";
      img.width = "";
      img.height = "";
      img["data-image-width"] = "";
      img["data-image-height"] = "";
      img["data-caption"] = "";
      img["data-source"] = "";
      let figure = document.createElement("figure");
      figure.innerHTML = img.outerHTML;
      img.parentNode.replaceChild(figure, img);
    }

    if (el.lastChild.getElementsByTagName("figure").length > 0) {
      let p = document.createElement("p");
      p.innerHTML = "&nbsp;";
      el.appendChild(p);
    }

    const blockMap = stateFromHTML(el.outerHTML).blockMap;
    const newState = Modifier.replaceWithFragment(
      editorState.getCurrentContent(),
      editorState.getSelection(),
      blockMap
    );
    this.onChange(EditorState.push(editorState, newState, "insert-fragment"));

    return true;
  };

  createMarkup(html) {
    return {
      __html: html
    };
  }

  getHtml() {
    const content = this.state.editorState.getCurrentContent();

    const blockStyleFn = block => {
      const blockType = block.getType().toLowerCase();

      if (blockType === "blockquote") {
        return {
          attributes: {
            "data-divider-color": "",
            "data-background-color": "",
            "data-text-section": ""
          }
        };
      }
    };

    const entityStyleFn = entity => {
      const entityType = entity.getType().toUpperCase();
      console.log("ent", entityType);
      if (entityType === "LINK") {
        // Add styling here
      }
      if (entityType === "IMAGE") {
        // Add styling here
      }
    };

    const options = {
      blockStyleFn,
      entityStyleFn
    };
    return stateToHTML(content, options);
  }

  applyChanges() {
    var htmlString = this.getHtml();
    this.props.onUpdate(htmlString);
    this.setState({
      //readonly: !this.state.readonly,
      html: htmlString
    });
  }

  getUrlType(type) {
    switch (type) {
      case "urllink":
        return "webblänk";
      case "documentlink":
        return "dokumentlänk";
      case "maplink":
        return "kartlänk";
      default:
        return "länk";
    }
  }

  getUrlInput(type, documents) {
    // Return input field for default URL or documents
    if (type === "documentlink") {
      return (
        <select onChange={this.onURLChange} ref="link">
          {documents
            ? documents.map((document, i) => {
                return (
                  <option key={i} type="text" name="document" value={document}>
                    {document}
                  </option>
                );
              })
            : null}
        </select>
      );
    } else {
      return (
        <input
          onChange={this.onURLChange}
          ref="link"
          style={styles.urlInput}
          type="text"
          value={this.state.urlValue || ""}
          placeholder="Webblänk"
          onKeyDown={this.onLinkInputKeyDown}
        />
      );
    }
  }

  getUrlId(type) {
    // Return input field for default URL or documents
    if (type === "documentlink") {
      return (
        <input
          onChange={this.onTitleIdChange}
          ref="url"
          style={styles.urlInput}
          type="text"
          value={this.state.urlTitleId || ""}
          placeholder="data-header-identifier"
          onKeyDown={this.onLinkInputKeyDown}
        />
      );
    }
  }

  toggleReadOnly = () => {
    const { isReadOnly } = this.state;
    this.setState({
      isReadOnly: !isReadOnly
    });
  };

  render() {
    const { editorState, imageList, documents } = this.state;

    let editorContainer = styles.editor;
    var contentState = editorState.getCurrentContent();
    /*if (!contentState.hasText()) {
      if (contentState.getBlockMap().first().getType() !== "unstyled") {
        editorContainer = " RichEditor-hidePlaceholder";
      }
    }*/

    let urlInput;
    if (this.state.showURLInput) {
      urlInput = (
        <div style={styles.urlInputContainer}>
          <span>Lägg till bild</span>
          <input
            onChange={this.onURLChange}
            ref="url"
            style={styles.urlInput}
            type="text"
            value={this.state.urlValue || ""}
            onKeyDown={this.onURLInputKeyDown}
          />
          <select onChange={this.onURLChange}>
            {imageList
              ? imageList.map((image, i) => {
                  return (
                    <option
                      key={i}
                      type="text"
                      name="url"
                      value={"../Upload/" + image}
                    >
                      {image}
                    </option>
                  );
                })
              : null}
          </select>
          <input
            onChange={this.onWidthChange}
            ref="data-image-width"
            type="number"
            value={this.state.mediaWidth || ""}
            onKeyDown={this.onURLInputKeyDown}
            placeholder="data-image-width"
          />
          <input
            onChange={this.onHeightChange}
            ref="data-image-height"
            type="number"
            value={this.state.mediaHeight || ""}
            onKeyDown={this.onURLInputKeyDown}
            placeholder="data-image-height"
          />
          <input
            onChange={this.onDataCaptionChange}
            ref="data-caption"
            type="text"
            value={this.state.mediaCaption || ""}
            onKeyDown={this.onURLInputKeyDown}
            placeholder="data-caption"
          />
          <input
            onChange={this.onDataSourceChange}
            ref="data-source"
            type="text"
            value={this.state.mediaSource || ""}
            onKeyDown={this.onURLInputKeyDown}
            placeholder="data-source"
          />
          <input
            id="data-popup"
            onChange={this.onDataPopupChange}
            ref="data-popup"
            type="checkbox"
            value={this.state.mediaPopup || ""}
            onKeyDown={this.onURLInputKeyDown}
            placeholder="data-popup"
          />
          <label>Popup</label>
          <button onMouseDown={this.confirmMedia}>OK</button>
          <button onMouseDown={this.closeURLInput}>Avbryt</button>
        </div>
      );
    }

    if (this.state.showLinkInput) {
      urlInput = (
        <div style={styles.urlInputContainer}>
          <h1>Lägg till {this.getUrlType(this.state.urlType)}</h1>
          {this.getUrlInput(this.state.urlType, documents)}
          <input
            onChange={this.onTitleChange}
            ref="url"
            style={styles.urlInput}
            type="text"
            value={this.state.urlTitle || ""}
            placeholder="Rubrik på länk"
            onKeyDown={this.onLinkInputKeyDown}
          />
          {this.getUrlId(this.state.urlType)}
          <button onMouseDown={this.confirmLink}>OK</button>
          <button onMouseDown={this.closeLinkInput}>Avbryt</button>
        </div>
      );
    }

    return (
      <div style={styles.root}>
        <div style={styles.buttonContainer}>
          <div style={styles.buttons}>
            <ColorButtonGreen
              variant="contained"
              className="btn btn-primary"
              title="Godkänn ändringar"
              onClick={() => this.applyChanges()}
              startIcon={<DoneIcon />}
            />
            <InlineStyleControls
              editorState={editorState}
              onToggle={this.toggleInlineStyle}
            />
            <BlockStyleControls
              editorState={editorState}
              onToggle={this.toggleBlockType}
            />
            <StyleButton label={<ImageIcon />} onToggle={this.addImage} />
            <StyleButton label={<LaunchIcon />} onToggle={this.addWebLink} />
            <StyleButton
              label={<DescriptionIcon />}
              onToggle={this.addDocumentLink}
            />
            <StyleButton label={<MapIcon />} onToggle={this.addMapLink} />
          </div>
        </div>
        {urlInput}
        <div style={editorContainer} onClick={this.focus}>
          <Editor
            style={styles.editor}
            blockStyleFn={getBlockStyle}
            blockRendererFn={mediaBlockRenderer}
            toggleReadOnly={false}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            handlePastedText={this.handlePastedText}
            handleReturn={this.handleReturn}
            keyBindingFn={this.mapKeyToEditorCommand}
            onChange={this.onChange}
            placeholder="Lägg till text..."
            ref="editor"
            readOnly={this.state.isReadOnly}
            plugins={this.plugins}
          />
        </div>
        <input
          onClick={this.logState}
          style={styles.button}
          type="button"
          value="Log State"
        />
        <button onMouseDown={this.toggleReadOnly} style={{ marginBottom: 5 }}>
          Read Only Mode
        </button>
      </div>
    );
  }
}

/* Block types */
function getBlockStyle(block) {
  switch (block.getType()) {
    case "blockquote":
      return "document-blockquote";
    default:
      return null;
  }
}

const BLOCK_TYPES = [
  //{ label: "H1", style: "header-one" },
  { label: <FormatQuoteIcon />, style: "blockquote" },
  { label: <FormatListBulletedIcon />, style: "unordered-list-item" },
  { label: <FormatListNumberedIcon />, style: "ordered-list-item" }
];

const BlockStyleControls = props => {
  const { editorState } = props;
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  return (
    <div style={styles.buttons}>
      {BLOCK_TYPES.map(type => (
        <StyleButton
          key={type.style}
          active={type.style === blockType}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

/* Inline styles */
const INLINE_STYLES = [
  { label: <FormatBoldIcon />, style: "BOLD" },
  { label: <FormatItalicIcon />, style: "ITALIC" },
  { label: <FormatUnderlinedIcon />, style: "UNDERLINE" }
];
const InlineStyleControls = props => {
  const currentStyle = props.editorState.getCurrentInlineStyle();
  return (
    <div style={styles.buttons}>
      {INLINE_STYLES.map(type => (
        <StyleButton
          key={type.style}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

/* CSS styling */
const styles = {
  root: {
    fontFamily: "'Georgia', serif",
    width: 1000,
    border: "1px solid #ddd"
  },
  buttonContainer: {
    height: 40,
    borderBottom: "1px solid #ddd"
  },
  buttons: {
    borderRight: "1px solid #ccc",
    float: "left"
  },
  urlInputContainer: {
    marginBottom: 10
  },
  urlInput: {
    fontFamily: "'Georgia', serif",
    marginRight: 10,
    padding: 3
  },
  editorContainer: {
    border: "1px solid #ccc",
    cursor: "text",
    minHeight: 80,
    fontSize: 16
  },
  editor: {
    backgroundColor: "#fff",
    padding: "18px"
  },
  button: {
    marginTop: 10,
    textAlign: "center"
  },
  media: {
    whiteSpace: "initial"
  },
  paper: {
    position: "absolute",
    width: 400,
    border: "2px solid #000"
  }
};
