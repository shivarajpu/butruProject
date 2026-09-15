import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useAppTheme } from '../theme/useAppTheme';
import type { AppTheme } from '../theme/types';

// Gradient IDs
const GRADIENT_INTRO_ID = 'gradIntro';
const GRADIENT_CONTACT_ID = 'gradContact';

// SVG Icons
const BACK_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="CURRENT_COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const PRIVACY_BADGE_ICON = `<svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 10C2.84167 9.70833 1.88542 9.04375 1.13125 8.00625C0.377083 6.96875 0 5.81667 0 4.55V1.5L4 0L8 1.5V4.55C8 5.81667 7.62292 6.96875 6.86875 8.00625C6.11458 9.04375 5.15833 9.70833 4 10ZM4 8.95C4.80833 8.7 5.48333 8.20625 6.025 7.46875C6.56667 6.73125 6.88333 5.90833 6.975 5H4V1.0625L1 2.1875V4.55C1 4.64167 1 4.71667 1 4.775C1 4.83333 1.00833 4.90833 1.025 5H4V8.95Z" fill="white"/>
</svg>
`;
const INFO_COLLECT_ICON = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.5 15C1.0875 15 0.734375 14.8531 0.440625 14.5594C0.146875 14.2656 0 13.9125 0 13.5V5.25C0 4.8375 0.146875 4.48438 0.440625 4.19063C0.734375 3.89688 1.0875 3.75 1.5 3.75H5.25V1.5C5.25 1.0875 5.39688 0.734375 5.69063 0.440625C5.98438 0.146875 6.3375 0 6.75 0H8.25C8.6625 0 9.01562 0.146875 9.30937 0.440625C9.60312 0.734375 9.75 1.0875 9.75 1.5V3.75H13.5C13.9125 3.75 14.2656 3.89688 14.5594 4.19063C14.8531 4.48438 15 4.8375 15 5.25V13.5C15 13.9125 14.8531 14.2656 14.5594 14.5594C14.2656 14.8531 13.9125 15 13.5 15H1.5ZM1.5 13.5H13.5V5.25H9.75C9.75 5.6625 9.60312 6.01562 9.30937 6.30937C9.01562 6.60312 8.6625 6.75 8.25 6.75H6.75C6.3375 6.75 5.98438 6.60312 5.69063 6.30937C5.39688 6.01562 5.25 5.6625 5.25 5.25H1.5V13.5ZM3 12H7.5V11.6625C7.5 11.45 7.44063 11.2531 7.32188 11.0719C7.20312 10.8906 7.0375 10.75 6.825 10.65C6.575 10.5375 6.32188 10.4531 6.06563 10.3969C5.80938 10.3406 5.5375 10.3125 5.25 10.3125C4.9625 10.3125 4.69062 10.3406 4.43437 10.3969C4.17812 10.4531 3.925 10.5375 3.675 10.65C3.4625 10.75 3.29688 10.8906 3.17812 11.0719C3.05937 11.2531 3 11.45 3 11.6625V12ZM9 10.875H12V9.75H9V10.875ZM5.25 9.75C5.5625 9.75 5.82812 9.64062 6.04688 9.42188C6.26562 9.20312 6.375 8.9375 6.375 8.625C6.375 8.3125 6.26562 8.04688 6.04688 7.82812C5.82812 7.60938 5.5625 7.5 5.25 7.5C4.9375 7.5 4.67188 7.60938 4.45312 7.82812C4.23438 8.04688 4.125 8.3125 4.125 8.625C4.125 8.9375 4.23438 9.20312 4.45312 9.42188C4.67188 9.64062 4.9375 9.75 5.25 9.75ZM9 8.625H12V7.5H9V8.625ZM6.75 5.25H8.25V1.5H6.75V5.25Z" fill="#B12B5B"/>
</svg>
`;
const USER_INFO_ICON = `<svg width="15" height="13" viewBox="0 0 15 13" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6 6C5.175 6 4.46875 5.70625 3.88125 5.11875C3.29375 4.53125 3 3.825 3 3C3 2.175 3.29375 1.46875 3.88125 0.88125C4.46875 0.29375 5.175 0 6 0C6.825 0 7.53125 0.29375 8.11875 0.88125C8.70625 1.46875 9 2.175 9 3C9 3.825 8.70625 4.53125 8.11875 5.11875C7.53125 5.70625 6.825 6 6 6ZM0 12V9.9C0 9.4875 0.10625 9.1 0.31875 8.7375C0.53125 8.375 0.825 8.1 1.2 7.9125C1.8375 7.5875 2.55625 7.3125 3.35625 7.0875C4.15625 6.8625 5.0375 6.75 6 6.75C6.1 6.75 6.1875 6.75 6.2625 6.75C6.3375 6.75 6.4125 6.7625 6.4875 6.7875C6.3875 7.0125 6.30312 7.24687 6.23438 7.49062C6.16563 7.73438 6.1125 7.9875 6.075 8.25H6C5.1125 8.25 4.31563 8.3625 3.60938 8.5875C2.90313 8.8125 2.325 9.0375 1.875 9.2625C1.7625 9.325 1.67188 9.4125 1.60312 9.525C1.53437 9.6375 1.5 9.7625 1.5 9.9V10.5H6.225C6.3 10.7625 6.4 11.0219 6.525 11.2781C6.65 11.5344 6.7875 11.775 6.9375 12H0ZM10.5 12.75L10.275 11.625C10.125 11.5625 9.98438 11.4969 9.85312 11.4281C9.72187 11.3594 9.5875 11.275 9.45 11.175L8.3625 11.5125L7.6125 10.2375L8.475 9.4875C8.45 9.3125 8.4375 9.15 8.4375 9C8.4375 8.85 8.45 8.6875 8.475 8.5125L7.6125 7.7625L8.3625 6.4875L9.45 6.825C9.5875 6.725 9.72187 6.64062 9.85312 6.57188C9.98438 6.50313 10.125 6.4375 10.275 6.375L10.5 5.25H12L12.225 6.375C12.375 6.4375 12.5156 6.50625 12.6469 6.58125C12.7781 6.65625 12.9125 6.75 13.05 6.8625L14.1375 6.4875L14.8875 7.8L14.025 8.55C14.05 8.7 14.0625 8.85625 14.0625 9.01875C14.0625 9.18125 14.05 9.3375 14.025 9.4875L14.8875 10.2375L14.1375 11.5125L13.05 11.175C12.9125 11.275 12.7781 11.3594 12.6469 11.4281C12.5156 11.4969 12.375 11.5625 12.225 11.625L12 12.75H10.5ZM11.25 10.5C11.6625 10.5 12.0156 10.3531 12.3094 10.0594C12.6031 9.76562 12.75 9.4125 12.75 9C12.75 8.5875 12.6031 8.23438 12.3094 7.94063C12.0156 7.64688 11.6625 7.5 11.25 7.5C10.8375 7.5 10.4844 7.64688 10.1906 7.94063C9.89688 8.23438 9.75 8.5875 9.75 9C9.75 9.4125 9.89688 9.76562 10.1906 10.0594C10.4844 10.3531 10.8375 10.5 11.25 10.5ZM6 4.5C6.4125 4.5 6.76562 4.35312 7.05937 4.05937C7.35312 3.76562 7.5 3.4125 7.5 3C7.5 2.5875 7.35312 2.23438 7.05937 1.94062C6.76562 1.64687 6.4125 1.5 6 1.5C5.5875 1.5 5.23438 1.64687 4.94063 1.94062C4.64688 2.23438 4.5 2.5875 4.5 3C4.5 3.4125 4.64688 3.76562 4.94063 4.05937C5.23438 4.35312 5.5875 4.5 6 4.5Z" fill="#B12B5B"/>
</svg>
`;
const SHIELD_PROTECT_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#B12B5B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SHARE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="#B12B5B" stroke-width="2"/><circle cx="6" cy="12" r="3" stroke="#B12B5B" stroke-width="2"/><circle cx="18" cy="19" r="3" stroke="#B12B5B" stroke-width="2"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="#B12B5B" stroke-width="2"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="#B12B5B" stroke-width="2"/></svg>`;
const COOKIE_ICON = `<svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.5 15.0188C6.4625 15.0188 5.4875 14.8219 4.575 14.4281C3.6625 14.0344 2.86875 13.5 2.19375 12.825C1.51875 12.15 0.984375 11.3563 0.590625 10.4438C0.196875 9.53125 0 8.55625 0 7.51875C0 6.58125 0.18125 5.6625 0.54375 4.7625C0.90625 3.8625 1.4125 3.05938 2.0625 2.35313C2.7125 1.64688 3.49375 1.07812 4.40625 0.646875C5.31875 0.215625 6.31875 0 7.40625 0C7.66875 0 7.9375 0.0125 8.2125 0.0375C8.4875 0.0625 8.76875 0.10625 9.05625 0.16875C8.94375 0.73125 8.98125 1.2625 9.16875 1.7625C9.35625 2.2625 9.6375 2.67813 10.0125 3.00938C10.3875 3.34063 10.8344 3.56875 11.3531 3.69375C11.8719 3.81875 12.4062 3.7875 12.9563 3.6C12.6313 4.3375 12.6781 5.04375 13.0969 5.71875C13.5156 6.39375 14.1375 6.74375 14.9625 6.76875C14.975 6.90625 14.9844 7.03437 14.9906 7.15312C14.9969 7.27187 15 7.4 15 7.5375C15 8.5625 14.8031 9.52812 14.4094 10.4344C14.0156 11.3406 13.4812 12.1344 12.8062 12.8156C12.1312 13.4969 11.3375 14.0344 10.425 14.4281C9.5125 14.8219 8.5375 15.0188 7.5 15.0188ZM6.375 6.01875C6.6875 6.01875 6.95312 5.90938 7.17188 5.69063C7.39062 5.47188 7.5 5.20625 7.5 4.89375C7.5 4.58125 7.39062 4.31563 7.17188 4.09688C6.95312 3.87813 6.6875 3.76875 6.375 3.76875C6.0625 3.76875 5.79688 3.87813 5.57812 4.09688C5.35938 4.31563 5.25 4.58125 5.25 4.89375C5.25 5.20625 5.35938 5.47188 5.57812 5.69063C5.79688 5.90938 6.0625 6.01875 6.375 6.01875ZM4.875 9.76875C5.1875 9.76875 5.45312 9.65938 5.67188 9.44063C5.89062 9.22188 6 8.95625 6 8.64375C6 8.33125 5.89062 8.06563 5.67188 7.84688C5.45312 7.62813 5.1875 7.51875 4.875 7.51875C4.5625 7.51875 4.29688 7.62813 4.07812 7.84688C3.85938 8.06563 3.75 8.33125 3.75 8.64375C3.75 8.95625 3.85938 9.22188 4.07812 9.44063C4.29688 9.65938 4.5625 9.76875 4.875 9.76875ZM9.75 10.5188C9.9625 10.5188 10.1406 10.4469 10.2844 10.3031C10.4281 10.1594 10.5 9.98125 10.5 9.76875C10.5 9.55625 10.4281 9.37813 10.2844 9.23438C10.1406 9.09062 9.9625 9.01875 9.75 9.01875C9.5375 9.01875 9.35938 9.09062 9.21562 9.23438C9.07187 9.37813 9 9.55625 9 9.76875C9 9.98125 9.07187 10.1594 9.21562 10.3031C9.35938 10.4469 9.5375 10.5188 9.75 10.5188ZM7.5 13.5188C9.025 13.5188 10.3781 12.9938 11.5594 11.9438C12.7406 10.8938 13.3875 9.55625 13.5 7.93125C12.875 7.65625 12.3844 7.28125 12.0281 6.80625C11.6719 6.33125 11.4312 5.8 11.3062 5.2125C10.3438 5.075 9.51875 4.6625 8.83125 3.975C8.14375 3.2875 7.71875 2.4625 7.55625 1.5C6.55625 1.475 5.67812 1.65625 4.92188 2.04375C4.16563 2.43125 3.53438 2.92812 3.02813 3.53437C2.52187 4.14062 2.14062 4.8 1.88437 5.5125C1.62812 6.225 1.5 6.89375 1.5 7.51875C1.5 9.18125 2.08437 10.5969 3.25312 11.7656C4.42188 12.9344 5.8375 13.5188 7.5 13.5188Z" fill="#B12B5B"/>
</svg>
`;
const RIGHTS_ICON = `<svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.5 15C1.0875 15 0.734375 14.8531 0.440625 14.5594C0.146875 14.2656 0 13.9125 0 13.5V3C0 2.5875 0.146875 2.23438 0.440625 1.94062C0.734375 1.64687 1.0875 1.5 1.5 1.5H4.65C4.825 1.05 5.1 0.6875 5.475 0.4125C5.85 0.1375 6.275 0 6.75 0C7.225 0 7.65 0.1375 8.025 0.4125C8.4 0.6875 8.675 1.05 8.85 1.5H12C12.4125 1.5 12.7656 1.64687 13.0594 1.94062C13.3531 2.23438 13.5 2.5875 13.5 3V13.5C13.5 13.9125 13.3531 14.2656 13.0594 14.5594C12.7656 14.8531 12.4125 15 12 15H1.5ZM6.75 2.4375C6.9125 2.4375 7.04688 2.38438 7.15312 2.27813C7.25937 2.17188 7.3125 2.0375 7.3125 1.875C7.3125 1.7125 7.25937 1.57812 7.15312 1.47187C7.04688 1.36562 6.9125 1.3125 6.75 1.3125C6.5875 1.3125 6.45312 1.36562 6.34688 1.47187C6.24063 1.57812 6.1875 1.7125 6.1875 1.875C6.1875 2.0375 6.24063 2.17188 6.34688 2.27813C6.45312 2.38438 6.5875 2.4375 6.75 2.4375ZM1.5 12.6375C2.175 11.975 2.95938 11.4531 3.85313 11.0719C4.74688 10.6906 5.7125 10.5 6.75 10.5C7.7875 10.5 8.75313 10.6906 9.64688 11.0719C10.5406 11.4531 11.325 11.975 12 12.6375V3H1.5V12.6375ZM6.75 9C7.475 9 8.09375 8.74375 8.60625 8.23125C9.11875 7.71875 9.375 7.1 9.375 6.375C9.375 5.65 9.11875 5.03125 8.60625 4.51875C8.09375 4.00625 7.475 3.75 6.75 3.75C6.025 3.75 5.40625 4.00625 4.89375 4.51875C4.38125 5.03125 4.125 5.65 4.125 6.375C4.125 7.1 4.38125 7.71875 4.89375 8.23125C5.40625 8.74375 6.025 9 6.75 9ZM3 13.5H10.5C10.5 13.4625 10.5 13.4312 10.5 13.4062C10.5 13.3813 10.5 13.35 10.5 13.3125C9.975 12.875 9.39375 12.5469 8.75625 12.3281C8.11875 12.1094 7.45 12 6.75 12C6.05 12 5.38125 12.1094 4.74375 12.3281C4.10625 12.5469 3.525 12.875 3 13.3125C3 13.35 3 13.3813 3 13.4062C3 13.4312 3 13.4625 3 13.5ZM6.75 7.5C6.4375 7.5 6.17188 7.39062 5.95312 7.17188C5.73438 6.95312 5.625 6.6875 5.625 6.375C5.625 6.0625 5.73438 5.79688 5.95312 5.57812C6.17188 5.35938 6.4375 5.25 6.75 5.25C7.0625 5.25 7.32812 5.35938 7.54688 5.57812C7.76562 5.79688 7.875 6.0625 7.875 6.375C7.875 6.6875 7.76562 6.95312 7.54688 7.17188C7.32812 7.39062 7.0625 7.5 6.75 7.5Z" fill="#B12B5B"/>
</svg>


`;
const HISTORY_ICON = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.75 13.5C5.8125 13.5 4.93437 13.3219 4.11562 12.9656C3.29688 12.6094 2.58437 12.1281 1.97812 11.5219C1.37188 10.9156 0.890625 10.2031 0.534375 9.38437C0.178125 8.56562 0 7.6875 0 6.75C0 5.8125 0.178125 4.93437 0.534375 4.11562C0.890625 3.29688 1.37188 2.58437 1.97812 1.97812C2.58437 1.37188 3.29688 0.890625 4.11562 0.534375C4.93437 0.178125 5.8125 0 6.75 0C7.775 0 8.74687 0.21875 9.66562 0.65625C10.5844 1.09375 11.3625 1.7125 12 2.5125V0.75H13.5V5.25H9V3.75H11.0625C10.55 3.05 9.91875 2.5 9.16875 2.1C8.41875 1.7 7.6125 1.5 6.75 1.5C5.2875 1.5 4.04688 2.00938 3.02813 3.02813C2.00938 4.04688 1.5 5.2875 1.5 6.75C1.5 8.2125 2.00938 9.45312 3.02813 10.4719C4.04688 11.4906 5.2875 12 6.75 12C8.0625 12 9.20938 11.575 10.1906 10.725C11.1719 9.875 11.75 8.8 11.925 7.5H13.4625C13.275 9.2125 12.5406 10.6406 11.2594 11.7844C9.97812 12.9281 8.475 13.5 6.75 13.5ZM8.85 9.9L6 7.05V3H7.5V6.45L9.9 8.85L8.85 9.9Z" fill="#B12B5B"/>
</svg>
`;
const CONSENT_ICON = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.45 10.95L11.7375 5.6625L10.6875 4.6125L6.45 8.85L4.3125 6.7125L3.2625 7.7625L6.45 10.95ZM7.5 15C6.4625 15 5.4875 14.8031 4.575 14.4094C3.6625 14.0156 2.86875 13.4812 2.19375 12.8062C1.51875 12.1312 0.984375 11.3375 0.590625 10.425C0.196875 9.5125 0 8.5375 0 7.5C0 6.4625 0.196875 5.4875 0.590625 4.575C0.984375 3.6625 1.51875 2.86875 2.19375 2.19375C2.86875 1.51875 3.6625 0.984375 4.575 0.590625C5.4875 0.196875 6.4625 0 7.5 0C8.5375 0 9.5125 0.196875 10.425 0.590625C11.3375 0.984375 12.1312 1.51875 12.8062 2.19375C13.4812 2.86875 14.0156 3.6625 14.4094 4.575C14.8031 5.4875 15 6.4625 15 7.5C15 8.5375 14.8031 9.5125 14.4094 10.425C14.0156 11.3375 13.4812 12.1312 12.8062 12.8062C12.1312 13.4812 11.3375 14.0156 10.425 14.4094C9.5125 14.8031 8.5375 15 7.5 15ZM7.5 13.5C9.175 13.5 10.5938 12.9188 11.7563 11.7563C12.9188 10.5938 13.5 9.175 13.5 7.5C13.5 5.825 12.9188 4.40625 11.7563 3.24375C10.5938 2.08125 9.175 1.5 7.5 1.5C5.825 1.5 4.40625 2.08125 3.24375 3.24375C2.08125 4.40625 1.5 5.825 1.5 7.5C1.5 9.175 2.08125 10.5938 3.24375 11.7563C4.40625 12.9188 5.825 13.5 7.5 13.5Z" fill="#B12B5B"/>
</svg>
`;
const MAIL_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#B12B5B" stroke-width="2"/><path d="M22 6l-10 7L2 6" stroke="#B12B5B" stroke-width="2"/></svg>`;
const MAIL_WHITE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#FFF" stroke-width="2"/><path d="M22 6l-10 7L2 6" stroke="#FFF" stroke-width="2"/></svg>`;

