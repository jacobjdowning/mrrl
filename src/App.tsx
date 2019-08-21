import React, { useState, useEffect, ChangeEvent, ReactComponentElement } from "react";
import "./App.scss";
import "./simple-grid.css";
import {RouteComponentProps} from "react-router-dom";

import WantedItems from "./components/WantedItems";
import { findRoute, RouteStep } from "./utils";
import Suggestions from "./components/Suggestions";
import Result from "./components/Result";
import ShareLink from "./components/ShareLink";
import {
  CostType,
  getItem,
  calculateRequiredMats,
  WantedItem,
  Materials,
  getOrderedMaterialsIds
} from "./data";

interface State {
  wantedItems: WantedItem[];
  route: RouteStep[];
  requiredMats: Materials;
  includeSecretShop: boolean;
  includeVendorPictures: boolean;
  selectedItems: { [itemId: number]: any };
}

const App: React.FC<RouteComponentProps> = ({location}) => {
  
  const getWantedItemsFromHash = () => {
    return getOrderedMaterialsIds().map((itemId, i) =>{
      const quantity = i+1 < location.hash.length ? +location.hash.charAt(i+1) : 0;
      return {
        itemId: itemId,
        quantity: quantity
      };
    }).filter(item => item.quantity > 0);
  };

  const getHashFromWantedItems = (wantedItems: WantedItem[]) => {
    return getOrderedMaterialsIds().reduce((acc:string, itemId:number) => {
      const item = wantedItems.find(item => item.itemId == itemId)
      if (item !== undefined){
        return acc.concat(item.toString());
      }else{
        return acc.concat('0');
      }
    }, '');
  };

  const [state, setState] = useState<State>({
    wantedItems: getWantedItemsFromHash(),
    route: [],
    requiredMats: { items: [], gold: 0 },
    includeSecretShop: true,
    includeVendorPictures: true,
    selectedItems: {}
  });

  useEffect(() => {
    calculateNewState(getWantedItemsFromHash());
  }, [location]);

  const onQuantityChange = (itemId: number, quantity: number) => {
    const newWantedItems = state.wantedItems.filter(wi => wi.itemId !== itemId);
    if (quantity > 0) {
      newWantedItems.push({ itemId, quantity });
    }

    calculateNewState(newWantedItems);
  };

  const calculateNewState = (wantedItems: WantedItem[]): void => {
    let requiredMats = calculateRequiredMats(wantedItems);
    let route = findRoute(requiredMats);

    setState(prevState => ({ ...prevState, wantedItems, route, requiredMats }));
  };

  const onItemSelected = (itemId: number, shiftDown: boolean) => {
    let newSelectedItems = { ...state.selectedItems };
    if (shiftDown) {
      newSelectedItems[itemId] = true;
      // Clear text selection.
      let selection = document.getSelection();
      if (selection != null) {
        selection.removeAllRanges();
      }
    } else {
      newSelectedItems = { [itemId]: true };
    }

    let wantedItems: WantedItem[] = [];

    for (let selectedItemId in newSelectedItems) {
      let item = getItem(+selectedItemId);

      if (item.cost.type === CostType.Items) {
        item.cost.items.forEach(({ itemId, quantity }) => {
          wantedItems.push({ itemId, quantity: quantity });
        });
      }
    }

    // Merge identical wanted items

    wantedItems = wantedItems.reduce((acc: any, val) => {
      let existingWantedItem = acc.find((wi: any) => wi.itemId === val.itemId);

      if (existingWantedItem != null) {
        existingWantedItem.quantity =
          existingWantedItem.quantity + val.quantity;
      } else {
        acc.push({ itemId: val.itemId, quantity: val.quantity });
      }

      return acc;
    }, []);

    setState(prevState => ({
      ...prevState,
      selectedItems: newSelectedItems
    }));

    calculateNewState(wantedItems);
  };

  const onSecretShopChangeChecked = (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;

    setState(prevState => ({
      ...prevState,
      includeSecretShop: checked
    }));
  };

  const onIncludeVendorPicturesChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const checked = event.target.checked;

    setState(prevState => ({
      ...prevState,
      includeVendorPictures: checked
    }));
  };

  return (
    <div className="App">
      <h1>
        Mrrl! (beta){" "}
        <span className="github">
          <a href="https://github.com/kevindqc/mrrl">
            <img
              src={
                process.env.PUBLIC_URL + "/images/GitHub-Mark-Light-32px.png"
              }
              alt="Github"
            />{" "}
          </a>
        </span>
      </h1>
      {/* <Suggestions
        onItemSelected={onItemSelected}
        includeSecretShop={state.includeSecretShop}
        selectedItems={state.selectedItems}
      /> */}
      <WantedItems
        onQuantityChange={onQuantityChange}
        wantedItems={state.wantedItems}
        includeSecretShop={state.includeSecretShop}
      />
      <label>
        <input
          type="checkbox"
          checked={state.includeSecretShop}
          onChange={onSecretShopChangeChecked}
        />
        Include secret shop (cloak required)
      </label>
      <br />
      <label>
        <input
          type="checkbox"
          checked={state.includeVendorPictures}
          onChange={onIncludeVendorPicturesChange}
        />
        Include vendor pictures
      </label>
      <Result
        route={state.route}
        requiredMats={state.requiredMats}
        includeVendorPictures={state.includeVendorPictures}
      />
      <ShareLink hash={getHashFromWantedItems(state.wantedItems)}/>
    </div>
  );
};

export default App;
