import "@vaadin/vaadin-button";
import "@vaadin/vaadin-combo-box";
import "@vaadin/vaadin-text-field";
import L from "leaflet";
import {
  LitElement,
  state,
  html,
  property,
  customElement,
  css,
  query,
} from "lit-element";
import { UldkApi } from "./uldk-api";

interface uldkItem {
  name: string;
  teryt: string;
}

@customElement("uldk-popup")
class UldkPopup extends LitElement {
  constructor() {
    super();
  }
  static styles = css`
    :host {
      position: absolute;
      top: 230px;
      right: 0;
      padding: 10px;
      background-color: rgb(255 255 255 / 85%);
      min-width: 250px;
      overflow: auto;
      font-family: Bahnschrift;
      font-weight: bold;
    }

    vaadin-combo-box {
      width: 100%;
    }

    vaadin-text-field {
      width: 100%;
    }
  `;

  @state() geojsonLayer: any = undefined;

  @property({ type: String }) inputValue?: string;
  @property({ type: String }) inputValueTwo?: string;
  @property({ type: String }) inputValueThree?: string;
  @property({ type: Object }) map?: L.Map;
  @property({ type: String }) set selectedValue(selectedValue: string) {
    const oldValue = this._selectedValue;
    console.log(
      `[VALUES] \noldValue: ${this._selectedValue}, newValue: ${selectedValue}`,
    );
    this._selectedValue = selectedValue;
    this.requestUpdate("old value: ", oldValue);
  }

  @query("#voivodeship")
  voivodeshipNode: any;

  @query("#county")
  countyNode: any;

  @query("#commune")
  communeNode: any;

  @query("#region")
  regionNode: any;

  @query("#parcelNr")
  parcelInput: any;

  firstUpdated(props: any) {
    super.firstUpdated(props);
  }

  private _selectedValue!: string;
  private uldkapi: UldkApi = new UldkApi();