type ClauseItem = {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  highlightText?: string;
};

const CLAUSES_DATA: ClauseItem[] = [
  {
    id: '1',
    code: 'CLAUSE 01',
    title: 'Information Collection',
    description:
      'We collect personal information such as your name, address, email, phone number, and payment details when you make a purchase or sign up for updates.',
    icon: INFO_COLLECT_ICON,
  },
  {
    id: '2',
    code: 'CLAUSE 02',
    title: 'Use of Information',
    description:
      'Your information is used to process orders, deliver products, and communicate with you about your purchases. We may also use your email to send promotional offers, which you can opt out of anytime.',
    icon: USER_INFO_ICON,
  },
  {
    id: '3',
    code: 'CLAUSE 03',
    title: 'Data Protection',
    description:
      'We implement security measures to protect your data from unauthorized access. Payment information is processed securely through trusted third-party gateways.',
    icon: SHIELD_PROTECT_ICON,
  },
  {
    id: '4',
    code: 'CLAUSE 04',
    title: 'Sharing of Information',
    description:
      'We do not sell or rent your personal information. We may share your data with trusted partners for delivery purposes.',
    icon: SHARE_ICON,
  },
  {
    id: '5',
    code: 'CLAUSE 05',
    title: 'Cookies',
    description:
      'Our website uses cookies to improve your browsing experience. You can manage cookies through your browser settings.',
    icon: COOKIE_ICON,
  },
  {
    id: '6',
    code: 'CLAUSE 06',
    title: 'Your Rights',
    description:
      'You have the right to access, update, or delete your personal information. Contact us at hellobutru@gmail.com to make any changes.',
    icon: RIGHTS_ICON,
    highlightText: 'hellobutru@gmail.com',
  },
  {
    id: '7',
    code: 'CLAUSE 07',
    title: 'Changes to the Policy',
    description:
      'We may update this Privacy Policy from time to time. Any changes will be posted on this page.',
    icon: HISTORY_ICON,
  },
  {
    id: '8',
    code: 'CLAUSE 08',
    title: 'Consent',
    description:
      'By using our website, you consent to the collection and use of your information as outlined in this Privacy Policy. For questions, please contact us at hellobutru@gmail.com.',
    icon: CONSENT_ICON,
    highlightText: 'hellobutru@gmail.com',
  },
];

