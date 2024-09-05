import { html, LitElement, nothing, css } from 'lit';
import { appState } from '../services/app-state';
import { params } from '../3d/settings';

export class MenuComponent extends LitElement {
  constructor() {
    super();
    this.isFloorPlan = false; // Default to showing the floor plan
  }

  static get properties() {
    return {
      cam: { state: true },
      isFloorPlan: { type: Boolean }, // Add a new state property
    };
  }

  static get styles() {
    return css`
      .menu {
        position: absolute;
        bottom: 3em;
        left: 50%;
        transform: translateX(-50%);
        display: inline-flex;
        font-size: 1.2em;
      }

      .picker {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 2em;
        color: white;
        padding: 0.5em;
        cursor: pointer;
        backdrop-filter: blur(1em);
        -webkit-backdrop-filter: blur(1em);
      }

      .picker + .picker {
        margin-left: 1em;
      }

      .icon {
        width: 1em;
        height: 1em;
        padding: 0.5em;
        overflow: hidden;
        border-radius: 50%;
        cursor: pointer;
      }

      .icon svg {
        width: 1em;
        height: 1em;
      }
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.engine = window.engine;
    this.sub = appState.cam.subscribe((res) => {
      this.cam = res;
    });

    this.sub.add(
      appState.complectation.subscribe((res) => {
        if (res.changedValue === 'layout') {
          this.isFloorPlan = false;
        }
      })
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  toggleView() {
    this.isFloorPlan = !this.isFloorPlan;
    if (this.isFloorPlan) {
      this.engine.plan.cutTop(true);
      this.engine.labels.addLabels();
      this.engine.CameraGsap.setCam('floor plan');
    } else {
      this.engine.CameraGsap.setCam('outside');
      this.engine.plan.cutTop(false);
      this.engine.labels.removeLabels();
      this.engine.cursor.pin.visible = false;
    }
    this.engine.update();
  }

  firstUpdated() {}

  render() {
    return html`
      <div class="menu">
        <div class="picker" @click="${this.toggleView}">
          ${!this.isFloorPlan ? 'Floor plan' : 'X'}
        </div>
      </div>
    `;
  }
}

customElements.define('menu-component', MenuComponent);
