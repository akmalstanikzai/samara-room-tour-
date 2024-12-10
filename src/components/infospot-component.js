import { LitElement, html, css } from 'lit';
import { appState } from '../services/app-state';
import { Vector3 } from 'three';
import { params } from '../3d/settings';
import { ref } from 'lit/directives/ref.js';

/** Component for info spots */
export class InfoSpotComponent extends LitElement {
  constructor() {
    super();
    this.engine = window.engine;
    this.vector = new Vector3();
  }

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  static styles = css`
    .popup {
      display: block;
      opacity: 0;
      position: absolute;
      background: rgba(255, 255, 255, 0.6);
      color: black;
      border-radius: 8px;
      padding: 10px;
      backdrop-filter: blur(1em);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      pointer-events: none;
      z-index: 999;
      font-weight: 600;
      bottom: calc(100% - 25px);
      left: 50%;
      transform: translateX(-50%);
      white-space: nowrap;
      transition: opacity 0.2s ease-in-out;
    }

    .info:hover .popup {
      opacity: 1;
    }

    .info {
      width: 5em;
      height: 5em;
      position: absolute;
      z-index: 999;
      top: 0;
      left: 0;
      cursor: pointer;
      display: none;

      img {
        width: 100%;
        height: auto;
        pointer-events: none; /* Add this line to prevent dragging of the image */
      }
    }
  `;

  onRef(htmlEl, i) {
    /**
     * @typedef {HTMLDivElement} htmlEl
     */
    if (htmlEl) this.engine.pano.hotspots.infospots[i].htmlEl = htmlEl;
  }

  render() {
    return html`
      ${this.engine.pano.hotspots.infospots.map((object, i) => {
        return html`
          <div class="info" ${ref((htmlEl) => this.onRef(htmlEl, i))}>
            <img src="${params.paths.assets_path}Infospot.png" />
            <div class="popup">${object._bubbleText}</div>
          </div>
        `;
      })}
    `;
  }
}

customElements.define('infospot-component', InfoSpotComponent);
