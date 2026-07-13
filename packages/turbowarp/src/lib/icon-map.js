import React from 'react';
import {
  Close, SettingsBackupRestore, Undo, Redo,
  ArrowDropDown, ArrowDropUp, ChevronRight,
  EditNote, SearchOff,
  Description, Settings, Code, GridView, Diamond, AdsClick,
  Explosion, AltRoute, Hardware, Bolt, SmartToy, Shield,
  WandStars, Factory, SatelliteAlt, WaterDrop, Public, Language, Trophy
} from '@nine-thirty-five/material-symbols-react/outlined';

const iconMap = {
  close: Close,
  settings_backup_restore: SettingsBackupRestore,
  undo: Undo,
  redo: Redo,
  expand_less: ArrowDropUp,
  expand_more: ArrowDropDown,
  chevron_right: ChevronRight,
  edit_note: EditNote,
  search_off: SearchOff,
  description: Description,
  settings: Settings,
  code: Code,
  grid_view: GridView,
  diamond: Diamond,
  ads_click: AdsClick,
  explosion: Explosion,
  alt_route: AltRoute,
  hardware: Hardware,
  bolt: Bolt,
  smart_toy: SmartToy,
  shield: Shield,
  auto_awesome: WandStars,
  factory: Factory,
  satellite_alt: SatelliteAlt,
  water_drop: WaterDrop,
  public: Public,
  language: Language,
  emoji_events: Trophy
};

export default iconMap;
export const getIcon = (name) => iconMap[name] || Description;
export const Icon = ({name, className, size}) => {
  const Component = iconMap[name] || Description;
  return <Component className={className} size={size} />;
};