export default function PrivacyPolicyScreen({ navigation }: any) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const handleEmailPress = () => {
    Linking.openURL('mailto:hellobutru@gmail.com');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
          activeOpacity={0.7}>
          <SvgXml
            xml={BACK_ICON.replace('CURRENT_COLOR', theme.colors.text || '#1F2937')}
            width={18}
            height={18}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}>

        {/* Intro Card */}
        <View style={styles.introCard}>
          <Svg style={styles.gradientFill} width="100%" height="100%">
            <Defs>
              <LinearGradient id={GRADIENT_INTRO_ID} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#FFF0F5" />
                <Stop offset="1" stopColor="#FDF2F8" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${GRADIENT_INTRO_ID})`} rx={16} />
          </Svg>
          <View style={styles.introHeaderRow}>
            <View style={styles.badge}>
              <View style={styles.badgeIconContainer}>
                <SvgXml xml={PRIVACY_BADGE_ICON} width={12} height={12} />
              </View>
              <Text style={styles.badgeText}>Privacy Policy</Text>
            </View>
            <Text style={styles.policySubtext}>Data Protection</Text>
          </View>
          <Text style={styles.introText}>
            We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you shop with us.
          </Text>
        </View>

        {/* Clauses List */}
        {CLAUSES_DATA.map(item => (
          <View key={item.id} style={styles.clauseCard}>
            <View style={styles.clauseHeader}>
              <View style={styles.iconCircle}>
                <SvgXml xml={item.icon} width={16} height={16} />
              </View>
              <View style={styles.clauseTitleContainer}>
                <Text style={styles.clauseCode}>{item.code}</Text>
                <Text style={styles.clauseTitle}>{item.title}</Text>
              </View>
            </View>

            <Text style={styles.clauseDescription}>
              {item.highlightText && item.description.includes(item.highlightText) ? (
                <>
                  {item.description.split(item.highlightText)[0]}
                  <Text style={styles.emailHighlight}>{item.highlightText}</Text>
                  {item.description.split(item.highlightText)[1]}
                </>
              ) : (
                item.description
              )}
            </Text>
          </View>
        ))}

        {/* Contact Customer Care Card */}
        <View style={styles.contactCard}>
          <Svg style={styles.gradientFill} width="100%" height="100%">
            <Defs>
              <LinearGradient id={GRADIENT_CONTACT_ID} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#FFF0F5" />
                <Stop offset="1" stopColor="#FDF2F8" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${GRADIENT_CONTACT_ID})`} rx={16} />
          </Svg>
          <View style={styles.contactHeader}>
            <View style={styles.iconCircle}>
              <SvgXml xml={MAIL_ICON} width={16} height={16} />
            </View>
            <Text style={styles.contactTitle}>Contact Customer Care</Text>
          </View>

          <Text style={styles.contactText}>
            For any questions or concerns regarding privacy, feel free to contact our customer care team at hellobutru@gmail.com.
          </Text>

          <TouchableOpacity
            style={styles.emailButton}
            onPress={handleEmailPress}
            activeOpacity={0.8}>
            <SvgXml
              xml={MAIL_WHITE_ICON}
              width={16}
              height={16}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.emailButtonText}>
              Email Us (hellobutru@gmail.com)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          © 2024 Butru. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: AppTheme) => {
  const { colors, fontFamily } = theme;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface || '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface || '#FFFFFF',
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 16,
      fontFamily: fontFamily.heading,
      color: colors.text,
    },
    container: {
      flex: 1,
      backgroundColor: colors.backgroundColor || '#FAFAFA',
    },
    contentContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 24,
    },
    gradientFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },

    /* Intro Card */
    introCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.divider,
      overflow: 'hidden',
    },
    introHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
    },
    badgeIconContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6,
    },
    badgeText: {
      color: colors.textOnPrimary,
      fontSize: 11,
      fontFamily: fontFamily.bold,
    },
    policySubtext: {
      color: colors.primary,
      fontSize: 11,
      fontFamily: fontFamily.bold,
    },
    introText: {
      fontSize: 12,
      color: '#500724',
      lineHeight: 19.5,
      letterSpacing: 0,
      fontFamily: fontFamily.regular,
    },

    /* Clause Card */
    clauseCard: {
      backgroundColor: colors.primaryLight,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    clauseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 12,
      backgroundColor: '#FDF2F8',
      borderWidth: 1,
      borderColor: colors.divider,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    clauseTitleContainer: {
      flex: 1,
    },
    clauseCode: {
      fontSize: 10,
      fontFamily: fontFamily.bold,
      color: '#B12B5B',
      lineHeight: 15,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    clauseTitle: {
      fontSize: 14,
      fontFamily: fontFamily.bold,
      color: '#1B1B21',
      lineHeight: 20,
      marginTop: 1,
    },
    clauseDescription: {
      fontSize: 12,
      color: '#5A4044',
      lineHeight: 19.5,
      letterSpacing: 0,
      fontFamily: fontFamily.regular,
    },
    emailHighlight: {
      color: '#B12B5B',
      fontFamily: fontFamily.bold,
    },

    /* Contact Card */
    contactCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.divider,
      overflow: 'hidden',
    },
    contactHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    contactTitle: {
      fontSize: 14,
      fontFamily: fontFamily.bold,
      color: '#1B1B21',
      lineHeight: 20,
    },
    contactText: {
      fontSize: 12,
      color: '#5A4044',
      lineHeight: 19.5,
      letterSpacing: 0,
      marginBottom: 14,
      fontFamily: fontFamily.regular,
    },
    emailButton: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emailButtonText: {
      color: colors.textOnPrimary,
      fontSize: 12,
      fontFamily: fontFamily.bold,
    },

    /* Footer */
    footerText: {
      textAlign: 'center',
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 4,
      fontFamily: fontFamily.regular,
    },
  });
};