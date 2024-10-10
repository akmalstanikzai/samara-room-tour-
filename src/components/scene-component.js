import { html, LitElement, nothing, css } from 'lit';
import { appState } from '../services/app-state';
import { ref } from 'lit/directives/ref.js';
import { params } from '../3d/settings';
import { BehaviorSubject } from 'rxjs';

export class SceneComponent extends LitElement {
  constructor() {
    super();

    this.loading = {
      isLoading: true,
      percent: null,
    };

    this.errors = {
      isError: false,
      message: null,
    };
  }

  static get styles() {
    return css`
      :host {
        -webkit-tap-highlight-color: rgba(255, 255, 255, 0) !important;
        -webkit-focus-ring-color: rgba(255, 255, 255, 0) !important;
        outline: none !important;
        box-sizing: border-box;
        --white: rgb(255, 255, 255);
        --black: rgb(0, 0, 0);
        --transparent: rgba(0, 0, 0, 0);
        --samara-primary: #000000;
        --samara-secondary: #e0ded4;
        --progress-bar-size: 15em;
        --grey5: rgba(169, 169, 169, 0.5);
      }

      .loading-overlay,
      .errors-overlay {
        width: 100%;
        height: 100%;
        z-index: 2;
        background-color: var(--samara-bgcolor);
        justify-content: center;
        align-items: center;
        display: flex;
        position: absolute;
        top: 0;
        left: 0;
      }

      .loading-overlay {
        flex-direction: column;
      }

      .errors-overlay {
        z-index: 3;
      }

      .progress-bar {
        height: 0.55em;
        width: 0;
        max-width: var(--progress-bar-size);
        background: var(--samara-primary);
        border-radius: 2em;
        position: absolute;
        bottom: 0;
      }

      .progress-bar-wrapper {
        width: var(--progress-bar-size);
        height: 0.55em;
        margin-top: 2.5em;
        margin-bottom: 2.5em;
        position: relative;
      }

      .progress-bar-wrapper:before {
        content: '';
        width: 100%;
        height: 100%;
        background-color: var(--grey5);
        border-radius: 2em;
        position: absolute;
      }

      .scene {
        width: 100%;
        height: 100%;
        background-color: var(--samara-bgcolor);
        display: flex;
        position: relative;
      }

      .scene-wrapper {
        height: 100vh;
        width: 100%;
        outline: none;
        flex-direction: row;
        justify-content: space-between;
        display: flex;
        position: relative;
        overflow: hidden;
        font-family: sans-serif;
      }

      .scene canvas {
        position: absolute;
        top: 0;
        left: 0;
      }

      .icon {
        overflow: hidden;
        max-width: 1em;
        width: 1em;
        min-width: 1em;
        height: 1em;
        max-height: 1em;
        cursor: pointer;
        padding: 0.5em;
        position: relative;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        svg {
          vertical-align: middle;
          width: 100%;
          height: 100%;
        }
      }
    `;
  }

  static get properties() {
    return {
      loading: { state: true },
      errors: { state: true },
      initialState: {},
      url: {},
    };
  }

  firstUpdated() {}

  onRef(div) {
    params.container = div;
  }

  connectedCallback() {
    super.connectedCallback();

    const initialState = JSON.parse(this.initialState);

    this.devMode = initialState.devMode === 'on';

    /**
     * @typedef {object} Options
     * @property {string} layout - Layout option onebed or studio
     * @property {color} color - Base color
     * @property {color} roof - Roof color
     * @property {string} front - Front option window or double doors
     * @property {string} left - Left side option window or double doors
     * @property {string} right - Right side option window or double doors
     * @property {string} solar - Solar option solar-half, solar-full, no-solar
     * @property {string} trim - Trim option wood, metal
     * @property {string} rear - Rear option left-and-windows, left-window-right-doubledoor, left-and-right-doubledoors, left-doubledoor-and-window
     */

    /**
     * @type {obj}
     */

    const obj = {
      layout: initialState.layout,
      color:
        initialState.color ||
        params.models.samara.complectationVars.Color.variants[0].name,
      roof:
        initialState.roof ||
        params.models.samara.complectationVars.Roof.variants[0].name,
      front: initialState.front,
      left: initialState.left,
      right: initialState.right,
      solar: initialState.solar,
      cables: initialState.cables,
      trim:
        initialState.trim ||
        params.models.samara.complectationVars.Trim.variants[1].name,
      'primary bedroom':
        params.models.samara.complectationVars['Primary bedroom'].variants[1]
          .name,
      'living room': 'window',
      'secondary bedroom': 'double doors',
      support: 'Dark bronze base',
    };

    if (this.url) {
      params.paths = {
        models_path: this.url + 'models/',
        textures_path: this.url + 'textures/',
        decoders_path: this.url + 'decoders/',
        assets_path: this.url + 'assets/',
      };
    }

    console.log(this.url);

    appState.complectation = new BehaviorSubject(obj);

    this.sub = appState.loading.subscribe((res) => {
      this.loading = res;
    });

    this.sub.add(
      appState.errors.subscribe((res) => {
        this.errors = res;
      })
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.sub.unsubscribe();
  }

  render() {
    return html`
      <div class="scene-wrapper">
        <div class="scene" ${ref(this.onRef)}></div>

        ${this.errors.isError
          ? html`<div class="errors-overlay">
              ${this.errors.message}
              <div class="icon">
                <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill="black"
                    d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z"
                  >
                    <animateTransform
                      attributeType="xml"
                      attributeName="transform"
                      type="rotate"
                      from="0 25 25"
                      to="360 25 25"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </path>
                </svg>
              </div>
            </div>`
          : nothing}
        ${this.loading.isLoading && this.devMode
          ? html`<div class="loading-overlay">
              <div class="progress-bar-wrapper">
                <div
                  class="progress-bar"
                  style="width:${this.loading.percent}%"
                ></div>
              </div>
            </div>`
          : nothing}
        ${!this.loading.isLoading && this.devMode
          ? html`<gui-component></gui-component>
              <menu-component></menu-component>`
          : nothing}
      </div>
    `;
  }
}

customElements.define('samara-scene', SceneComponent);
