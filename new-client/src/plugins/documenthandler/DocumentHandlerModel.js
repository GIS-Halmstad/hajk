import React from "react";

/**
 * @summary  DocumentHandler model that doesn't do much.
 * @description This model exposes only one method, getMap(),
 * so it does not do anything crucial. But you can see it
 * as an example of how a plugin can be separated in different
 * components.
 *
 * @class DocumentHandlerModel
 */

const fetchConfig = {
  credentials: "same-origin"
};

export default class DocumentHandlerModel {
  internalId = 0;

  constructor(settings) {
    this.mapServiceUrl =
      settings.app.config.appConfig.proxy +
      settings.app.config.appConfig.mapserviceBase;
  }

  async fetchJsonDocument(title) {
    let response;
    try {
      response = await fetch(
        `${this.mapServiceUrl}/informative/load/${title}`,
        fetchConfig
      );
      const text = await response.text();
      const document = await JSON.parse(text);
      this.internalId = 0;
      document.chapters.forEach(chapter => {
        this.setParentChapter(chapter, undefined);
        this.setInternalId(chapter);
        this.setScrollReferences(chapter);
        this.internalId = this.internalId + 1;
      });

      return document;
    } catch (err) {}
  }

  findChapter(chapter, headerIdentifierToFind) {
    if (chapter.headerIdentifier === headerIdentifierToFind) {
      return chapter;
    }
    if (chapter.chapters.length > 0) {
      return chapter.chapters.find(child => {
        return this.findChapter(child, headerIdentifierToFind);
      });
    }
  }
  /**
   * @summary method to find a certain chapter in a fetched document with a unique headerGUID.
   * it is used when user clicks a text-link to a certain document and header in the text in the document-window
   *
   * @memberof DocumentHandlerModel
   */
  getHeaderRef = (activeDocument, headerIdentifierToFind) => {
    var foundChapter;
    activeDocument.chapters.some(chapter => {
      foundChapter = this.findChapter(chapter, headerIdentifierToFind);
      return foundChapter;
    });
    return foundChapter;
  };

  /**
   * @summary Dynamically adds a React referenceObject to each chapter in fetched document.
   * it is used by scrollIntoView in the plugin to be able to scroll to a certain chapter/header
   *
   * @memberof DocumentHandlerModel
   */
  setScrollReferences = chapter => {
    chapter.scrollRef = React.createRef();
    if (chapter.chapters.length > 0) {
      chapter.chapters.forEach(child => {
        this.setScrollReferences(child);
      });
    }
  };

  setInternalId(chapter) {
    chapter.id = this.internalId;
    if (chapter.chapters.length > 0) {
      chapter.chapters.forEach(child => {
        this.internalId = this.internalId + 1;
        this.setInternalId(child);
      });
    }
  }

  /**
   * @summary Dynamically adds a object to each chapter in fetched document.
   * it is used to keep track of the parent when changing menu-views in application
   *
   * @memberof DocumentHandlerModel
   */
  setParentChapter(chapter, parent) {
    chapter.parent = parent;
    if (chapter.chapters.length > 0) {
      chapter.chapters.forEach(child => {
        this.setParentChapter(child, chapter);
      });
    }
  }
}
