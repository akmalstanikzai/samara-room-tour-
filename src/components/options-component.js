import { html, LitElement, nothing, css } from 'lit';
import { params } from '../3d/settings';
import { appState } from '../services/app-state';
import { auditTime } from 'rxjs/operators';

/** Options component */
export class OptionsComponent extends LitElement {
  constructor() {
    super();
  }

  static get styles() {
    return css`
      .picker-el {
        color: var(--white);
        cursor: pointer;
        background-color: #383838;
        border-radius: 0.5em;
        justify-content: center;
        align-items: center;
        margin: 0.875em 0;
        padding: 0.5em 1.5em;
        display: flex;
      }

      .picker-el:hover {
        opacity: 0.8;
      }

      .picker-el__wrapper {
        margin-left: 0.5em;
        margin-right: 0.5em;
      }

      .picker-el__active {
        box-shadow: 0 0 0.5em #00b0f0;
      }

      .picker-el__disabled {
        opacity: 0.3;
        pointer-events: none;
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

  connectedCallback() {
    super.connectedCallback();
    this.sub = appState.complectation.pipe(auditTime(50)).subscribe((res) => {
      this.requestUpdate();
    });
    this.sub.add(
      appState.modelLoadingIndicator.subscribe((res) => {
        this.modelLoadingIndicator = res;
      })
    );
    this.engine = window.engine;
  }

  static get properties() {
    return {
      parent: {},
      modelLoadingIndicator: { state: true },
    };
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.sub.unsubscribe();
  }

  firstUpdated() {}

  getClass(el, parent) {
    if (
      this.engine.options.checkOptionAdded(el, parent) &&
      ((el.include &&
        this.engine.options.checkSomeOptionInIncludeAdded(
          el.include,
          parent
        )) ||
        !el.include)
    ) {
      return 'picker-el picker-el__active';
    } else if (
      el.include &&
      !this.engine.options.checkSomeOptionInIncludeAdded(el.include, parent)
    ) {
      return 'picker-el picker-el__disabled';
    } else {
      return 'picker-el';
    }
  }

  render() {
    return html`
      <div class="menu-variant">
        ${params.models.samara.complectationVars[this.parent].variants.map(
          (el) =>
            html`<div class="picker-el__wrapper">
              <div
                @click="${async () => {
                  const camera =
                    params.models.samara.complectationVars[this.parent].camera;

                  const cameraSettings =
                    params.cameras[appState.complectation.value.layout][
                      appState.cam.value
                    ];

                  if (camera !== undefined) {
                    if (
                      (params.cameras[appState.complectation.value.layout] &&
                        appState.cam.value !== 'floor plan' &&
                        cameraSettings &&
                        cameraSettings.type &&
                        cameraSettings.type !== 'interior') ||
                      (!cameraSettings && appState.cam.value !== 'floor plan')
                    )
                      await this.engine.CameraGsap.setPosition(camera);
                  }

                  this.engine.options.setOption({
                    [this.parent.toLowerCase()]: el.name,
                  });
                }}"
                class=${this.getClass(el, this.parent)}
              >
                ${el.name}
                ${this.modelLoadingIndicator.isLoading &&
                this.modelLoadingIndicator.name === el.name
                  ? html` <div class="icon">
                      <svg
                        viewBox="0 0 50 50"
                        xmlns="http://www.w3.org/2000/svg"
                      >
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
                    </div>`
                  : nothing}
              </div>
            </div>`
        )}
      </div>
    `;
  }
}

customElements.define('options-component', OptionsComponent);
