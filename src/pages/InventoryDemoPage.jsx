import { useEffect } from 'react'
import { useInventoryStore } from '../store/useInventoryStore'
import InventoryScreen from '../components/inventory/InventoryScreen'

const MOCK_ITEMS = [
  { id: '1', name: 'Rusted Blade', icon: '🗡️', item_type: 'weapon', subtype: 'sword', rarity: 'common', equipped_slot: null, two_handed: false },
  { id: '2', name: 'Scavenger Helm', icon: '⛑️', item_type: 'armor', subtype: 'helmet', rarity: 'uncommon', equipped_slot: null },
  { id: '3', name: 'Void Cloak', icon: '🦺', item_type: 'cloak', subtype: 'cloak', rarity: 'rare', equipped_slot: null },
  { id: '4', name: 'Resonant Gloves', icon: '🧤', item_type: 'gloves', subtype: 'gloves', rarity: 'epic', equipped_slot: null },
  { id: '5', name: 'Ashwood Bow', icon: '🏹', item_type: 'weapon', subtype: 'bow', rarity: 'legendary', equipped_slot: null, two_handed: true },
  { id: '6', name: 'Scrap Ring', icon: '💍', item_type: 'accessory', subtype: 'ring', rarity: 'common', equipped_slot: null },
  { id: '7', name: 'Medical Pack', icon: '💊', item_type: 'consumable', subtype: 'consumable', rarity: 'common', equipped_slot: null },
]

export default function InventoryDemoPage() {
  useEffect(() => {
    useInventoryStore.setState({ items: MOCK_ITEMS, loading: false })
  }, [])
  return <InventoryScreen />
}
