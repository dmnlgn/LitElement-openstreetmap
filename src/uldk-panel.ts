import "@vaadin/vaadin-radio-button/vaadin-radio-button.js";
import "@vaadin/vaadin-radio-button/vaadin-radio-group.js";
import L from "leaflet";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import "./uldk-popup";

@customElement("uldk-panel")
export class UldkPanel extends LitElement {
  constructor() {
    super();
    this.selectedValue = "search_by_full_data";
  }

  static styles = css`
    :host {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 10px;
      background-color: rgb(255 255 255 / 85%);
      font-family: Bahnschrift;
      font-weight: bold;
      min-width: 250px;
    }
  `;

  @property({ type: String }) selectedValue?: string;
  @property({ type: Object }) map?: L.Map;

  render() {
    return html`
      <h2>Wyszukiwarka działek</h2>
      <vaadin-radio-group
        id="radio"
        @value-changed="${this.onValueChanged}"
        .value="${this.selectedValue}"
        label="Wybierz typ wyszukiwania"
      >
        <vaadin-radio-button value="search_by_full_data"
          >DATA</vaadin-radio-button
        >
        <vaadin-radio-button value="search_by_id">ID</vaadin-radio-button>
        <vaadin-radio-button value="search_by_xy">XY</vaadin-radio-button>
      </vaadin-radio-group>
      <p>Selected: ${this.selectedValue}</p>
      <uldk-popup
        .map=${this.map}
        .selectedValue=${this.selectedValue}
      ></uldk-popup>
    `;
  }

  onValueChanged(e) {
    this.selectedValue = e.detail.value;
  }
}

// request o kliknięcie na mapie
//https://uldk.gugik.gov.pl/?request=GetParcelByXY&result=teryt,region,voivodeship,geom_wkt&xy=23.0890058083815,52.0452642329098,4326
//22.5320409,51.2430533,4326
//066301_1.0021.AR_7.23
