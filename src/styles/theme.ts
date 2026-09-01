export const colors = {
  // background: #;

  primary: '#014D4D',
  primaryDark: '#D95E00',
  primaryLight: '#014D4D1A',
  primarySoft: '#014D4D1A',
  // background: #;


  secondary: '#FD7402',
  secondaryDark: '#014D4D',
  secondaryLight: '#DDF3F0',

  background: '#FD7402',
  screen: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F6F8F8',
  surfaceDark: '#103B37',

  text: '#14211F',
  textMuted: '#6F7D7A',
  textLight: '#FFFFFF',
  textDark: 'black',
  placeholder: '#9AA7A4',
  Searchplaceholder: '#FFFFFF99',

  border: '#E1E8E6',
  borderDark: '#B8C7C4',
  divider: '#EEF2F1',

  success: '#078C62',
  successSoft: '#E7F7F0',
  warning: '#F5A524',
  warningSoft: '#FFF6DF',
  error: '#D92D20',
  errorSoft: '#FDECEC',
  info: '#2563EB',
  infoSoft: '#EAF1FF',
  serachnputBorder:"#236E6E",

  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.45)',
  transparent: 'transparent',
} as const;

export const theme = {
  colors,
} as const;

export type Colors = typeof colors;
export type Theme = typeof theme;

export default theme;
