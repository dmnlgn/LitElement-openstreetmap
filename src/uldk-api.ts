import "@vaadin/vaadin-button";
import "@vaadin/vaadin-combo-box";
import "@vaadin/vaadin-text-field";
import L from "leaflet";
import { customElement, state } from "lit/decorators.js";
import wellknown from "wellknown/wellknown.js";

import { LitElement } from "lit-element";

export interface uldkItem {
  name: string;
  teryt: string;
}

@customElement("uldk-api")
export class UldkApi extends LitElement {
  constructor() {
    super();
  }

  @state() search_types_by_option = {
    Wojewodztwo: {
      param: "GetVoivodeshipById",
      name: "voivodeship",
    },
    Powiat: {
      param: "GetCountyById",
      name: "county",
    },
    Gmina: {
      param: "GetCommuneById",
      name: "commune",
    },
    Region: {
      param: "GetRegionById",
      name: "region",
    },
    Dzialka: {
      param: "GetParcelById",
      name: "geom_wkt",
    },
    Id: {
      param: "GetParcelById",
      name: "geom_wkt",
    },
    XY: {
      param: "GetParcelByXY",
      name: "geom_wkt",
    },
  };

  wktToGeoJSON(wkt: string): GeoJSON.GeometryObject {
    return wellknown.parse(wkt);
  }

  async getAdministrativeNames(type: string, teryt: string = "") {
    const url = `https://uldk.gugik.gov.pl/?request=${this.search_types_by_option[type].param}&result=${this.search_types_by_option[type].name},teryt&id=${teryt}`;
    const text = await fetch(url).then((r) => r.text());
    const result = text.substring(1).trim();
    const arr = result.split("\n");
    let items: uldkItem[] = [];

    arr.forEach((item) => {
      const itemSplit = item.split("|");
      items.push({ name: itemSplit.join(" | "), teryt: itemSplit[1] });
    });

    return items;
  }

  async getParcelCustom(type: string, teryt: string = "", mode: any) {
    let url: any = "";

    if (type === "Id") {
      console.log("type: ID");
      url = `https://uldk.gugik.gov.pl/?request=${this.search_types_by_option[type].param}&id=${teryt}&result=geom_wkt,voivodeship,county,commune,region,id&srid=4326&id=${teryt}`;
    } else if (type === "XY") {
      console.log("type: XY");
      url = `https://uldk.gugik.gov.pl/?request=${this.search_types_by_option[type].param}&xy=${teryt}&result=&result=geom_wkt,voivodeship,county,commune,region,id&srid=4326&id=${teryt}`;
    } else if (type === "Dzialka") {
      console.log("type: Dzialka");
      url = `https://uldk.gugik.gov.pl/?request=${this.search_types_by_option[type].param}&result=${this.search_types_by_option[type].name}&srid=4326&id=${teryt}`;
    } else {
      return false;
    }
    const text = await fetch(url).then((r) => r.text());

    if (text.match("-1") || text.match("Blad")) {
      alert(text);
      return false;
    }

    const result = text.substring(1).trim();
    const wkt = (result.includes(";") ? result.split(";")[1] : result)
      ?.trim()
      .split("\n")[0];

    if (mode === 2) {
      let str = wkt.split("|");
      str.shift();
      return str;
    } else {
      const wktJSON = this.wktToGeoJSON(wkt);
      return wktJSON;
    }
  }
}