  async showPopup(
    type: string,
    teryt: string = "",
    voivodeship: any = "",
    county: any = "",
    commune: any = "",
    region: any = "",
    parcelId: any = "",
  ) {
    console.log(
      "DANE: \nteryt: ",
      teryt,
      "\nvoivodeship: ",
      voivodeship,
      "\ncounty: ",
      county,
      "\ncommune: ",
      commune,
      "\nregion: ",
      region,
      "\nparcelId: ",
      parcelId,
      "\n",
    );

    if (!this.geojsonLayer) {
      this.geojsonLayer = L.geoJSON(undefined, {
        onEachFeature: (feature, layer) => {
          layer.bindPopup(
            `<h3>DATA:</h3>
              <p><b>Teryt: </b>${feature.properties.teryt}</p>
              <p><b>Województwo: </b>${feature.properties.voivodeship}</p>
              <p><b>Powiat: </b>${feature.properties.county}</p>
              <p><b>Gmina: </b>${feature.properties.commune}</p>
              <p><b>Region: </b>${feature.properties.region}</p>
              <p><b>Nr działki: </b>${feature.properties.parcelId}</p>`,
          );
        },
      }).addTo(this.map!);
    }

    this.geojsonLayer.clearLayers();

    const wktJSON = await this.uldkapi.getParcelCustom(type, teryt, null);
    const dataJSON = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: wktJSON,
          properties: {
            teryt: teryt,
            voivodeship: voivodeship,
            county: county,
            commune: commune,
            region: region,
            parcelId: parcelId,
            underConstruction: false,
          },
          id: 1,
        },
      ],
    };

    if (!wktJSON) {
      return false;
    }

    this.geojsonLayer?.addData(dataJSON);
    this.map?.fitBounds(this.geojsonLayer.getBounds());

    return "";
  }

  render() {
    switch (this.selectedValue) {
      case "search_by_full_data": {
        return html`
          <vaadin-combo-box
            id="voivodeship"
            label="Wybierz województwo"
            clear-button-visible
            item-label-path="name"
            item-value-path="teryt"
            @selected-item-changed=${() => {
              this.countyNode.value = "";
              this.countyNode.items = [];
              this.countyNode.selectedItem = undefined;
            }}
            .dataProvider=${async (params, callback) => {
              let data = await this.uldkapi.getAdministrativeNames(
                "Wojewodztwo",
              );

              callback(data, data.length);
            }}
            @change=${async (e) => {
              this.countyNode.items = await this.uldkapi.getAdministrativeNames(
                "Powiat",
                e.target.value,
              );
            }}
          >
          </vaadin-combo-box>
          <vaadin-combo-box
            id="county"
            label="Wybierz powiat"
            clear-button-visible
            item-label-path="name"
            item-value-path="teryt"
            @selected-item-changed=${() => {
              this.communeNode.value = "";
              this.communeNode.items = [];
              this.communeNode.selectedItem = undefined;
            }}
            @change=${async (e) => {
              this.communeNode.items =
                await this.uldkapi.getAdministrativeNames(
                  "Gmina",
                  e.target.value,
                );
            }}
          >
          </vaadin-combo-box>
          <vaadin-combo-box
            id="commune"
            label="Wybierz gminę"
            clear-button-visible
            item-label-path="name"
            item-value-path="teryt"
            @selected-item-changed=${() => {
              this.regionNode.value = "";
              this.regionNode.items = [];
              this.regionNode.selectedItem = undefined;
            }}
            @change=${async (e) => {
              this.regionNode.items = await this.uldkapi.getAdministrativeNames(
                "Region",
                e.target.value,
              );
            }}
          >
          </vaadin-combo-box>
          <vaadin-combo-box
            id="region"
            label="Wybierz region"
            clear-button-visible
            item-label-path="name"
            item-value-path="teryt"
          >
          </vaadin-combo-box>
          <vaadin-text-field id="parcelNr" label="Podaj nr działki">
          </vaadin-text-field>
          <vaadin-button
            id="searchBtn"
            @click=${async () => {
              const teryt = `${this.regionNode?.value}.${this.parcelInput.value}`;
              const voivodeship =
                this.voivodeshipNode?.selectedItem?.name.split("|")[0];
              const county = this.countyNode?.selectedItem?.name.split("|")[0];
              const commune =
                this.communeNode?.selectedItem?.name.split("|")[0];
              const region = this.regionNode?.selectedItem?.name.split("|")[0];
              const parcelId = this.parcelInput.value.split("|")[0];

              console.log(
                await this.showPopup(
                  "Dzialka",
                  teryt,
                  voivodeship,
                  county,
                  commune,
                  region,
                  parcelId,
                ),
              );
            }}
            >Szukaj w ULDK</vaadin-button
          >
        `;
      }
      case "search_by_id": {
        return html`
          <vaadin-text-field
            label="Wpisz nr działki"
            clear-button-visible
            @value-changed="${this.onValueChanged}"
          >
          </vaadin-text-field>
          <vaadin-button
            id="searchBtn"
            @click=${async () => {
              const teryt = `${this.inputValue}`;
              const arrayOfParcel = await this.uldkapi.getParcelCustom(
                "Id",
                teryt,
                2,
              );

              if (!arrayOfParcel) {
                return false;
              }

              const voivodeship = arrayOfParcel[0];
              const county = arrayOfParcel[1];
              const commune = arrayOfParcel[2];
              const region = arrayOfParcel[3];
              const parcelId = arrayOfParcel[4].split(".").pop();

              console.log(
                await this.showPopup(
                  "Id",
                  teryt,
                  voivodeship,
                  county,
                  commune,
                  region,
                  parcelId,
                ),
              );
            }}
            >Szukaj w ULDK</vaadin-button
          >
        `;
      }
      case "search_by_xy": {
        return html`
          <vaadin-text-field
            label="Wpisz współrzędne x"
            clear-button-visible
            @value-changed="${this.onValueChanged}"
          >
          </vaadin-text-field>
          <vaadin-text-field
            label="Wpisz współrzędne y"
            clear-button-visible
            @value-changed="${this.onValueChangedTwo}"
          >
          </vaadin-text-field>
          <vaadin-text-field
            label="Wpisz współrzędne z"
            clear-button-visible
            @value-changed="${this.onValueChangedThree}"
          >
          </vaadin-text-field>
          <vaadin-button
            id="searchBtn"
            @click=${async () => {
              const teryt = `${this.inputValue},${this.inputValueTwo},${this.inputValueThree}`;
              const arrayOfParcel = await this.uldkapi.getParcelCustom(
                "XY",
                teryt,
                2,
              );

              if (!arrayOfParcel) {
                return false;
              }

              const voivodeship = arrayOfParcel[0];
              const county = arrayOfParcel[1];
              const commune = arrayOfParcel[2];
              const region = arrayOfParcel[3];
              const parcelId = arrayOfParcel[4].split(".").pop();

              await this.showPopup(
                "XY",
                teryt,
                voivodeship,
                county,
                commune,
                region,
                parcelId,
              );
            }}
            >Szukaj w ULDK</vaadin-button
          >
        `;
      }
    }
  }

  private onValueChanged(e) {
    this.inputValue = e.detail.value;
  }

  private onValueChangedTwo(e) {
    this.inputValueTwo = e.detail.value;
  }

  private onValueChangedThree(e) {
    this.inputValueThree = e.detail.value;
  }

  get selectedValue() {
    return this._selectedValue;
  }

  requestUpdate(name: PropertyKey, oldValue?: unknown) {
    return super.requestUpdate(name, oldValue);
  }
}
