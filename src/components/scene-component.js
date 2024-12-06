import { html, LitElement, nothing, css } from 'lit';
import { appState } from '../services/app-state';
import { ref } from 'lit/directives/ref.js';
import { params } from '../3d/settings';
import { CreateScene } from '../3d/scene';

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

    this.isModalOpen = false;
    this.currentZoom = '1x';
    this.showGui = this.shouldShowGui();
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
        cursor: grab !important;
      }

      .scene-wrapper {
        height: 100%;
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

      .cursor-grab {
      }

      .cursor-pointer {
        cursor: pointer !important;
      }

      .cursor-dragging {
        cursor: grabbing !important;
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

      button {
        cursor: pointer;
        display: block;
        padding: 0.57em 1em;
        background-color: rgba(0, 0, 0, 0.3);
        transition: opacity 0.4s ease-in-out;
        -webkit-transition: opacity 0.4s;
        color: #fff;
        outline: none;
        border: none;
        border-radius: 3em;
        line-height: 1.7;
        margin-top: 0.5em;
        margin-bottom: 0.5em;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      button svg {
        vertical-align: middle;
      }

      #modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        backdrop-filter: blur(1em);
      }

      #pano {
        width: 100%;
        height: 100%;
        border-radius: 1em;
        overflow: hidden;
        position: relative;
      }

      #openModal {
        margin: 1em;
      }

      #closeModal {
        border-radius: 0.5em;
        backdrop-filter: blur(1em);
        background-color: rgba(0, 0, 0, 0);
      }

      #modal-content {
        justify-content: center;
        align-items: center;
        display: flex;
        width: 80%;
        height: 80%;
      }

      #modal-overlay {
        width: 100%;
        height: 100%;
        backdrop-filter: blur(1em);
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .button-container {
        position: absolute;
        bottom: 1em;
        right: 1em;
        display: flex;
        gap: 0.5em;
      }

      .button-wrapper {
        border-radius: 2em;
        backdrop-filter: blur(1em);
        display: flex;
        padding: 0.5em;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .button {
        margin-right: 1em;
        border-radius: 2em;
        padding: 0.1em 1em;
        color: white;
      }

      .button.highlight {
        background-color: black;
      }

      .button.default {
        backdrop-filter: blur(1em);
        color: white;
      }

      .icon {
        width: 16px;
        height: 16px;
        vertical-align: middle;
      }

      #popup {
        display: none;
        position: absolute;
        background: rgba(255, 255, 255, 0.6);
        color: black;
        border-radius: 8px;
        padding: 10px;
        backdrop-filter: blur(1em);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        pointer-events: none;
        z-index: 999;
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

  onRefPopup(div) {
    params.popup = div;
  }

  shouldShowGui() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('gui');
  }

  connectedCallback() {
    super.connectedCallback();

    if (this.url) {
      params.paths = {
        models_path: this.url + 'models/',
        textures_path: this.url + 'textures/',
        decoders_path: this.url + 'decoders/',
        assets_path: this.url + 'assets/',
      };
    }

    this.sub = appState.loading.subscribe((res) => {
      this.loading = res;
    });

    this.sub.add(
      appState.errors.subscribe((res) => {
        this.errors = res;
      })
    );

    if (!window.engine) {
      const settings = {};
      window.engine = new CreateScene(settings);
      window.engine.init(false, true);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.sub.unsubscribe();
  }

  async openModal() {
    this.isModalOpen = true;
    this.requestUpdate();
    setTimeout(() => {
      if (!window.engine) {
        const settings = {};
        window.engine = new CreateScene(settings);
        window.engine.init();
      } else {
        window.engine.init(true);
      }
    }, 1);
  }

  closeModal() {
    this.isModalOpen = false;
    this.requestUpdate();

    setTimeout(() => {
      if (window.engine) {
        window.engine.destroy();
      }
    }, 1);
  }

  changeZoom(zoom) {
    this.currentZoom = zoom;
    if (zoom === '1x') {
      window.engine.controls.zoomTo(
        params.controls.firstPerson.defaultZoom,
        true
      );
    }

    if (zoom === '2x') {
      window.engine.controls.zoomTo(params.controls.firstPerson.maxZoom, true);
    }

    if (zoom === '0.5x') {
      window.engine.controls.zoomTo(params.controls.firstPerson.minZoom, true);
    }
    window.engine.update();
    this.requestUpdate();
  }

  render() {
    return html`
      ${this.isModalOpen
        ? html`
            <div id="modal">
              <div
                id="modal-overlay"
                @click="${() => {
                  this.closeModal();
                }}"
              >
                <div id="modal-content" @click="${(e) => e.stopPropagation()}">
                  <div id="pano">
                    <div class="scene-wrapper">
                      <div class="scene" ${ref(this.onRef)}>
                        <div id="popup" ${ref(this.onRefPopup)}></div>
                      </div>

                      ${this.loading.isLoading
                        ? html`<div class="loading-overlay">
                            <div class="progress-bar-wrapper">
                              <div
                                class="progress-bar"
                                style="width:${this.loading.percent}%"
                              ></div>
                            </div>
                          </div>`
                        : nothing}
                      ${this.errors.isError
                        ? html`<div class="errors-overlay">
                            ${this.errors.message}
                            <div class="icon">
                              <svg
                                viewBox="0 0 50 50"
                                xmlns="http://www.w3.org/2000/svg"
                              >
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
                      ${!this.loading.isLoading && this.showGui
                        ? html`<gui-component></gui-component>`
                        : nothing}
                    </div>

                    <div class="button-container">
                      <div class="button-wrapper">
                        <div class="icon">
                          <svg
                            fill="white"
                            height="800px"
                            width="800px"
                            version="1.1"
                            id="Capa_1"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlns:xlink="http://www.w3.org/1999/xlink"
                            viewBox="0 0 490.4 490.4"
                            xml:space="preserve"
                          >
                            <g id="SVGRepo_bgCarrier" stroke-width="0" />

                            <g
                              id="SVGRepo_tracerCarrier"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />

                            <g id="SVGRepo_iconCarrier">
                              <g>
                                <path
                                  d="M484.1,454.796l-110.5-110.6c29.8-36.3,47.6-82.8,47.6-133.4c0-116.3-94.3-210.6-210.6-210.6S0,94.496,0,210.796 s94.3,210.6,210.6,210.6c50.8,0,97.4-18,133.8-48l110.5,110.5c12.9,11.8,25,4.2,29.2,0C492.5,475.596,492.5,463.096,484.1,454.796z M41.1,210.796c0-93.6,75.9-169.5,169.5-169.5s169.6,75.9,169.6,169.5s-75.9,169.5-169.5,169.5S41.1,304.396,41.1,210.796z"
                                />
                              </g>
                            </g>
                          </svg>
                        </div>
                        <button
                          class="button ${this.currentZoom === '0.5x'
                            ? 'highlight'
                            : 'default'}"
                          @click="${() => this.changeZoom('0.5x')}"
                        >
                          0.5 x
                        </button>
                        <button
                          class="button ${this.currentZoom === '1x'
                            ? 'highlight'
                            : 'default'}"
                          @click="${() => this.changeZoom('1x')}"
                        >
                          1 x
                        </button>
                        <button
                          class="button ${this.currentZoom === '2x'
                            ? 'highlight'
                            : 'default'}"
                          @click="${() => this.changeZoom('2x')}"
                        >
                          2 x
                        </button>
                      </div>
                    </div>

                    <div
                      style="position: absolute; top: 1em; right: 1em; z-index: 999"
                    >
                      <button id="closeModal" @click="${this.closeModal}">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `
        : nothing}

      <button id="openModal" @click="${this.openModal}">
        Open Pano
        ${this.loading.isLoading
          ? html`
              <div class="icon" style="display: inline-flex">
                <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill="white"
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
            `
          : nothing}
      </button>
    `;
  }
}

customElements.define('samara-scene', SceneComponent);
