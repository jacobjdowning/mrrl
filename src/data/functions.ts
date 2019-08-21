import items from "./item";
import {
  Rarity,
  Vendor,
  Item,
  CostType,
  Materials,
  WantedItem
} from "./models";
import vendors from "./vendor";

let itemsById = items.reduce((map: any, item) => {
  map[item.itemId] = item;
  return map;
}, {});

function calculateItemIdToVendorMap(vendors: Vendor[]) {
  let result: { [itemId: number]: Vendor } = {};

  for (let i = 0; i < vendors.length; i++) {
    let vendor = vendors[i];
    for (let j = 0; j < vendor.inventory.length; j++) {
      let itemId = vendor.inventory[j];
      result[itemId] = vendor;
    }
  }

  return result;
}

export let vendorByItemId = calculateItemIdToVendorMap(vendors);

export function getItem(itemId: number): Item {
  return itemsById[itemId];
}

export function getMaterialsInput(): Item[] {
  return items
    .filter(
      i => !i.mrrl && (i.rarity === Rarity.Rare || i.rarity === Rarity.Epic)
    )
    .sort((a, b) => {
      if (a.rarity === b.rarity) {
        return a.name.localeCompare(b.name);
      }

      // Inverted to get Epic as first (descending).
      return b.rarity - a.rarity;
    });
}

export function getOrderedMaterialsIds(): number[] {
  return items.filter(
    i => !i.mrrl && (i.rarity === Rarity.Rare || i.rarity === Rarity.Epic)
  )
  .map(item => item.itemId)
  .sort();
}

export function getVendorItems(vendor: Vendor): Item[] {
  return vendor.inventory.map(itemId => itemsById[itemId]);
}

export function getVendorOfItem(itemId: number): Vendor {
  return vendorByItemId[itemId];
}

export function mergeMaterials(toMergeInto: Materials, toMergeFrom: Materials) {
  toMergeInto.gold = toMergeInto.gold + toMergeFrom.gold;

  toMergeFrom.items.forEach(item => {
    let foundItem = toMergeInto.items.find(i => i.itemId === item.itemId);
    if (foundItem) {
      foundItem.quantity = foundItem.quantity + item.quantity;
    } else {
      toMergeInto.items.push(item);
    }
  });
}

export function calculateRequiredMats(wantedItems: WantedItem[]): Materials {
  let combinedMats: Materials = { gold: 0, items: [] };

  wantedItems.forEach(item => {
    mergeMaterials(combinedMats, getCost(item.itemId, item.quantity));
  });

  return combinedMats;
}

export function getCost(itemId: number, quantity: number): Materials {
  // Add ourselves.
  let result = { gold: 0, items: [{ itemId, quantity }] };

  const item = getItem(itemId);

  if (item.cost.type === CostType.Gold) {
    mergeMaterials(result, {
      gold: quantity * item.cost.quantity,
      items: []
    });
  } else if (item.cost.type === CostType.Items) {
    for (let i = 0; i < item.cost.items.length; i++) {
      const innerItem = item.cost.items[i];
      const cost = getCost(innerItem.itemId, quantity * innerItem.quantity);

      mergeMaterials(result, cost);
    }
  }

  return result;
}
